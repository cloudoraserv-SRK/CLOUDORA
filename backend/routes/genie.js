// -----------------------------------------------------
// Cloudora Genie – Brain v2.0 (FREE + SMART)
// -----------------------------------------------------

import express from "express";
import { supabase } from "../lib/supabaseClient.js";
import { askGenie } from "../lib/genieAI.js";
import { autoAssignLead } from "../lib/autoAssignLead.js";

const router = express.Router();

/* =======================
   CHAT MEMORY
======================= */
async function getChat(sessionId) {
  const { data } = await supabase
    .from("genie_chat")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(8);
  return data || [];
}

async function saveChat(sessionId, role, content) {
  if (!sessionId) return;
  await supabase.from("genie_chat").insert({
    session_id: sessionId,
    role,
    content,
    created_at: new Date()
  });
}

/* =======================
   MAIN CHAT
======================= */
router.post("/message", async (req, res) => {
  const { message = "", sessionId } = req.body;

  await saveChat(sessionId, "user", message);

  const history = await getChat(sessionId);
  const chatContext = history
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const systemPrompt = `
You are Genie, Cloudora's AI assistant.

About you:
- You help with jobs, CRM, business growth, sales, tech & general questions
- You can answer ANY normal question like ChatGPT
- If asked about yourself: explain you are Genie from Cloudora
- If asked about company: Cloudora builds CRM, lead systems & automation
- Be friendly, clear, human-like

Conversation:
${chatContext}
assistant:
`;

  const aiReply = await askGemini(systemPrompt);

  await saveChat(sessionId, "assistant", aiReply);

  res.json({ reply: aiReply, mode: "assistant" });
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

