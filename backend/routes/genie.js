import express from "express";
import { supabase } from "../lib/supabaseClient.js";
import { askGenie } from "../lib/genieAI.js";

const router = express.Router();

/* =======================
   CHAT MEMORY
======================= */
async function getChat(sessionId) {
  const { data, error } = await supabase
    .from("genie_conversations")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(8);

  if (error) console.error("GET CHAT ERROR:", error);
  return data || [];
}

async function saveChat(sessionId, role, content) {
  const { error } = await supabase.from("genie_conversations").insert({
    session_id: sessionId,
    role,
    content,
    created_at: new Date()
  });
  if (error) console.error("SAVE CHAT ERROR:", error);
}

/* =======================
   MAIN CHAT
======================= */
router.post("/message", async (req, res) => {
  const { message = "", sessionId } = req.body;

  if (!message || !sessionId) {
    return res.json({ reply: "Invalid request." });
  }

  await saveChat(sessionId, "user", message);

  const history = await getChat(sessionId);

  const messages = [
    {
      role: "system",
      content:
        "You are Genie. You reason, think, and respond naturally like ChatGPT. You aim to be helpful, intelligent, and human-like."
    },
    ...history.map(m => ({
      role: m.role,
      content: m.content
    }))
  ];

  let reply;
  try {
    reply = await askGenie(messages);
  } catch (e) {
    console.error("AI FAILURE:", e);
    reply = "AI error. Please try again.";
  }

  await saveChat(sessionId, "assistant", reply);
  res.json({ reply });
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

