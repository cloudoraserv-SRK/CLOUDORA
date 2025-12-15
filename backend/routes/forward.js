import express from "express";
import { supabase } from "../api/supabase.js";

const router = express.Router();

router.post("/forward-sales", async (req, res) => {
  const { lead_id, forwarded_by, source_department } = req.body;

  try {
    // 1️⃣ MAP TELE → SALES
    let salesDept = null;

    if (source_department === "tele_lead_domestic") {
      salesDept = "tele_sales_domestic";
    } else if (source_department === "tele_lead_international") {
      salesDept = "tele_sales_international";
    } else {
      return res.json({
        ok: false,
        error: "Invalid source department",
        received: source_department
      });
    }

    // 2️⃣ PICK SALES EMPLOYEE (NULL SAFE)
    const { data: salesList, error: salesErr } = await supabase
      .from("employees")
      .select("id, name")
      .ilike("department", salesDept)
      .order("last_assigned_at", { ascending: true, nullsFirst: true })
      .limit(1);

    if (salesErr || !salesList || salesList.length === 0) {
      return res.json({ ok: false, error: "No sales employee available" });
    }

    const salesEmp = salesList[0];

    // 3️⃣ INSERT INTO SALES QUEUE
    const { error: insertErr } = await supabase
      .from("sales_queue")
      .insert({
        lead_id,
        assigned_to: salesEmp.id,
        source_department,
        status: "pending"
      });

    if (insertErr) throw insertErr;

    // 4️⃣ UPDATE ROUND ROBIN
    await supabase
      .from("employees")
      .update({ last_assigned_at: new Date().toISOString() })
      .eq("id", salesEmp.id);

    // 5️⃣ UPDATE LEAD STATUS
    await supabase
      .from("scraped_leads")
      .update({ status: "forwarded_to_sales" })
      .eq("id", lead_id);

    return res.json({
      ok: true,
      assigned_to: salesEmp.id,
      sales_department: salesDept
    });

  } catch (err) {
    console.error("FORWARD SALES ERROR:", err);
    return res.json({ ok: false, error: err.message });
  }
});

export default router;
