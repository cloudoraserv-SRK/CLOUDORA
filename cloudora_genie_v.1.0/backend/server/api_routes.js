import express from "express";
import flowManager from "../genie/flow.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "OK", genie: "online" });
});

router.post("/genie", async (req, res) => {
  try {
    const { message, role } = req.body;
    const reply = await flowManager.handle(message, role);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/lead", async (req, res) => {
  try {
    const payload = req.body;
    console.log("Lead Received:", payload);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/job", async (req, res) => {
  try {
    const data = req.body;
    const response = await flowManager.jobFlow(data);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
