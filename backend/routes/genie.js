// -----------------------------------------------------
// Cloudora Genie – Brain v1 (PRODUCTION FINAL)
// Guide-first | Jobs | Business | CRM | Memory-safe
// -----------------------------------------------------

import express from "express";
import { supabase } from "../lib/supabaseClient.js";
import { queryGenieKB } from "../lib/genieKB.js";

const router = express.Router();

/* =======================
   STATIC CLOUDORA AUTHORITY
======================= */
const CLOUDORA_CORE = {
  about:
    "Cloudora is an AI-powered growth ecosystem that helps businesses generate leads, manage CRM, grow sales, and helps individuals find jobs and career opportunities."
};

/* =======================
   HELPERS
======================= */
function isHomeGenie(context) {
  return context === "home";
}

function detectIntent(msg = "") {
  msg = msg.toLowerCase().trim();

  if (msg.includes("entertain") || msg.includes("joke") || msg.includes("fun"))
    return "entertainment";

  if (["wait", "ok", "hmm"].includes(msg)) return "idle";

  if (msg.includes("apply")) return "job_apply";
  if (msg.includes("job")) return "job_info";

  if (msg.includes("business") || msg.includes("crm") || msg.includes("leads"))
    return "business";

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
   LEADS
======================= */
async function saveLead(payload) {
  const { error } = await supabase
    .from("leads")
    .insert([{ ...payload, source: "genie_chat" }]);
  return !error;
}

/* =======================
   MAIN CHAT
======================= */
router.post("/message", async (req, res) => {
  const { message, sessionId, context } = req.body;
  const userMsg = message || "";

  /* ---- HOME PAGE ---- */
  if (isHomeGenie(context)) {
    return res.json({
      reply:
        "I can guide you here.\n\n• Explore jobs\n• Understand Cloudora\n• See how Genie helps\n\nFor full assistance, open the Genie page.",
      mode: "guide"
    });
  }

  const intent = detectIntent(userMsg);
  const memory = await getMemory(sessionId);

  /* ---- INTRO (ONLY ONCE) ---- */
  if (memory.stage !== "active") {
    await saveStage(sessionId, "active");

    return res.json({
      reply: `
Hi 👋 I’m Genie, Cloudora’s AI assistant.

I can help you with:
• Jobs & hiring
• Business growth, CRM & leads
• Guidance across this website

What would you like to explore?
👉 Jobs
👉 Business
`.trim(),
      mode: "assistant"
    });
  }

  /* ---- JOB INFO ---- */
  if (intent === "job_info") {
    return res.json({
      reply: `
Cloudora currently hires for roles like:
• Telecaller
• Sales Executive
• CRM Support
• Operations Assistant

Say 👉 "I want to apply for a job" to continue.
`.trim(),
      mode: "assistant"
    });
  }

  /* ---- JOB APPLY ---- */
  if (intent === "job_apply") {
    return res.json({
      reply:
        "Please send ONE message with:\n1️⃣ Full name\n2️⃣ Phone number\n3️⃣ City\n4️⃣ Job role",
      mode: "assistant"
    });
  }

  /* ---- BUSINESS ---- */
  if (intent === "business") {
    return res.json({
      reply:
        "I can help your business with leads and CRM.\n\nSend:\n1️⃣ Name\n2️⃣ Phone\n3️⃣ Business type",
      mode: "advisor"
    });
  }

  /* ---- ENTERTAINMENT ---- */
  if (intent === "entertainment") {
    return res.json({
      reply:
        "Sure 😄\nWhy did the startup hire Cloudora?\nBecause it had leads but no follow-up 😉",
      mode: "companion"
    });
  }

  /* ---- IDLE ---- */
  if (intent === "idle") {
    return res.json({
      reply: "No worries 🙂 I’m here when you’re ready.",
      mode: "idle"
    });
  }

  /* ---- EMOTIONAL ---- */
  if (intent === "emotional") {
    return res.json({
      reply:
        "I’m here with you. Want to talk, or should I distract your mind a bit?",
      mode: "companion"
    });
  }

  /* ---- KB / SMART FALLBACK ---- */
  const kbAnswer = await queryGenieKB({
    message: userMsg,
    site: context || "cloudora"
  });

  if (kbAnswer) {
    return res.json({ reply: kbAnswer, mode: "assistant" });
  }

  return res.json({
    reply:
      "Got it 👍 I can help with jobs, business growth, CRM, or keep things light. What next?",
    mode: "assistant"
  });
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
