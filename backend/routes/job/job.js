// ------------------------------------------------------------
// Cloudora – FINAL JOB ROUTER (GENIE REBUILD V5)
// ------------------------------------------------------------

import express from "express";
import { supabase } from "../../api/supabase.js";

const router = express.Router();

/* ============================================================
   HELPER FUNCTIONS
============================================================ */
function generateEmployeeID() {
  const rand = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `EMP-${Date.now().toString().slice(-5)}-${rand}`;
}

function generatePassword() {
  return Math.random().toString(36).slice(2, 10);
}

/* ============================================================
   1️⃣ APPLY / AGREEMENT / VERIFY / CREATE EMPLOYEE
============================================================ */

router.post("/apply", async (req, res) => {
  try {
    const d = req.body;
    const lead_uid = "LEAD-" + Math.random().toString(36).substring(2,10).toUpperCase();

    const { error } = await supabase.from("leads").insert({
      lead_uid,
      name: d.name,
      phone: d.phone,
      email: d.email,
      city: d.city,
      gender: d.gender,
      dob: d.dob,
      department: d.department,
      job_type: d.jobType,
      shift: d.shift,
      country_pref: d.country,
      salary_expectation: d.salary,
      experience: d.experience,
      skills: d.skills,
      languages: d.languages,
      why_hire: d.why,
      apply_for_employee: d.apply_for_employee,
      agreement_status: false
    });

  if (error) return res.json({ ok:false, error:error.message });

return res.json({
  ok: true,
  lead: {
    lead_uid
  }
});


  } catch (e) {
    return res.json({ ok:false, error:e.message });
  }
});

router.post("/agreement-accept", async (req, res) => {
  const { lead_uid } = req.body;

  const { error } = await supabase
    .from("leads")
    .update({
      agreement_status: true,
      agreement_time: new Date().toISOString()
    })
    .eq("lead_uid", lead_uid);

  return res.json({ ok: !error });
});

router.post("/verify-lead", async (req, res) => {
  const { lead_uid } = req.body;

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("lead_uid", lead_uid)
    .maybeSingle();

  if (error || !data) return res.json({ ok:false, error:"Lead not found" });
  return res.json({ ok:true, lead:data });
});

router.post("/create-employee", async (req, res) => {
  const { lead_uid } = req.body;

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("lead_uid", lead_uid)
    .maybeSingle();

  if (!lead) return res.json({ ok:false, error:"Lead not found" });
  if (!lead.agreement_status) return res.json({ ok:false, error:"Agreement not accepted" });

  // Already exists?
  const { data: existing } = await supabase
    .from("employees")
    .select("*")
    .eq("lead_uid", lead_uid)
    .maybeSingle();

  if (existing) {
    return res.json({
      ok:true,
      employee:{
        employee_id: existing.employee_id,
        password: existing.password
      }
    });
  }

  // Create new
  const empID = generateEmployeeID();
  const pass = generatePassword();

  const { error } = await supabase.from("employees").insert({
    employee_id: empID,
    password: pass,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    lead_uid: lead.lead_uid,
    department: lead.department,
    job_type: lead.job_type,
    shift: lead.shift,
    status: "active"
  });

  if (error) return res.json({ ok:false, error:error.message });

  return res.json({
    ok:true,
    employee:{ employee_id: empID, password: pass }
  });
});

/* ============================================================
   2️⃣ EMPLOYEE LOGIN
============================================================ */

router.post("/login", async (req, res) => {
  const { employee_id, password } = req.body;

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("employee_id", employee_id)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) {
    return res.json({ ok:false, error:"Invalid Employee ID or Password" });
  }

  return res.json({
    ok:true,
    employee:{
      employee_id: data.employee_id,
      name: data.name,
      department: data.department
    }
  });
});

/* ============================================================
   3️⃣ CALLING PANEL – LOAD NEXT LEAD
============================================================ */
router.post("/next-lead", async (req, res) => {
  try {
    const { employee_id } = req.body;

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("assigned_to", employee_id)
      .neq("status", "completed")
      .order("updated_at", { ascending: true })
      .limit(1);

    if (error || !data || data.length === 0)
      return res.json({ ok: false });

    return res.json({ ok: true, lead: data[0] });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

/* ============================================================
   4️⃣ CALLING SCRIPT ENGINE
============================================================ */
/* ============================================================
   4️⃣ CALLING SCRIPT ENGINE
============================================================ */
router.post("/script", async (req, res) => {
  try {
    let category = (req.body.category || "").toLowerCase().trim();
    category = category.replace(/[^a-z0-9]+/g, "_");

    const { data, error } = await supabase
      .from("calling_scripts")
      .select("*")
      .eq("category", category)
      .maybeSingle();

    if (error) return res.json({ ok: false, error });

    if (!data) {
      // Fallback: universal
      const { data: universal } = await supabase
        .from("calling_scripts")
        .select("*")
        .eq("category", "universal")
        .maybeSingle();

      return res.json(universal || { opening_script: "No script available." });
    }

    return res.json(data);

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});


/* ============================================================
   5️⃣ TIMELINE GET
============================================================ */
router.post("/timeline", async (req, res) => {
  try {
    const { lead_id } = req.body;

    const { data, error } = await supabase
      .from("call_timeline")
      .select("*")
      .eq("lead_id", lead_id)
      .order("time", { ascending: false });

    if (error) return res.json({ ok: false });

    return res.json({ ok: true, timeline: data });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

/* ============================================================
   6️⃣ TIMELINE ADD
============================================================ */
router.post("/timeline/add", async (req, res) => {
  try {
    const { lead_id, event_text } = req.body;

    const ins = await supabase.from("call_timeline").insert([
      {
        lead_id,
        event_text,
        time: new Date().toISOString()
      }
    ]);

    if (ins.error) return res.json({ ok: false });

    return res.json({ ok: true });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});


/* ============================================================
   7️⃣ UPDATE LEAD STATUS (CALLING PANEL)
============================================================ */

router.post("/update-lead", async (req, res) => {
  try {
    const { id, status, notes, follow_date, follow_time } = req.body;

    const upd = await supabase
      .from("leads")
      .update({
        status,
        notes,
        follow_date,
        follow_time,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (upd.error) return res.json({ ok: false });

    return res.json({ ok: true });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

/* ============================================================
   8️⃣ UPLOAD RECORDING
============================================================ */

router.post("/upload-recording", async (req, res) => {
  return res.json({ ok:true, file_url:"" });
  // Later we integrate Supabase Storage
});

/* ============================================================
   EXPORT ROUTER
============================================================ */

export default router;




