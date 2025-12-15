import express from "express";
import { supabase } from "../api/supabase.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

router.post("/forward-sales", async (req, res) => {
  const { lead_id, forwarded_by } = req.body;

  try {
    // 1️⃣ Fetch lead
    const { data: lead, error: leadErr } = await supabase
      .from("scraped_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead) {
      return res.json({ ok: false, error: "Lead not found" });
    }

    // 2️⃣ Mark lead as interested
    await supabase
      .from("scraped_leads")
      .update({ status: "interested" })
      .eq("id", lead_id);

    // 3️⃣ Pick SALES employee (AUTO ASSIGN)
    const { data: salesEmp, error: salesErr } = await supabase
      .from("employees")
      .select("id, name, email")
      .like("department", "sales%")
      .order("last_assigned_at", { ascending: true })
      .limit(1)
      .single();

    if (salesErr || !salesEmp) {
      return res.json({ ok: false, error: "No sales employee available" });
    }

    // 4️⃣ Insert into sales_queue
    await supabase.from("sales_queue").insert({
      lead_id,
      assigned_to: salesEmp.id,
      status: "pending"
    });

    // 5️⃣ Update sales employee load timestamp
    await supabase
      .from("employees")
      .update({ last_assigned_at: new Date().toISOString() })
      .eq("id", salesEmp.id);

    // 6️⃣ Email notification (optional but kept)
    const html = `
      <h3>New Interested Lead Assigned</h3>
      <p><b>Name:</b> ${lead.name}</p>
      <p><b>Phone:</b> ${lead.phone}</p>
      <p><b>Category:</b> ${lead.category}</p>
      <p><b>City:</b> ${lead.city}</p>
      <p><b>Assigned To:</b> ${salesEmp.name}</p>
      <p><b>Forwarded By:</b> ${forwarded_by}</p>
    `;

    await sendMail(
      salesEmp.email || "support@cloudoraserv.cloud",
      "New Sales Lead Assigned",
      html
    );

    return res.json({ ok: true });

  } catch (err) {
    console.error("FORWARD SALES ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
