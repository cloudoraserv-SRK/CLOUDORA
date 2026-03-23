import express from "express";
import OpenAI from "openai";
import { queryGenieKB } from "../lib/genieKB.js";
import { supabase } from "../lib/supabaseClient.js";
import { askGenie } from "../lib/genieAI.js";
import {
  createMemberToken,
  getMemberFromRequest,
  getMemberFromRequestAsync,
  resolveMemberAsync
} from "../lib/genieAccess.js";
import {
  enforceTrialAccess,
  getClientIdFromRequest,
  getMemberProfile,
  getUsageSnapshot,
  logGenieUsage,
  saveMemberProfile
} from "../lib/genieUsage.js";

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =======================
   CHAT MEMORY
======================= */
async function getChat(sessionId) {
  try {
    const { data, error } = await supabase
      .from("genie_conversations")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(8);

    if (error) console.error("GET CHAT ERROR:", error);
    return data || [];
  } catch (error) {
    console.error("GET CHAT EXCEPTION:", error);
    return [];
  }
}

async function saveChat(sessionId, role, content) {
  try {
    const { error } = await supabase.from("genie_conversations").insert({
      session_id: sessionId,
      role,
      content,
      created_at: new Date()
    });
    if (error) console.error("SAVE CHAT ERROR:", error);
  } catch (error) {
    console.error("SAVE CHAT EXCEPTION:", error);
  }
}

function formatAIError(error) {
  const code = error?.code || error?.type || "";
  const message = error?.message || "Unknown AI failure";

  if (code === "insufficient_quota" || /quota/i.test(message)) {
    return "Genie AI is temporarily unavailable because the active AI provider quota is exhausted. Please recharge or update billing on the selected API account.";
  }

  if (/model/i.test(message) && /not/i.test(message)) {
    return "Genie AI model is currently unavailable on this API account.";
  }

  return `AI error: ${message}`;
}

