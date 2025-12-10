// backend/api_proposal.js
import express from "express";
import fs from "fs";

const router = express.Router();

// FINAL FIXED ROUTE
router.post("/proposal/generate", (req, res) => {
  try {
    const { product, budget, mode } = req.body;

    // FIX: Correct KB file path
    const kb = JSON.parse(
      fs.readFileSync("./backend/genie/kb/kb_products.json", "utf8")
    );

    const item = kb.products.find((p) => p.id == product);

    if (!item) {
      return res.json({ error: "Product not found" });
    }

    // Pricing logic
    const minPrice = item.pricing?.min || "N/A";
    const deliverables =
      item.deliverables?.length
        ? item.deliverables.map((d) => `• ${d}`).join("\n")
        : "• Not provided";

    const proposal = `
${mode === "employee" ? "Internal Estimate" : "Client Proposal"}

Product: ${item.name}

Deliverables:
${deliverables}

${
  mode === "employee"
    ? `Minimum Price: ₹${minPrice}`
    : "Pricing: Based on your budget"
}

Budget-based Recommendation:
${budget ? `Customer Budget: ${budget}` : "Awaiting customer budget"}
    `.trim();

    return res.json({ proposal });
  } catch (e) {
    return res.json({ error: e.message });
  }
});

export default router;
