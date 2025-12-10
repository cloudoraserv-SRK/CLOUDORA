// backend/admin_upload.js
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

// FIX: Public storage URL correct karne ke liye rest/v1 remove
function getPublicUrl(filename) {
  const base = process.env.SUPABASE_URL.replace("/rest/v1", "");
  return `${base}/storage/v1/object/public/catalogue_images/${filename}`;
}

// ================================
// UPLOAD API (FINAL FIXED VERSION)
// ================================
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const product = req.body.product || "";
    const desc = req.body.desc || "";
    const tagsRaw = req.body.tags || "";

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = `${Date.now()}-${file.originalname}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("catalogue_images")
      .upload(filename, file.buffer, { contentType: file.mimetype });

    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    // Fix: Correct public URL
    const url = getPublicUrl(filename);

    // Fix: Tags convert string → array safely
    const tags =
      Array.isArray(tagsRaw)
        ? tagsRaw
        : String(tagsRaw)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

    // Insert metadata into catalogue_items
    const { error: insertError } = await supabase.from("catalogue_items").insert({
      name: product,
      description: desc,
      tags,
      image_url: url
    });

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    return res.json({ ok: true, url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
