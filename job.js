import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Supabase service key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -------------------------------------------------------
// Helper: Generate Employee ID
// -------------------------------------------------------
function generateEmployeeID() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EMP-${Date.now().toString().slice(-6)}-${rand}`;
}

// Helper: Generate Password
function generatePassword() {
  return Math.random().toString(36).slice(2, 10);
}

// -------------------------------------------------------
// 1️⃣ APPLY (JOB FORM SUBMISSION)
// -------------------------------------------------------
router.post("/apply", async (req, res) => {
  try {
    const data = req.body;

    // create lead_uid
    const lead_uid = "LEAD-" + Math.random().toString(36).slice(2, 10).toUpperCase();

    const insert = await supabase.from("leads").insert([
      {
        lead_uid,
        name: data.name,
        phone: data.phone,
        email: data.email,
        city: data.city,
        gender: data.gender,
        dob: data.dob,
        department: data.department,
        job_type: data.jobType,
        shift: data.shift,
        country_pref: data.country,
        salary_expectation: data.salary,
        experience: data.experience,
        skills: data.skills,
        languages: data.languages,
        why_hire: data.why,
        apply_for_employee: data.apply_for_employee || false,
        source: data.source,
        agreement_status: false,
        agreement_time: null
      }
    ]);

    if (insert.error) {
      console.log(insert.error);
      return res.json({ ok: false, error: insert.error.message });
    }

    return res.json({
      ok: true,
      lead: { lead_uid }
    });
  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

// -------------------------------------------------------
// 2️⃣ AGREEMENT ACCEPT
// -------------------------------------------------------
router.post("/agreement-accept", async (req, res) => {
  try {
    const { lead_uid } = req.body;

    const upd = await supabase
      .from("leads")
      .update({
        agreement_status: true,
        agreement_time: new Date().toISOString()
      })
      .eq("lead_uid", lead_uid);

    if (upd.error) {
      return res.json({ ok: false, error: upd.error.message });
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

// -------------------------------------------------------
// 3️⃣ VERIFY LEAD BEFORE GENERATING EMPLOYEE ID
// -------------------------------------------------------
router.post("/verify-lead", async (req, res) => {
  try {
    const { lead_uid } = req.body;

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("lead_uid", lead_uid)
      .maybeSingle();

    if (error || !data) {
      return res.json({ ok: false, error: "Lead not found" });
    }

    return res.json({ ok: true, lead: data });
  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

// -------------------------------------------------------
// 4️⃣ CREATE EMPLOYEE (ONLY IF NOT ALREADY CREATED)
// -------------------------------------------------------
router.post("/create-employee", async (req, res) => {
  try {
    const { lead_uid } = req.body;

    // STEP 1 – check lead exists
    const { data: lead, error: e1 } = await supabase
      .from("leads")
      .select("*")
      .eq("lead_uid", lead_uid)
      .maybeSingle();

    if (e1 || !lead) {
      return res.json({ ok: false, error: "Lead not found" });
    }

    // Check agreement
    if (!lead.agreement_status) {
      return res.json({
        ok: false,
        error: "Agreement not accepted"
      });
    }

    // STEP 2 — check if employee already exists for this lead
    const { data: existingEmp } = await supabase
      .from("employees")
      .select("*")
      .eq("lead_uid", lead_uid)
      .maybeSingle();

    if (existingEmp) {
      return res.json({
        ok: true,
        employee: {
          employee_id: existingEmp.employee_id,
          password: existingEmp.password
        }
      });
    }

    // STEP 3 — generate new employee
    const empID = generateEmployeeID();
    const pass = generatePassword();

    const ins = await supabase.from("employees").insert([
      {
        employee_id: empID,
        password: pass,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        lead_uid: lead.lead_uid,
        department: lead.department,
        job_type: lead.job_type,
        shift: lead.shift,
        status: "active",
        created_at: new Date().toISOString()
      }
    ]);

    if (ins.error) {
      return res.json({ ok: false, error: ins.error.message });
    }

    return res.json({
      ok: true,
      employee: {
        employee_id: empID,
        password: pass
      }
    });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});
router.post("/my-leads", async (req, res) => {
  try {
    const { employee_id } = req.body;

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("assigned_to", employee_id);

    if (error) return res.json({ ok: false });

    return res.json({ ok: true, leads: data });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});
router.post("/update-lead", async (req, res) => {
  try {
    const { id, employee_id, status, notes } = req.body;

    const upd = await supabase
      .from("leads")
      .update({
        status,
        notes,
        last_updated_by: employee_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (upd.error) return res.json({ ok: false });

    return res.json({ ok: true });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});
// -------------------------------------------------------
// 5️⃣ EMPLOYEE LOGIN
// -------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("password", password)
      .maybeSingle();

    if (error || !data) {
      return res.json({
        ok: false,
        error: "Invalid Employee ID or Password"
      });
    }

    return res.json({
      ok: true,
      employee: {
        employee_id: data.employee_id,
        name: data.name,
        department: data.department
      }
    });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});
router.post("/next-lead", async (req, res) => {
  const { employee_id } = req.body;

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("assigned_to", employee_id)
    .eq("status", "pending")
    .order("id", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return res.json({ ok:false });
  }

  return res.json({ ok:true, lead: data[0] });
});

router.post("/attendance-status", async (req, res) => {
  const { employee_id } = req.body;

  const today = new Date().toISOString().slice(0,10);

  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employee_id)
    .eq("date", today)
    .maybeSingle();

  if (!data) return res.json({ ok:true, status:"Not Checked-In" });

  if (data.check_in && !data.check_out)
    return res.json({ ok:true, status:"Present" });

  if (data.check_out)
    return res.json({ ok:true, status:"Completed" });

  return res.json({ ok:true, status:"Not Checked-In" });
});

router.post("/check-in", async (req, res) => {
  const { employee_id } = req.body;

  const today = new Date().toISOString().slice(0,10);

  await supabase.from("attendance").insert([
    {
      employee_id,
      date: today,
      check_in: new Date().toISOString()
    }
  ]);

  return res.json({ ok:true });
});

router.post("/check-out", async (req, res) => {
  const { employee_id } = req.body;

  const today = new Date().toISOString().slice(0,10);

  await supabase
    .from("attendance")
    .update({ check_out: new Date().toISOString() })
    .eq("employee_id", employee_id)
    .eq("date", today);

  return res.json({ ok:true });
});
router.post("/attendance-status", async (req, res) => {
  const { employee_id } = req.body;

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employee_id)
    .eq("date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    return res.json({ ok: false, error: error.message });
  }

  return res.json({
    ok: true,
    status: data ? data.status : "Absent"
  });
});
router.post("/check-in", async (req, res) => {
  const { employee_id } = req.body;

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance")
    .insert({
      employee_id,
      date: today,
      status: "Present",
      check_in: new Date()
    });

  if (error) return res.json({ ok: false, error: error.message });

  return res.json({ ok: true });
});

router.post("/check-out", async (req, res) => {
  const { employee_id } = req.body;

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance")
    .update({
      status: "Completed",
      check_out: new Date()
    })
    .eq("employee_id", employee_id)
    .eq("date", today);

  if (error) return res.json({ ok: false, error: error.message });

  return res.json({ ok: true });
});
router.post("/daily-score", async (req, res) => {
  try {
    const { employee_id } = req.body;
    const today = new Date().toISOString().slice(0,10);

    // 1️⃣ Count calls
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("assigned_to", employee_id)
      .eq("updated_at", today);

    const completedCalls = leads?.length || 0;
    const interested = leads?.filter(l => l.status === "interested").length || 0;
    const callbacks = leads?.filter(l => l.status === "callback").length || 0;
    const notInterested = leads?.filter(l => l.status === "not_interested").length || 0;

    // Basic scoring model:
    let score = 0;
    score += completedCalls * 2;  
    score += interested * 10;  
    score += callbacks * 5;  

    // Negative impact:
    score -= notInterested * 1;

    return res.json({
      ok: true,
      score,
      metrics: [
        { title: "Calls Completed", value: completedCalls },
        { title: "Interested Leads", value: interested },
        { title: "Callback Leads", value: callbacks },
        { title: "Not Interested", value: notInterested },
      ]
    });

  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});
router.get("/training/modules", async (req, res) => {
  const { data, error } = await supabase.from("training_modules").select("*");

  if (error) return res.json({ ok:false });
  return res.json({ ok:true, modules:data });
});
router.get("/training/questions", async (req, res) => {
  const module_id = req.query.module_id;

  const { data, error } = await supabase
    .from("training_questions")
    .select("*")
    .eq("module_id", module_id);

  if (error) return res.json({ ok:false });

  return res.json({ ok:true, questions:data });
});
router.post("/training/submit", async (req, res) => {
  const { employee_id, module_id, answers } = req.body;

  const { data: questions } = await supabase
    .from("training_questions")
    .select("*")
    .eq("module_id", module_id);

  let score = 0;

  questions.forEach(q => {
    if (answers[q.id] === q.correct_option) score++;
  });

  await supabase.from("training_results").insert([
    {
      employee_id,
      module_id,
      score,
      total: questions.length,
      status: score >= Math.ceil(questions.length/2) ? "pass" : "fail"
    }
  ]);

  return res.json({
    ok:true,
    score,
    total: questions.length
  });
});
router.post("/filter-leads", async (req, res) => {
  try {
    const filters = req.body;

    let query = supabase.from("leads").select("*");

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.country) query = query.eq("country_pref", filters.country);
    if (filters.shift) query = query.eq("shift", filters.shift);
    if (filters.city) query = query.ilike("city", `%${filters.city}%`);
    if (filters.department) query = query.ilike("department", `%${filters.department}%`);
    if (filters.segment) query = query.ilike("segment", `%${filters.segment}%`);

    const { data, error } = await query;

    if (error) return res.json({ ok:false });

    return res.json({ ok:true, leads:data });

  } catch (e) {
    return res.json({ ok:false, error:e.message });
  }
});

export default router;
