// -----------------------------------------------------
// Cloudora Genie – Brain v1.3 (FINAL CLEAN)
// Learning + Lead Capture + KB + AI Ready
// -----------------------------------------------------

import express from "express";
import { supabase } from "../lib/supabaseClient.js";
import { queryGenieKB } from "../lib/genieKB.js";
import { askGemini } from "../lib/genieAI.js";

const router = express.Router();

/* =======================
   HELPERS
======================= */
function isHomeGenie(context) {
  return context === "home";
}

function detectIntent(msg = "") {
  msg = msg.toLowerCase().trim();

  if (msg.includes("apply")) return "job_apply";
  if (msg.includes("job")) return "job_info";
  if (msg.includes("business") || msg.includes("crm") || msg.includes("leads"))
    return "business";
  if (msg.includes("joke") || msg.includes("fun")) return "entertainment";
  if (["ok", "wait", "hmm"].includes(msg)) return "idle";
  if (msg.includes("sad") || msg.includes("tired")) return "emotional";
  if (msg.includes("hi") || msg.includes("hello")) return "companion";

  return "free";
}

/* =======================
   MEMORY
======================= */
async function getMemory(sessionId) {
  if (!sessionId) return {};
  const { data } = await supabase
    .from("genie_memory")
    .select("stage")
    .eq("session_id", sessionId)
    .single();
  return data || {};
}

async function saveStage(sessionId, stage) {
  if (!sessionId) return;
  await supabase.from("genie_memory").upsert({
    session_id: sessionId,
    stage,
    updated_at: new Date()
  });
}

/* =======================
   EVENT LOGGING
======================= */
async function logGenieEvent({
  sessionId,
  event_type,
  intent = null,
  message = null,
  context = null,
  lead_id = null,
  metadata = {}
}) {
  await supabase.from("genie_events").insert([
    {
      session_id: sessionId,
      event_type,
      intent,
      message,
      context,
      lead_id,
      metadata,
      created_at: new Date()
    }
  ]);
}

/* =======================
   LEAD CAPTURE
======================= */
async function saveLead(payload, sessionId) {
  const { data, error } = await supabase
    .from("leads")
    .insert([{ ...payload, source: "genie" }])
    .select()
    .single();

  if (!error && data) {
    await logGenieEvent({
      sessionId,
      event_type: "lead_created",
      lead_id: data.id,
      metadata: payload
    });
  }

  return data;
}
const lead = await saveLead(payload, sessionId);
await autoAssignLead(lead);

/* =======================
   MAIN CHAT
======================= */
router.post("/message", async (req, res) => {
  const { message = "", sessionId, context } = req.body;
  const intent = detectIntent(message);

  // log every user message
  await logGenieEvent({
    sessionId,
    event_type: "message",
    intent,
    message,
    context
  });

  /* HOME PAGE MINI GENIE */
  if (isHomeGenie(context)) {
    return res.json({
      reply:
        "I can guide you here.\n• Jobs\n• Business\n• Genie features\n\nOpen Genie for full help.",
      mode: "guide"
    });
  }

  const memory = await getMemory(sessionId);

  /* INTRO (ONCE) */
  if (memory.stage !== "active") {
    await saveStage(sessionId, "active");
    return res.json({
      reply:
        "Hi 👋 I’m Genie.\n\nI help with jobs, CRM, business growth & guidance.\nWhat would you like to explore?",
      mode: "assistant"
    });
  }

  /* HARD FLOWS */
  if (intent === "job_info") {
    return res.json({
      reply:
        "Cloudora is hiring for Telecaller, Sales & CRM Support.\nSay: *I want to apply*",
      mode: "assistant"
    });
  }

  /* ---- JOB APPLY ---- */
if (intent === "job_apply") {
  const lead = await saveLead(
    { lead_type: "job", source: "genie" },
    sessionId
  );

  await autoAssignLead(lead);

  return res.json({
    reply:
      "Please send:\n1️⃣ Name\n2️⃣ Phone\n3️⃣ City\n4️⃣ Job role",
    mode: "assistant"
  });
}


 /* ---- BUSINESS ---- */
if (intent === "business") {
  const lead = await saveLead(
    { lead_type: "business", source: "genie" },
    sessionId
  );

  await autoAssignLead(lead);

  return res.json({
    reply:
      "Send:\n1️⃣ Name\n2️⃣ Phone\n3️⃣ Business type",
    mode: "advisor"
  });
}

  if (intent === "entertainment") {
    return res.json({
      reply:
        "😄 Why Cloudora?\nBecause leads without follow-up don’t grow!",
      mode: "companion"
    });
  }

  if (intent === "idle") {
    return res.json({
      reply: "No worries 🙂 I’m here when you’re ready.",
      mode: "idle"
    });
  }

  if (intent === "emotional") {
    return res.json({
      reply:
        "I’m here for you. Want to talk, or should I distract you a bit?",
      mode: "companion"
    });
  }

  /* ===== KB FIRST ===== */
  const kbAnswer = await queryGenieKB({
    message,
    site: context || "cloudora"
  });

  if (kbAnswer) {
    await logGenieEvent({
      sessionId,
      event_type: "kb_answer"
    });
    return res.json({ reply: kbAnswer, mode: "assistant" });
  }

  /* ===== AI FALLBACK ===== */
  const aiReply = await askGemini(
    `You are Genie, Cloudora's assistant.\nUser: ${message}`
  );

  await logGenieEvent({
    sessionId,
    event_type: "ai_answer"
  });

  return res.json({ reply: aiReply, mode: "assistant" });
});

/* =======================
   SESSION START
======================= */
router.post("/start", (req, res) => {
  res.json({
    ok: true,
    sessionId: "sess_" + Math.random().toString(36).slice(2, 10)
  });
});

export default router;
