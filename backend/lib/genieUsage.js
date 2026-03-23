import { supabase } from "./supabaseClient.js";

const TRIAL_DAILY_CHAT_LIMIT = Number(process.env.GENIE_TRIAL_DAILY_CHAT_LIMIT || 8);

function getStartOfDayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function getClientIdFromRequest(req) {
  return String(
    req.headers["x-genie-client-id"] ||
      req.body?.clientId ||
      req.query?.clientId ||
      ""
  ).trim();
}

export async function countUsageSince({ memberId = "", clientId = "", actionType = "", sinceIso }) {
  let query = supabase
    .from("genie_usage_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso)
    .eq("action_type", actionType);

  if (memberId) {
    query = query.eq("member_id", memberId);
  } else if (clientId) {
    query = query.eq("client_id", clientId);
  } else {
    return 0;
  }

  const { count, error } = await query;
  if (error) {
    console.error("countUsageSince error", error);
    return 0;
  }

  return Number(count || 0);
}

export async function getUsageSnapshot({ member, clientId = "" }) {
  const trialUsedToday = await countUsageSince({
    memberId: member?.fullAccess ? member.memberId : "",
    clientId: member?.fullAccess ? "" : clientId,
    actionType: "chat",
    sinceIso: getStartOfDayIso()
  });

  return {
    trialDailyChatLimit: TRIAL_DAILY_CHAT_LIMIT,
    trialUsedToday,
    trialRemaining: Math.max(0, TRIAL_DAILY_CHAT_LIMIT - trialUsedToday),
    fullAccess: Boolean(member?.fullAccess),
    trialMode: Boolean(member?.trialMode)
  };
}

export async function enforceTrialAccess({ member, clientId = "", actionType = "chat" }) {
  if (member?.fullAccess) {
    return {
      ok: true,
      snapshot: await getUsageSnapshot({ member, clientId })
    };
  }

  if (actionType !== "chat") {
    return {
      ok: false,
      status: 403,
      error: "This Genie feature is available only for approved paid members",
      snapshot: await getUsageSnapshot({ member, clientId })
    };
  }

  const snapshot = await getUsageSnapshot({ member, clientId });
  if (snapshot.trialUsedToday >= TRIAL_DAILY_CHAT_LIMIT) {
    return {
      ok: false,
      status: 403,
      error: `Free trial limit reached for today. ${TRIAL_DAILY_CHAT_LIMIT} daily Genie chats are allowed in trial mode.`,
      snapshot
    };
  }

  return { ok: true, snapshot };
}

export async function logGenieUsage({
  member,
  clientId = "",
  sessionId = "",
  actionType = "chat",
  status = "success",
  meta = {},
  units = 1
}) {
  try {
    const payload = {
      member_id: member?.memberId || null,
      client_id: clientId || null,
      membership_tier: member?.membershipTier || "free",
      full_access: Boolean(member?.fullAccess),
      trial_mode: Boolean(member?.trialMode),
      session_id: sessionId || null,
      action_type: actionType,
      status,
      units,
      meta,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from("genie_usage_logs").insert([payload]);
    if (error) console.error("logGenieUsage error", error);
  } catch (error) {
    console.error("logGenieUsage exception", error);
  }
}

export async function saveMemberProfile(memberId, profile = {}) {
  const payload = {
    member_id: memberId,
    business_name: String(profile.businessName || "").trim() || null,
    owner_name: String(profile.ownerName || "").trim() || null,
    industry: String(profile.industry || "").trim() || null,
    target_audience: String(profile.targetAudience || "").trim() || null,
    goals: String(profile.goals || "").trim() || null,
    platforms: Array.isArray(profile.platforms)
      ? profile.platforms.filter(Boolean)
      : String(profile.platforms || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
    tone: String(profile.tone || "").trim() || null,
    posting_frequency: String(profile.postingFrequency || "").trim() || null,
    language: String(profile.language || "").trim() || "en",
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("genie_profiles")
    .upsert([payload], { onConflict: "member_id" })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMemberProfile(memberId = "") {
  if (!memberId) return null;

  const { data, error } = await supabase
    .from("genie_profiles")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  if (error) {
    console.error("getMemberProfile error", error);
    return null;
  }

  return data;
}

export async function logCampaignRun({
  member,
  clientId = "",
  campaignType = "email_blast",
  status = "prepared",
  contactsFound = 0,
  sentCount = 0,
  failedCount = 0,
  payload = {}
}) {
  try {
    const { error } = await supabase.from("genie_campaign_logs").insert([
      {
        member_id: member?.memberId || null,
        client_id: clientId || null,
        membership_tier: member?.membershipTier || "free",
        campaign_type: campaignType,
        status,
        contacts_found: contactsFound,
        sent_count: sentCount,
        failed_count: failedCount,
        payload,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) console.error("logCampaignRun error", error);
  } catch (error) {
    console.error("logCampaignRun exception", error);
  }
}
