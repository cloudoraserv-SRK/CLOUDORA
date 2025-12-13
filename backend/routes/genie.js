// -----------------------------------------------------
// Cloudora Genie – Clean Minimal Route (NO AI ENGINE)
// -----------------------------------------------------

import express from "express";
const router = express.Router();

// START session dummy
router.post("/start", async (req, res) => {
  return res.json({
    ok: true,
    sessionId: "sess_" + Math.random().toString(36).slice(2, 10)
  });
});

// BASIC MESSAGE ROUTE
router.post("/message", async (req, res) => {
  const msg = req.body.message || "";
  return res.json({
    reply: "Genie basic mode active — AI engine removed.",
    userMessage: msg
  });
});

export default router;
