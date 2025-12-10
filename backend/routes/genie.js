import express from "express";
import createGenie from "../genie/genie-core.js";

const router = express.Router();
const genie = createGenie({});

// ---------- START SESSION ----------
router.post("/start", async (req, res) => {
  try {
    const { sessionId, meta } = req.body;
    const sid = sessionId || "sess_" + Math.random().toString(36).slice(2, 10);

    await genie.startSession(sid, meta || {});
    return res.json({ ok: true, sessionId: sid });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ---------- MESSAGE HANDLER ----------
router.post("/message", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId)
      return res.status(400).json({ error: "sessionId required" });

    if (!message)
      return res.status(400).json({ error: "message required" });

    const out = await genie.handleInput(sessionId, message);
    return res.json(out);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
