console.log("EXTRACTOR ROUTES LOADED");

// -------------------------------------------------------
// Cloudora - Extractor Routes (FINAL FIXED BACKEND VERSION)
// -------------------------------------------------------

import express from "express";
import { createClient } from "@supabase/supabase-js";
import { extract as serpExtract } from "../services/serp_worker.js";

const router = express.Router();

// ✅ BACKEND SUPABASE CLIENT (SERVICE ROLE REQUIRED)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Debug
console.log("SUPABASE URL:", process.env.SUPABASE_URL);
console.log("SERVICE ROLE LOADED:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "YES" : "NO");

// -------------------------------------------------------
// 1) LIVE EXTRACTION (SERP → scraped_leads → assign)
// -------------------------------------------------------

router.post("/live", async (req, res) => {
    const { category, city, employee_id } = req.body;

    try {
        const leads = await serpExtract(category, city);

        console.log("SERP COUNT:", leads.length);

        let savedCount = 0;
        let assignedCount = 0;

        for (let lead of leads) {
            // ---------------------------
            // INSERT RAW LEAD
            // ---------------------------
             try {
        const leads = await serpExtract(category, city);
        console.log("SERP COUNT:", leads.length);

        let savedCount = 0;

        for (let lead of leads) {
            const { error } = await supabase
                .from("scraped_leads")
                .insert({
                    name: lead.name || null,
                    company: lead.name || null,       // fallback
                    contact_person: null,
                    phone: lead.phone || null,
                    email: lead.email || null,
                    address: lead.address || null,
                    city: city,
                    country: "India",
                    website: lead.website || null,
                    category: category,
                    source: "serpapi"
                });

            if (!error) savedCount++;
            else console.log("INSERT ERROR:", error);
        }

            // ---------------------------
            // ASSIGN LEAD
            // ---------------------------
            const { error: assignErr } = await supabase
                .from("scraped_leads_assignments")
                .insert({
                    scraped_lead_id: raw.id,
                    employee_id,
                    status: "assigned"
                });

            if (assignErr) {
                console.log("ASSIGN ERROR:", assignErr);
                continue;
            }

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
// 2) EXISTING DB LEADS → ASSIGN
// -------------------------------------------------------

router.post("/from-db", async (req, res) => {
    const { category, city, employee_id } = req.body;

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
});


// -------------------------------------------------------
// 3) GET MY ASSIGNED LEADS
// -------------------------------------------------------

router.get("/my-leads", async (req, res) => {
    const empID = req.query.employee_id;

    const { data, error } = await supabase
        .from("scraped_leads_assignments")
        .select("*, scraped_leads(*)")
        .eq("employee_id", empID)
        .order("created_at", { ascending: false });

    if (error) return res.json({ ok: false, error });

    return res.json({ ok: true, leads: data });
});


// -------------------------------------------------------
// 4) ASSIGN SELECTED LEADS
// -------------------------------------------------------

router.post("/assign-selected", async (req, res) => {
    const { lead_ids, employee_id } = req.body;

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
});


// -------------------------------------------------------
// 5) RAW LEADS LIST (Filter page)
// -------------------------------------------------------

router.get("/raw", async (req, res) => {
    const { category, city } = req.query;

    let query = supabase
        .from("scraped_leads")
        .select("*")
        .is("assigned_to", null);

    if (category) query = query.eq("category", category);
    if (city) query = query.eq("city", city);

    const { data, error } = await query.limit(200);

    if (error) return res.json({ ok: false, error });

    return res.json({ ok: true, leads: data });
});

export default router;
