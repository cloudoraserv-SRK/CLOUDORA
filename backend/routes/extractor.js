console.log("EXTRACTOR ROUTES LOADED");

// -------------------------------------------------------
// Cloudora - Extractor Routes (FULL VERSION - ESM)
// -------------------------------------------------------

import express from "express";
import supabase from "../api/supabase.js";
import { extract as serpExtract } from "../services/serp_worker.js";

const router = express.Router();

// -------------------------------------------------------
// 1) LIVE EXTRACTION (SERP API → RAW TABLE → ASSIGN)
// -------------------------------------------------------

router.post("/live", async (req, res) => {
  const { category, city, employee_id } = req.body;

  try {
    const leads = await serpExtract(category, city);

    let savedCount = 0;
    let assignedCount = 0;

    for (let lead of leads) {
      const { data: raw, error } = await supabase
        .from("scraped_leads")
        .insert({
          name: lead.name || null,
          phone: lead.phone || null,
          email: lead.email || null,
          address: lead.address || null,
          category,
          city,
          website: lead.website || null,
          source: "serpapi",
          assigned_to: null,
          status: "raw"
        })
        .select()
        .single();

      if (error) continue;
      savedCount++;

      await supabase
        .from("scraped_leads_assignments")
        .insert({
          scraped_lead_id: raw.id,
          employee_id,
          status: "assigned"
        });

      assignedCount++;
    }

    return res.json({
      ok: true,
      saved: savedCount,
      assigned: assignedCount
    });

  } catch (err) {
    console.log("LIVE ERROR:", err);
    return res.json({ ok: false, error: err.message });
  }
});


// -------------------------------------------------------
// 2) EXISTING DATABASE (RAW → ASSIGN)
// -------------------------------------------------------

router.post("/from-db", async (req, res) => {
  const { category, city, employee_id } = req.body;

  try {
    const { data: leads, error } = await supabase
      .from("scraped_leads")
      .select("*")
      .eq("city", city)
      .eq("category", category)
      .is("assigned_to", null)
      .limit(50);

    if (error) return res.json({ ok: false, error });

    let assignedCount = 0;

    for (let lead of leads) {
      await supabase
        .from("scraped_leads")
        .update({ assigned_to: employee_id, status: "assigned" })
        .eq("id", lead.id);

      await supabase
        .from("scraped_leads_assignments")
        .insert({
          scraped_lead_id: lead.id,
          employee_id,
          status: "assigned"
        });

      assignedCount++;
    }

    return res.json({ ok: true, assigned: assignedCount });

  } catch (err) {
    console.log("FROM DB ERROR:", err);
    return res.json({ ok: false, error: err.message });
  }
});


// -------------------------------------------------------
// 3) MY ASSIGNED / EXTRACTED LEADS
// -------------------------------------------------------

router.get("/my-leads", async (req, res) => {
  const empID = req.query.employee_id;

  try {
    const { data, error } = await supabase
      .from("scraped_leads_assignments")
      .select("*, scraped_leads(*)")
      .eq("employee_id", empID)
      .order("created_at", { ascending: false });

    if (error) return res.json({ ok: false, error });

    return res.json({ ok: true, leads: data });

  } catch (err) {
    console.log("MY LEADS ERROR:", err);
    return res.json({ ok: false, error: err.message });
  }
});


// -------------------------------------------------------
// 4) ASSIGN SELECTED LEADS
// -------------------------------------------------------

router.post("/assign-selected", async (req, res) => {
  const { lead_ids, employee_id } = req.body;

  try {
    for (let id of lead_ids) {
      await supabase
        .from("scraped_leads")
        .update({ assigned_to: employee_id, status: "assigned" })
        .eq("id", id);

      await supabase
        .from("scraped_leads_assignments")
        .insert({
          scraped_lead_id: id,
          employee_id,
          status: "assigned"
        });
    }

    return res.json({ ok: true, assigned: lead_ids.length });

  } catch (err) {
    console.log("ASSIGN SELECTED ERROR:", err);
    return res.json({ ok: false, error: err.message });
  }
});


// -------------------------------------------------------
// 5) RAW LEADS (FILTER PAGE)
// -------------------------------------------------------

router.get("/raw", async (req, res) => {
  const { category, city } = req.query;

  try {
    let query = supabase
      .from("scraped_leads")
      .select("*")
      .is("assigned_to", null);

    if (category) query = query.eq("category", category);
    if (city) query = query.eq("city", city);

    const { data, error } = await query.limit(200);

    if (error) return res.json({ ok: false, error });

    return res.json({ ok: true, leads: data });

  } catch (err) {
    console.log("RAW ERROR:", err);
    return res.json({ ok: false, error: err.message });
  }
});


// -------------------------------------------------------
// EXPORT
// -------------------------------------------------------

export default router;
