import express from "express";
import { supabase } from "../lib/supabaseClient.js";
import { askGenie } from "../lib/genieAI.js";
import { queryGenieKB } from "../lib/genieKB.js";

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
    .limit(10);

  return data || [];
}

async function saveChat(sessionId, role, content) {
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

  const messages = [
   {
  role: "system",
  content:
    "You are Genie, Cloudora's AI assistant. Answer the user's question directly. NEVER repeat greetings or say 'How can I assist you today'."
},
    ...history
  .filter(m => m.role === "user")
  .map(m => ({
    role: "user",
    content: m.content
  }))
  ];

  let reply = "Something went wrong. Try again 🙂";
  try {
    reply = await askGenie(messages);
  } catch (e) {
    console.error("GENIE AI ERROR:", e.message);
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


