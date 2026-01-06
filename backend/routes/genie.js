import express from "express";
import OpenAI from "openai";
import { queryGenieKB } from "../lib/genieKB.js";
import { supabase } from "../lib/supabaseClient.js";
import { askGenie } from "../lib/genieAI.js";

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

// ===== STREAM =====
router.post("/stream", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    res.end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  await supabase.from("genie_conversations").insert({
    session_id: sessionId,
    role: "user",
    content: message
  });

const kb = await queryGenieKB(message);

const messages = [
  {
    role: "system",
    content: `
You are Jini, Cloudora's official AI assistant.

RULES:
- Cloudora refers ONLY to the company Cloudora (this project).
- If company knowledge is provided, you MUST use it.
- NEVER say you don't know Cloudora if knowledge is present.
`
  },
  ...(kb ? [{
    role: "system",
    content: `COMPANY KNOWLEDGE (TRUST THIS SOURCE):\n${kb}`
  }] : []),
  { role: "user", content: message }
];


  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    stream: true
  });

  let fullReply = "";

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) {
      fullReply += token;
      res.write(`data: ${token}\n\n`);
    }
  }

  await supabase.from("genie_conversations").insert({
    session_id: sessionId,
    role: "assistant",
    content: fullReply
  });

  res.write("data: [DONE]\n\n");
  res.end();
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
router.post("/start", (req, res) => {
  res.json({
    ok: true,
    sessionId: "sess_" + Math.random().toString(36).slice(2, 10)
  });
});

export default router;