function normalizeProfile(profile = {}) {
  return {
    businessName: String(profile.businessName || "").trim(),
    ownerName: String(profile.ownerName || "").trim(),
    industry: String(profile.industry || "").trim(),
    targetAudience: String(profile.targetAudience || "").trim(),
    goals: String(profile.goals || "").trim(),
    platforms: Array.isArray(profile.platforms)
      ? profile.platforms.filter(Boolean)
      : String(profile.platforms || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
    tone: String(profile.tone || "").trim(),
    postingFrequency: String(profile.postingFrequency || "").trim(),
    language: String(profile.language || "").trim(),
  };
}

function buildProfileSummary(profile) {
  const parts = [];
  if (profile.businessName) parts.push(`Business: ${profile.businessName}`);
  if (profile.ownerName) parts.push(`Owner: ${profile.ownerName}`);
  if (profile.industry) parts.push(`Industry: ${profile.industry}`);
  if (profile.targetAudience) parts.push(`Audience: ${profile.targetAudience}`);
  if (profile.goals) parts.push(`Goals: ${profile.goals}`);
  if (profile.platforms.length) {
    parts.push(`Platforms: ${profile.platforms.join(", ")}`);
  }
  if (profile.tone) parts.push(`Tone: ${profile.tone}`);
  if (profile.postingFrequency) {
    parts.push(`Posting frequency: ${profile.postingFrequency}`);
  }
  if (profile.language) parts.push(`Language: ${profile.language}`);
  return parts.length ? parts.join("\n") : "No business profile supplied yet.";
}

function buildSystemPrompt({
  role = "general",
  assistantProfile = {},
  kbText = "",
  membership = { membershipTier: "free", trialMode: true, fullAccess: false }
}) {
  const profile = normalizeProfile(assistantProfile);
  const profileSummary = buildProfileSummary(profile);

  if (role === "assistant") {
    return `
You are Cloudora Genie, the official AI business assistant for Cloudora.

PRIMARY ROLE:
- Act like an intelligent assistant for business owners, founders, and working professionals.
- Help them with marketing planning, content ideas, captions, campaign direction, outreach structure, daily task planning, and execution clarity.
- Be practical, structured, and proactive.

IMPORTANT TRUTHFULNESS RULES:
- Do not claim that you already posted content, sent emails, sent WhatsApp campaigns, created videos, or automated social media unless the user explicitly confirms Cloudora has connected those systems.
- If the user asks for automation, explain it in two layers:
  1. what you can prepare right now: content calendar, post ideas, captions, image/video prompts, outreach scripts, lead qualification logic, and a posting schedule
  2. what requires Cloudora setup/integration: auto posting, WhatsApp sending, email blasting, external platform APIs, schedulers, and analytics connections
- Never pretend a live integration exists if it is not confirmed in the conversation.

WORK STYLE:
- Start by understanding the business, target audience, goal, offer, and platforms.
- When the user asks for content planning, give concrete deliverables.
- Prefer actionable outputs like:
  - monthly content calendar
  - weekly posting plan
  - image prompts
  - short video/reel prompts
  - caption sets
  - hashtag suggestions
  - CTA suggestions
  - daily work checklist
  - lead outreach scripts
  - email campaign ideas
  - follow-up sequences
- Keep responses easy to execute by a marketing team.
- If information is missing, ask only the most important missing question and still make a reasonable draft.

DEFAULT ASSUMPTION:
- Cloudora can later operationalize the plan through its ops team, scraper flows, email systems, and future automation setup.

BUSINESS PROFILE:
${profileSummary}

ACCESS MODE:
- Membership tier: ${membership.membershipTier}
- Full access: ${membership.fullAccess ? "yes" : "no"}
- Trial mode: ${membership.trialMode ? "yes" : "no"}

TRIAL RULES:
${membership.trialMode
  ? `- Keep responses useful but lighter.
- Do not act as if premium automation, long-term memory, or deep personalized control is unlocked.
- If the user asks for premium execution or deeper continuity, mention that full Genie access is required.`
  : `- Full Genie experience is unlocked for this user.
- You may act as the deeper assistant experience for the allowed tier while staying truthful about actual integrations.`}

${kbText ? `COMPANY KNOWLEDGE:\n${kbText}` : ""}
`.trim();
  }

  return `
You are Genie. You reason, think, and respond naturally like ChatGPT.
You aim to be helpful, intelligent, and human-like.
${kbText ? `\nCOMPANY KNOWLEDGE:\n${kbText}` : ""}
`.trim();
}

function buildAssistantWelcome(profile = {}) {
  const normalized = normalizeProfile(profile);
  const businessName = normalized.businessName || "your business";

  return `Hello${normalized.ownerName ? ` ${normalized.ownerName}` : ""}, I am Cloudora Genie. I can help ${businessName} with monthly marketing planning, content ideas, captions, short video concepts, outreach scripts, and execution schedules. Tell me your current goal and I will prepare a practical plan.`;
}

/* =======================
   MAIN CHAT
======================= */
router.post("/message", async (req, res) => {
  const {
    message = "",
    sessionId,
    role = "general",
    assistantProfile = {},
    membershipTier = "free",
    accessCode = ""
  } = req.body;

  if (!message || !sessionId) {
    return res.json({ reply: "Invalid request." });
  }

  await saveChat(sessionId, "user", message);

  const history = await getChat(sessionId);
  const membership = await getMemberFromRequestAsync(req);
  const clientId = getClientIdFromRequest(req);
  const access = await enforceTrialAccess({
    member: membership,
    clientId,
    actionType: "chat"
  });

  if (!access.ok) {
    await logGenieUsage({
      member: membership,
      clientId,
      sessionId,
      actionType: "chat",
      status: "blocked",
      meta: { reason: access.error }
    });
    return res.status(access.status || 403).json({
      reply: access.error,
      membership,
      usage: access.snapshot
    });
  }

  const kbText = role === "assistant"
    ? null
    : await queryGenieKB({ message, site: "cloudora" });

  const messages = [
    {
      role: "system",
      content: buildSystemPrompt({ role, assistantProfile, kbText, membership })
    },
    ...history.map(m => ({
      role: m.role,
      content: m.content
    }))
  ];

  let reply;
  let debug = null;
  try {
    reply = await askGenie(messages);
  } catch (e) {
    console.error("AI FAILURE:", e);
    debug = e?.message || "Unknown AI failure";
    reply = `AI error: ${debug}`;
  }

  await saveChat(sessionId, "assistant", reply);
  await logGenieUsage({
    member: membership,
    clientId,
    sessionId,
    actionType: "chat",
    status: "success",
    meta: { role, messageLength: message.length }
  });
  res.json({ reply, membership, debug, usage: access.snapshot });
});

// ===== STREAM =====
router.post("/stream", async (req, res) => {
  const {
    message,
    sessionId,
    role = "general",
    assistantProfile = {},
    membershipTier = "free",
    accessCode = ""
  } = req.body;

  if (!message || !sessionId) {
    res.end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    await saveChat(sessionId, "user", message);

    const history = await getChat(sessionId);
    const membership = await getMemberFromRequestAsync(req);
    const clientId = getClientIdFromRequest(req);
    const access = await enforceTrialAccess({
      member: membership,
      clientId,
      actionType: "chat"
    });

    if (!access.ok) {
      await logGenieUsage({
        member: membership,
        clientId,
        sessionId,
        actionType: "chat",
        status: "blocked",
        meta: { reason: access.error }
      });
      res.write(`data: ${access.error}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const kb = role === "assistant"
      ? null
      : await queryGenieKB({ message, site: "cloudora" });

    const messages = [
      {
        role: "system",
        content: buildSystemPrompt({
          role,
          assistantProfile,
          kbText: kb ? `COMPANY KNOWLEDGE (TRUST THIS SOURCE):\n${kb}` : "",
          membership
        })
      },
      ...history
        .filter((item) => item.content !== message)
        .map((item) => ({
          role: item.role,
          content: item.content
        })),
      { role: "user", content: message }
    ];

    const fullReply = await askGenie(messages);
    const tokens = String(fullReply || "").split(/(\s+)/).filter(Boolean);

    for (const token of tokens) {
      res.write(`data: ${token}\n\n`);
    }

    await saveChat(sessionId, "assistant", fullReply);
    await logGenieUsage({
      member: membership,
      clientId,
      sessionId,
      actionType: "chat",
      status: "success",
      meta: { role, messageLength: message.length }
    });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("STREAM AI FAILURE:", error);
    const safeMessage = formatAIError(error);
    const membership = await getMemberFromRequestAsync(req).catch(() => ({
      membershipTier: "free",
      fullAccess: false,
      trialMode: true,
      memberId: ""
    }));
    const clientId = getClientIdFromRequest(req);
    await saveChat(sessionId, "assistant", safeMessage);
    await logGenieUsage({
      member: membership,
      clientId,
      sessionId,
      actionType: "chat",
      status: "failed",
      meta: { error: safeMessage }
    });
    res.write(`data: ${safeMessage}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});


// ===== TTS (SEPARATE ROUTE) =====
router.post("/tts", async (req, res) => {
  const { text, voice = "alloy" } = req.body;

  try {
    const audio = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text
    });

    res.setHeader("Content-Type", "audio/mpeg");
    audio.body.pipe(res);
  } catch (e) {
    console.error("TTS ERROR:", e);
    res.status(500).end();
  }
});

/* =======================
   SESSION START
======================= */
router.post("/start", async (req, res) => {
  const {
    role = "general",
    assistantProfile = {},
    membershipTier = "free",
    accessCode = ""
  } = req.body || {};
  const membership = await resolveMemberAsync({ membershipTier, accessCode, memberId: req.body?.memberId || "" });
  const usage = await getUsageSnapshot({
    member: membership,
    clientId: getClientIdFromRequest(req)
  });
  const profile = membership.fullAccess ? await getMemberProfile(membership.memberId) : null;
  res.json({
    ok: true,
    sessionId: "sess_" + Math.random().toString(36).slice(2, 10),
    membership,
    usage,
    profile,
    memberToken: membership.fullAccess ? createMemberToken(membership) : null,
    welcome:
      role === "assistant"
        ? buildAssistantWelcome(assistantProfile)
        : "Hello, I am Cloudora Genie. How can I help you today?"
  });
});

router.post("/verify-access", async (req, res) => {
  const { membershipTier = "free", accessCode = "", memberId = "" } = req.body || {};
  const membership = await resolveMemberAsync({ membershipTier, accessCode, memberId });
  const usage = await getUsageSnapshot({
    member: membership,
    clientId: getClientIdFromRequest(req)
  });
  const profile = membership.fullAccess ? await getMemberProfile(membership.memberId) : null;
  res.json({
    ok: true,
    membership,
    usage,
    profile,
    memberToken: membership.fullAccess ? createMemberToken(membership) : null
  });
});

router.post("/member-login", async (req, res) => {
  const { memberId = "", accessCode = "", membershipTier = "business" } = req.body || {};
  const membership = await resolveMemberAsync({ memberId, accessCode, membershipTier });

  if (!membership.fullAccess) {
    return res.status(403).json({
      ok: false,
      error: "Invalid member credentials",
      membership
    });
  }

  return res.json({
    ok: true,
    membership,
    usage: await getUsageSnapshot({
      member: membership,
      clientId: getClientIdFromRequest(req)
    }),
    profile: await getMemberProfile(membership.memberId),
    memberToken: createMemberToken(membership)
  });
});

router.get("/member-session", async (req, res) => {
  const membership = getMemberFromRequest(req);
  res.json({
    ok: true,
    membership,
    active: Boolean(membership.fullAccess),
    usage: await getUsageSnapshot({
      member: membership,
      clientId: getClientIdFromRequest(req)
    }),
    profile: membership.fullAccess ? await getMemberProfile(membership.memberId) : null
  });
});

router.get("/profile", async (req, res) => {
  const membership = await getMemberFromRequestAsync(req);
  if (!membership.fullAccess || !membership.memberId) {
    return res.status(403).json({ ok: false, error: "Full Genie access is required" });
  }

  const profile = await getMemberProfile(membership.memberId);
  return res.json({ ok: true, profile });
});

router.post("/profile", async (req, res) => {
  const membership = await getMemberFromRequestAsync(req);
  if (!membership.fullAccess || !membership.memberId) {
    return res.status(403).json({ ok: false, error: "Only approved Genie members can save business profiles" });
  }

  try {
    const profile = await saveMemberProfile(membership.memberId, req.body?.profile || {});
    await logGenieUsage({
      member: membership,
      clientId: getClientIdFromRequest(req),
      actionType: "profile_save",
      status: "success",
      meta: { hasBusinessName: Boolean(profile?.business_name) }
    });
    return res.json({ ok: true, profile });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;







