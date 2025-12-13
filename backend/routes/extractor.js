// -----------------------------------------------
// Cloudora - Extractor Routes (FINAL)
// -----------------------------------------------

const express = require("express");
const router = express.Router();
const supabase = require("../supabase");
const serpWorker = require("../services/serp_worker");

// -------------------------------------------------------
// 1) LIVE EXTRACTION (SERP API → RAW TABLE → ASSIGN)
// -------------------------------------------------------

router.post("/live", async (req, res) => {
    const { category, city, employee_id } = req.body;

    try {
        // 1. SERP API EXTRACTOR
        const leads = await serpWorker.extract(category, city);

        let savedCount = 0;
        let assignedCount = 0;

        for (let lead of leads) {

            // 2. INSERT RAW LEAD
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

            // 3. ASSIGN LEAD TO EMPLOYEE
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
        console.log(err);
        return res.json({ ok: false, error: err.message });
    }
});



// -------------------------------------------------------
// 2) USE EXISTING DATABASE (RAW → ASSIGN)
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
        // 1. UPDATE RAW TABLE
        await supabase
            .from("scraped_leads")
            .update({ assigned_to: employee_id, status: "assigned" })
            .eq("id", lead.id);

        // 2. INSERT ASSIGNMENT ENTRY
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
// 3) MY EXTRACTED / ASSIGNED LEADS
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
// 4) ASSIGN SELECTED LEADS (LEAD FILTERS PAGE)
// -------------------------------------------------------

router.post("/assign-selected", async (req, res) => {
    const { lead_ids, employee_id } = req.body;

    for (let id of lead_ids) {

        // Update RAW lead
        await supabase
            .from("scraped_leads")
            .update({ assigned_to: employee_id, status: "assigned" })
            .eq("id", id);

        // Add to assignment table
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
// 5) RAW LEADS LIST (FOR LEAD FILTERS PAGE)
// -------------------------------------------------------

router.get("/raw", async (req, res) => {
    const { category, city } = req.query;

    let query = supabase.from("scraped_leads").select("*").is("assigned_to", null);

    if (category) query = query.eq("category", category);
    if (city) query = query.eq("city", city);

    const { data, error } = await query.limit(200);

    if (error) return res.json({ ok: false, error });

    return res.json({ ok: true, leads: data });
});

module.exports = router;
