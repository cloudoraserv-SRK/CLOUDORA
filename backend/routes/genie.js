// -----------------------------------------------------
// Cloudora Genie – Brain v1.4 (CLEAN & STABLE)
// Chat + Memory + Lead Intent + KB + AI
// -----------------------------------------------------

import express from "express";
import { supabase } from "../lib/supabaseClient.js";
import { queryGenieKB } from "../lib/genieKB.js";
import { askGemini } from "../lib/genieAI.js";
import { autoAssignLead } from "../lib/autoAssignLead.js";

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
   EVENT LOGGING (SAFE)
======================= */
async function logGenieEvent({
  sessionId,
  action,
  message = null,
  page = null
}) {
  await supabase.from("genie_events").insert([
    {
      source: "genie",
      action,
      label: message,
      page,
      created_at: new Date()
    }
  ]);
}

/* =======================
   LEAD CAPTURE (INTENT ONLY)
======================= */
async function createIntentLead({ lead_type }) {
  const { data } = await supabase
    .from("leads")
    .insert([
      {
        lead_type,
        source: "genie",
        status: "new"
      }
    ])
    .select()
    .single();

  if (data) {
    await autoAssignLead(data);
  }

  return data;
}

/* =======================
   MAIN CHAT
======================= */
router.post("/message", async (req, res) => {
  const { message = "", sessionId, context } = req.body;
  const intent = detectIntent(message);

  await logGenieEvent({
    sessionId,
    action: "user_message",
    message,
    page: context
  });

  /* HOME MINI GENIE */
  if (isHomeGenie(context)) {
    return res.json({
      reply:
        "I can guide you here.\n• Jobs\n• Business\n• Genie features\n\nOpen Genie for full help.",
      mode: "guide"
    });
  }

  const memory = await getMemory(sessionId);

  /* INTRO ONCE */
  if (memory.stage !== "active") {
    await saveStage(sessionId, "active");
    return res.json({
      reply:
        "Hi 👋 I’m Genie.\n\nI help with jobs, CRM & business growth.\nWhat would you like to explore?",
      mode: "assistant"
    });
  }

  /* JOB INFO */
  if (intent === "job_info") {
    return res.json({
      reply:
        "We’re hiring for Telecaller, Sales & CRM Support.\nSay: *I want to apply*",
      mode: "assistant"
    });
  }

  /* JOB APPLY */
  if (intent === "job_apply") {
    await createIntentLead({ lead_type: "job" });

    return res.json({
      reply:
        "Please send:\n1️⃣ Name\n2️⃣ Phone\n3️⃣ City\n4️⃣ Job role",
      mode: "assistant"
    });
  }

  /* BUSINESS */
  if (intent === "business") {
    await createIntentLead({ lead_type: "business" });

    return res.json({
      reply:
        "Send:\n1️⃣ Name\n2️⃣ Phone\n3️⃣ Business type",
      mode: "advisor"
    });
  }

  /* ENTERTAINMENT */
  if (intent === "entertainment") {
    return res.json({
      reply:
        "😄 Why Cloudora?\nBecause leads without follow-up don’t grow!",
      mode: "companion"
    });
  }

  /* IDLE */
  if (intent === "idle") {
    return res.json({
      reply: "No worries 🙂 I’m here.",
      mode: "idle"
    });
  }

  /* EMOTIONAL */
  if (intent === "emotional") {
    return res.json({
      reply:
        "I’m here for you. Want to talk or get distracted a bit?",
      mode: "companion"
    });
  }

  /* KB FIRST */
  const kbAnswer = await queryGenieKB({
    message,
    site: context || "cloudora"
  });

  if (kbAnswer) {
    return res.json({ reply: kbAnswer, mode: "assistant" });
  }

  /* AI FALLBACK */
  const aiReply = await askGemini(
    `You are Genie, Cloudora's assistant.\nUser: ${message}`
  );

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

