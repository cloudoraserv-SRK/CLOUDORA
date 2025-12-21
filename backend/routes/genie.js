// -----------------------------------------------------
// Cloudora Genie – Brain v1 (Genie Page)
// Human-first | Flow + Free AI
// -----------------------------------------------------

import express from "express";
import { askGemini } from "../lib/genieAI.js";
import { supabase } from "../lib/supabaseClient.js";

console.log("🧠 Genie routes file loaded");

const router = express.Router();

/* =======================
   START CHECK
======================= */
router.get("/start", (req, res) => {
  res.json({
    ok: true,
    message: "Genie route is live",
  });
});

/* =======================
   MEMORY
======================= */
async function getMemory(sessionId) {
  if (!sessionId) return null;

  const { data } = await supabase
    .from("genie_memory")
    .select("intent, summary")
    .eq("session_id", sessionId)
    .single();

  return data || null;
}

async function saveMemory({ sessionId, intent, summary }) {
  if (!sessionId) return;

  await supabase.from("genie_memory").upsert({
    session_id: sessionId,
    intent,
    summary,
    updated_at: new Date(),
  });
}

function buildSummary(prev = "", message = "", intent = "") {
  if (intent === "business")
    return "User is looking for business clarity and growth support.";

  if (intent === "jobs")
    return "User is exploring jobs or earning opportunities.";

  if (intent === "emotional")
    return "User seems emotionally tired or low.";

  return prev || `User asked about: ${message.slice(0, 60)}`;
}

/* =======================
   INTENT & MODE
======================= */
function detectIntent(message = "") {
  const m = message.toLowerCase();

  if (m.includes("business") || m.includes("crm")) return "business";
  if (m.includes("job") || m.includes("career")) return "jobs";
  if (m.includes("sad") || m.includes("tired")) return "emotional";
  if (m.includes("hi") || m.includes("hello")) return "companion";

  return "free";
}

function selectMode(intent) {
  if (intent === "business") return "advisor";
  if (intent === "jobs") return "assistant";
  if (intent === "emotional") return "companion";
  if (intent === "companion") return "companion";
  return "free_ai";
}

/* =======================
   PROMPT
======================= */
function buildPrompt({ intent, mode, message, memory }) {
  return `
You are Genie, a calm, human-first AI assistant.

Rules:
- Be clear, short, practical
- No hallucination
- No sales pitch
- Respect emotions

Previous context:
Intent: ${memory?.intent || "unknown"}
Summary: ${memory?.summary || "none"}

Current intent: ${intent}
Genie mode: ${mode}

User message:
"${message}"

Reply as Genie.
`;
}

/* =======================
   MAIN MESSAGE ROUTE
======================= */
router.post("/message", async (req, res) => {
  console.log("🧠 Genie /message HIT", req.body);

  const { message, sessionId } = req.body;
  const userMessage = message || "";

  const intent = detectIntent(userMessage);
  const mode = selectMode(intent);
  const memory = await getMemory(sessionId);

  /* ---- Guided replies ---- */
  if (mode === "advisor") {
    const reply =
      "I can help you think this through calmly. What part feels most confusing right now?";

    await saveMemory({
      sessionId,
      intent,
      summary: buildSummary(memory?.summary, userMessage, intent),
    });

    return res.json({ reply, intent, mode });
  }

  if (mode === "assistant") {
    const reply =
      "I can guide you with jobs or planning. What are you trying to move towards?";

    await saveMemory({
      sessionId,
      intent,
      summary: buildSummary(memory?.summary, userMessage, intent),
    });

    return res.json({ reply, intent, mode });
  }

  if (mode === "companion") {
    const reply =
      "That sounds heavy. Do you want to talk it out or take your mind off it for a bit?";

    await saveMemory({
      sessionId,
      intent,
      summary: buildSummary(memory?.summary, userMessage, intent),
    });

    return res.json({ reply, intent, mode });
  }

  /* ---- Free AI ---- */
  let aiReply;
  try {
    const prompt = buildPrompt({
      intent,
      mode,
      message: userMessage,
      memory,
    });
    aiReply = await askGemini(prompt);
  } catch (e) {
    console.error("🔥 Gemini failed", e);
    aiReply = "I’m here, but my thinking engine is a bit busy right now.";
  }

  await saveMemory({
    sessionId,
    intent,
    summary: buildSummary(memory?.summary, userMessage, intent),
  });

  return res.json({
    reply: aiReply,
    intent,
    mode: "free_ai",
  });
});

/* =======================
   SESSION START
======================= */
router.post("/start", (req, res) => {
  res.json({
    ok: true,
    message:
      "Hi, I’m Genie. I help people think clearly, plan better, and move forward.",
    sessionId: "sess_" + Math.random().toString(36).slice(2, 10),
  });
});

export default router;
