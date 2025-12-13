// -----------------------------------------------------
// Cloudora Genie – Clean Minimal Route (NO AI ENGINE)
// -----------------------------------------------------

import express from "express";
const router = express.Router();

// ---------- START SESSION (DUMMY) ----------
router.post("/start", async (req, res) => {
  return res.json({
    ok: true,
    sessionId: "sess_" + Math.random().toString(36).slice(2, 10)
  });
});

// ---------- SIMPLE MESSAGE ROUTE ----------
router.post("/message", async (req, res) => {
  const msg = req.body.message || "";

  return res.json({
    reply: "Genie basic mode active — AI engine disabled.",
    userMessage: msg
  });
});

// ---------- HEALTH ----------
router.get("/", (req, res) => {
  res.json({ ok: true, genie: "clean" });
});

export default router;
