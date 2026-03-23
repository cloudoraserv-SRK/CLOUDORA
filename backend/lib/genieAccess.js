import crypto from "crypto";
import { supabase } from "./supabaseClient.js";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getSecret() {
  return process.env.GENIE_TOKEN_SECRET || process.env.OPENAI_API_KEY || "genie-dev-secret";
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function parseApprovedMembers() {
  const raw = String(process.env.GENIE_APPROVED_MEMBERS || "").trim();
  if (!raw) return [];

  return raw
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(":");
      let memberId = "";
      let code = "";
      let tier = "business";
      let label = "Approved Member";

      if (parts.length >= 4) {
        [memberId, code, tier = "business", label = "Approved Member"] = parts;
      } else {
        [code, tier = "business", label = "Approved Member"] = parts;
      }

      return {
        memberId: String(memberId || "").trim(),
        code: String(code || "").trim(),
        membershipTier: String(tier || "business").trim().toLowerCase(),
        label: String(label || "Approved Member").trim()
      };
    })
    .filter((entry) => entry.code);
}

export function resolveMember({ membershipTier = "free", accessCode = "", memberId = "" } = {}) {
  const approved = parseApprovedMembers();
  const normalizedCode = String(accessCode || "").trim();
  const normalizedMemberId = String(memberId || "").trim().toLowerCase();
  const matched = approved.find((entry) => {
    if (entry.code !== normalizedCode) return false;
    if (!entry.memberId) return true;
    return entry.memberId.toLowerCase() === normalizedMemberId;
  });

  if (!matched) {
    return {
      membershipTier: "free",
      fullAccess: false,
      trialMode: true,
      label: "Free Trial",
      memberId: ""
    };
  }

  return {
    membershipTier: matched.membershipTier || String(membershipTier || "business").trim().toLowerCase(),
    fullAccess: true,
    trialMode: false,
    label: matched.label,
    memberId: matched.memberId || normalizedMemberId || matched.label
  };
}

export function createMemberToken(member) {
  const payload = {
    membershipTier: member.membershipTier,
    fullAccess: Boolean(member.fullAccess),
    trialMode: Boolean(member.trialMode),
    label: member.label || "Approved Member",
    memberId: member.memberId || "",
    exp: Date.now() + TOKEN_TTL_MS
  };

  const encoded = base64url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyMemberToken(token = "") {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) return null;
  if (sign(encoded) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getMemberFromRequest(req) {
  const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const token = bearer || String(req.headers["x-genie-token"] || req.body?.memberToken || "").trim();
  const verified = token ? verifyMemberToken(token) : null;

  if (verified) {
    return {
      membershipTier: verified.membershipTier,
      fullAccess: Boolean(verified.fullAccess),
      trialMode: Boolean(verified.trialMode),
      label: verified.label || "Approved Member",
      memberId: verified.memberId || "",
      memberToken: token
    };
  }

  return resolveMember({
    membershipTier: req.body?.membershipTier || "free",
    accessCode: req.body?.accessCode || req.headers["x-genie-access-code"] || "",
    memberId: req.body?.memberId || req.headers["x-genie-member-id"] || ""
  });
}

export async function resolveMemberAsync({ membershipTier = "free", accessCode = "", memberId = "" } = {}) {
  const normalizedCode = String(accessCode || "").trim();
  const normalizedMemberId = String(memberId || "").trim();

  if (normalizedCode) {
    try {
      let query = supabase
        .from("genie_members")
        .select("member_id, access_code, tier, name, status")
        .eq("access_code", normalizedCode)
        .limit(1);

      if (normalizedMemberId) {
        query = query.eq("member_id", normalizedMemberId);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data && String(data.status || "active").toLowerCase() === "active") {
        return {
          memberId: String(data.member_id || normalizedMemberId || "").trim(),
          membershipTier: String(data.tier || membershipTier || "business").trim().toLowerCase(),
          fullAccess: true,
          trialMode: false,
          label: String(data.name || data.member_id || "Approved Member").trim()
        };
      }
    } catch {
      // fall through to env-based resolution
    }
  }

  return resolveMember({ membershipTier, accessCode, memberId });
}

export async function getMemberFromRequestAsync(req) {
  const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const token = bearer || String(req.headers["x-genie-token"] || req.body?.memberToken || "").trim();
  const verified = token ? verifyMemberToken(token) : null;

  if (verified) {
    return {
      membershipTier: verified.membershipTier,
      fullAccess: Boolean(verified.fullAccess),
      trialMode: Boolean(verified.trialMode),
      label: verified.label || "Approved Member",
      memberId: verified.memberId || "",
      memberToken: token
    };
  }

  return resolveMemberAsync({
    membershipTier: req.body?.membershipTier || "free",
    accessCode: req.body?.accessCode || req.headers["x-genie-access-code"] || "",
    memberId: req.body?.memberId || req.headers["x-genie-member-id"] || ""
  });
}
