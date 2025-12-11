// backend/routes/admin.js
import express from "express";
import { createClient } from "@supabase/supabase-js";
import checkRole from "../middleware/checkRole.js";
import "dotenv/config";

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ----------------------------
// VIEW ALL LEADS (manager/admin)
// ----------------------------
router.get("/admin/leads", checkRole(["view_all_leads"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true, leads: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ----------------------------
// VIEW UNASSIGNED TASKS
// ----------------------------
router.get("/admin/unassigned_tasks", checkRole(["assign_tasks"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("employee_tasks")
      .select("*")
      .is("employee_id", null)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ ok: true, tasks: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ----------------------------
// INSERT LEAD (ADMIN)
// ----------------------------
router.post("/insert-lead", async (req, res) => {
  try {
    const data = req.body;

    const insert = await supabase.from("leads").insert([
      {
        name: data.name,
        phone: data.phone,
        email: data.email,
        city: data.city,

        company_name: data.company_name || "",
        interest: data.interest || "",
        source: data.source || "",
        temperature: data.temperature || "",

        assigned_to: data.assigned_to || null,
        status: "pending",
        created_at: new Date().toISOString()
      }
    ]);

    if (insert.error) {
      return res.status(500).json({ ok: false, error: insert.error.message });
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
