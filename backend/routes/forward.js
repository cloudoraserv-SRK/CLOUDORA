import express from "express";
import { supabase } from "../api/supabase.js";

const router = express.Router();

router.post("/forward-sales", async (req, res) => {
  const { lead_id, forwarded_by, source_department } = req.body;

  try {
    // 🔁 decide sales department
    let salesDept = null;

    if (source_department === "tele_lead_domestic") {
      salesDept = "tele_sales_domestic";
    } else if (source_department === "tele_lead_international") {
      salesDept = "tele_sales_international";
    } else {
      return res.json({ ok: false, error: "Invalid source department" });
    }

    // 🎯 pick sales employee
    const { data: salesEmp } = await supabase
      .from("employees")
      .select("id")
      .eq("department", salesDept)
      .limit(1)
      .single();

    if (!salesEmp) {
      return res.json({ ok: false, error: "No sales employee available" });
    }

    // 📥 insert into sales_queue
    const { error } = await supabase.from("sales_queue").insert({
      lead_id,
      assigned_to: salesEmp.id,
      source_department,
      status: "pending"
    });

    if (error) throw error;

    // 🔁 update lead status
    await supabase
      .from("scraped_leads")
      .update({ status: "forwarded_to_sales" })
      .eq("id", lead_id);

    return res.json({ ok: true });

  } catch (err) {
    console.error(err);
    return res.json({ ok: false, error: err.message });
  }
});

export default router;
