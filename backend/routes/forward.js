import express from "express";
import { supabase } from "../api/supabase.js";

const router = express.Router();

router.post("/forward-sales", async (req, res) => {
  const { lead_id, forwarded_by, lead_type } = req.body;

  try {
    // 1️⃣ VALIDATE
    if (!lead_type || !["domestic", "international"].includes(lead_type)) {
      return res.json({
        ok: false,
        error: "Invalid lead type",
        received: lead_type
      });
    }

    // 2️⃣ MAP LEAD TYPE → SALES DEPARTMENT
    const salesDept =
      lead_type === "domestic"
        ? "tele_sales_domestic"
        : "tele_sales_international";

    // 3️⃣ PICK SALES EMPLOYEE (ROUND ROBIN, NULL SAFE)
    const { data: salesList, error: salesErr } = await supabase
      .from("employees")
      .select("id, name")
      .eq("department", salesDept)
      .order("last_assigned_at", { ascending: true, nullsFirst: true })
      .limit(1);

    if (salesErr || !salesList || salesList.length === 0) {
      return res.json({
        ok: false,
        error: "No sales employee available",
        salesDept
      });
    }

    const salesEmp = salesList[0];

    // 4️⃣ INSERT INTO SALES QUEUE
    const { error: insertErr } = await supabase
      .from("sales_queue")
      .insert({
        lead_id,
        assigned_to: salesEmp.id,
        lead_type,
        status: "pending"
      });

    if (insertErr) throw insertErr;

    // 5️⃣ UPDATE ROUND ROBIN TIMESTAMP
    await supabase
      .from("employees")
      .update({ last_assigned_at: new Date().toISOString() })
      .eq("id", salesEmp.id);

    // 6️⃣ UPDATE LEAD STATUS
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
