import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsPath = path.resolve(__dirname, "../kb/kb_products.json");

function loadProducts() {
  const kb = JSON.parse(fs.readFileSync(productsPath, "utf8"));
  return kb.documents || [];
}

function buildProposal(req, res) {
  try {
    const { product, budget, mode } = req.body;
    const products = loadProducts();
    const item = products.find((p) => p.id === product || p.title === product);

    if (!item) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    const tags = Array.isArray(item.tags) && item.tags.length
      ? item.tags.map((tag) => `• ${tag}`).join("\n")
      : "• Custom scope based on discussion";

    const proposal = `
${mode === "employee" ? "Internal Estimate" : "Client Proposal"}

Product: ${item.title}

Category:
${item.category || "general"}

Scope Summary:
${item.content || "Custom scope will be defined after discussion."}

Focus Tags:
${tags}

${
  mode === "employee"
    ? "Internal Note: pricing should be estimated manually from final scope."
    : "Pricing: tailored to the final requirement, timeline, and delivery scope."
}

Budget-based Recommendation:
${budget ? `Customer Budget: ${budget}` : "Awaiting customer budget"}
    `.trim();

    return res.json({ ok: true, proposal, product: item });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}

router.post("/generate", buildProposal);
router.post("/proposal/generate", buildProposal);

export default router;
