import express from "express";
import { createPublicEnquiry } from "../lib/leadPipeline.js";

const router = express.Router();

async function handleEnquiry(req, res) {
  try {
    const result = await createPublicEnquiry(req.body || {});
    return res.status(result.status).json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || e });
  }
}

router.post("/enquiries", handleEnquiry);
router.post("/contact", handleEnquiry);

export default router;
