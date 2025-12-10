// backend/routes/leads_upload.js
import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper: simple CSV parser (header row required)
function parseCSV(buffer) {
  const s = buffer.toString("utf8").replace(/\r\n/g, "\n");
  const lines = s.split("\n").filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(l => {
    // naive split — works for normal CSVs without commas in fields
    const cols = l.split(",").map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] ?? "");
    return obj;
  });
  return { headers, rows };
}

// Basic validator for a row
function validateRow(row) {
  // require at least phone or email or name
  if (!(row.phone || row.email || row.name)) return false;
  return true;
}

// Round-robin assigner: fetch available telecallers and cycle through them
async function getTelecallersList() {
  // expects employees table has columns: id, role, level, status
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("role", "telecaller")
    .in("status", ["active","available"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("telecallers fetch error", error);
    return [];
  }
  return (data || []).map(d => d.id);
}

async function assignTelecallerRoundRobin(telecallers, idx) {
  if (!telecallers || !telecallers.length) return null;
  return telecallers[idx % telecallers.length];
}

// POST /api/leads/upload  form-data: file=csv
router.post("/leads/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded (key=file)" });

    const { headers, rows } = parseCSV(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: "CSV contained no rows" });

    // normalize headers to expected keys (lowercase)
    const normalizedRows = rows.map(r => {
      const out = {};
      for (const k of Object.keys(r)) {
        out[k.trim().toLowerCase()] = r[k];
      }
      // common expected fields:
      return {
        name: out.name || out.fullname || out.contact_name || "",
        phone: out.phone || out.mobile || out.contact || "",
        email: out.email || out.mail || "",
        business_name: out.business_name || out.company || out.org || "",
        requirement: out.requirement || out.notes || out.desc || "",
        country: out.country || out.ctry || "IN",
        product: out.product || out.service || "general",
        budget: out.budget || out.budget_range || "",
        timeline: out.timeline || out.when || ""
      };
    });

    // validate rows and prepare insert payloads
    const good = [];
    const bad = [];
    for (const r of normalizedRows) {
      if (!validateRow(r)) bad.push({ row: r, reason: "missing phone/email/name" });
      else good.push(r);
    }

    if (!good.length) return res.status(400).json({ error: "No valid rows to insert", bad });

    // fetch telecallers list once
    const telecallers = await getTelecallersList();

    // bulk insert leads
    const leadPayload = good.map(g => ({
      name: g.name,
      phone: g.phone,
      email: g.email,
      business_name: g.business_name,
      requirement: g.requirement,
      country: g.country,
      product: g.product,
      budget_range: g.budget,
      timeline: g.timeline,
      created_at: new Date().toISOString()
    }));

    const { data: leadInsertRes, error: leadInsertErr } = await supabase
      .from("leads")
      .insert(leadPayload)
      .select("id");

    if (leadInsertErr) {
      console.error("lead insert error", leadInsertErr);
      return res.status(500).json({ error: "Failed to insert leads", detail: leadInsertErr });
    }

    // Create tasks for each lead and assign telecallers round-robin
    const tasks = [];
    for (let i = 0; i < (leadInsertRes || []).length; i++) {
      const leadRow = leadInsertRes[i];
      const source = good[i];
      const assignedTo = await assignTelecallerRoundRobin(telecallers, i);
      const task = {
        employee_id: assignedTo,         // may be null if no telecallers
        task_type: "call",
        lead_id: leadRow.id,
        status: assignedTo ? "assigned" : "unassigned",
        country: source.country,
        product: source.product,
        shift: source.shift || "general",
        created_at: new Date().toISOString()
      };
      tasks.push(task);
    }

    if (tasks.length) {
      const { error: taskErr } = await supabase.from("employee_tasks").insert(tasks);
      if (taskErr) {
        console.error("task insert error", taskErr);
        // not fatal — continue
      }
    }

    return res.json({
      ok: true,
      inserted_leads: leadInsertRes.length,
      tasks_created: tasks.length,
      bad_rows: bad
    });

  } catch (e) {
    console.error("leads upload exception", e);
    return res.status(500).json({ error: e.message || e });
  }
});

export default router;
