// backend/routes/genie_media.js
import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ------------------------------
// AUDIO UPLOAD
// final path → POST /api/genie/audio
// ------------------------------
router.post("/audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No audio file uploaded" });

    const filename = `audio-${Date.now()}.webm`;

    const { error: uploadErr } = await supabase.storage
      .from("genie_audio")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadErr) {
      console.error("Supabase audio upload error:", uploadErr);
    }

    const publicUrl =
      `${process.env.SUPABASE_URL.replace(/\/$/, "")}` +
      `/storage/v1/object/public/genie_audio/${filename}`;

    return res.json({ ok: true, url: publicUrl });
  } catch (e) {
    console.error("audio upload error:", e);
    return res.status(500).json({ error: e.message });
  }
});

// ------------------------------
// SAVE CONVERSATION
// final path → POST /api/genie/save_conversation
// ------------------------------
router.post("/save_conversation", async (req, res) => {
  try {
    const { sessionId, userId = null, messages = [], meta = {} } = req.body;

    if (!sessionId)
      return res.status(400).json({ error: "sessionId is required" });

    const { error } = await supabase.from("genie_conversations").insert([
      {
        session_id: sessionId,
        user_id: userId,
        messages,
        meta,
      },
    ]);

    if (error) {
      console.error("save_conversation error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("save_conversation exception:", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
