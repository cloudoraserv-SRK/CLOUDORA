console.log("EXTRACTOR ROUTES LOADED");

// -------------------------------------------------------
// Cloudora Extractor Routes (FINAL STABLE V4 FULL FILTER ENGINE)
// -------------------------------------------------------

import express from "express";
import { supabase } from "../api/supabase.js";
import { extract as serpExtract } from "../services/serp_worker.js";

const router = express.Router();

/* -------------------------------------------------------
   1) LIVE EXTRACTION (NO AUTO ASSIGN)
-------------------------------------------------------- */
router.post("/live", async (req, res) => {
    const { category, city } = req.body;

    try {
        const leads = await serpExtract(category, city);
        let savedCount = 0;

        for (let lead of leads) {
            let rawId = null;

            // Duplicate check by website
            if (lead.website) {
                const { data: exists } = await supabase
                    .from("scraped_leads")
                    .select("id")
                    .eq("website", lead.website)
                    .maybeSingle();

                if (exists) {
                    console.log("DUPLICATE FOUND:", lead.website);
                    rawId = exists.id;
                }
            }

            // Insert new lead
            if (!rawId) {
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
                        status: "raw",
                        country: lead.country || null
                    })
                    .select()
                    .single();

                if (error) {
                    console.log("INSERT ERROR:", error);
                    continue;
                }

                rawId = raw.id;
                savedCount++;
            }
        }

        return res.json({ ok: true, saved: savedCount });

    } catch (err) {
        console.log("LIVE ERROR:", err);
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   2) RAW LEADS WITH FULL FILTERING (UI FILTER ENGINE)
-------------------------------------------------------- */
router.get("/raw", async (req, res) => {
    const { search, category, city, country, freshness, assigned, employee_id } = req.query;

    try {
        let query = supabase
            .from("scraped_leads")
            .select("*");

        // Assigned filter
        if (assigned === "unassigned")
            query = query.is("assigned_to", null);

        if (assigned === "me")
            query = query.eq("assigned_to", employee_id);

        // Category
        if (category && category.trim() !== "")
            query = query.ilike("category", `%${category}%`);

        // City
        if (city && city.trim() !== "")
            query = query.ilike("city", `%${city}%`);

        // Country
        if (country && country.trim() !== "")
            query = query.ilike("country", `%${country}%`);

        // Freshness (X days)
        if (freshness && freshness !== "all") {
            const days = Number(freshness);
            const threshold = new Date(Date.now() - days * 86400000).toISOString();
            query = query.gte("created_at", threshold);
        }

        // Search (OR query)
        if (search && search.trim() !== "") {
            query = query.or(
                `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,` +
                `address.ilike.%${search}%,website.ilike.%${search}%`
            );
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) return res.json({ ok: false, error });

        return res.json({ ok: true, leads: data });

    } catch (err) {
        console.log("FILTER RAW ERROR:", err);
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   3) ASSIGN SELECTED LEADS
-------------------------------------------------------- */
router.post("/assign-selected", async (req, res) => {
    const { lead_ids, employee_id } = req.body;

    try {
        let assignedCount = 0;

        for (let id of lead_ids) {
            // assign only if free
            const { error: updErr } = await supabase
                .from("scraped_leads")
                .update({ assigned_to: employee_id, status: "assigned" })
                .eq("id", id)
                .is("assigned_to", null);

            if (updErr) continue;

            // insert assignment log
            const { error: assignErr } = await supabase
                .from("scraped_leads_assignments")
                .insert({
                    scraped_lead_id: id,
                    employee_id,
                    status: "assigned"
                });

            if (!assignErr) assignedCount++;
        }

        return res.json({ ok: true, assigned: assignedCount });

    } catch (err) {
        console.log("ASSIGN ERROR:", err);
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   4) MY LEADS (CALL PANEL)
-------------------------------------------------------- */
router.get("/my-leads", async (req, res) => {
    const employee_id = req.query.employee_id;

    try {
        const { data, error } = await supabase
            .from("scraped_leads_assignments")
            .select("*, scraped_leads(*)")
            .eq("employee_id", employee_id)
            .order("created_at", { ascending: false });

        if (error) return res.json({ ok: false, error });

        return res.json({ ok: true, leads: data });

    } catch (err) {
        console.log("MY LEADS ERR:", err);
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   5) AUTO DEASSIGN IF NO PROGRESS (48 HOURS)
-------------------------------------------------------- */
router.post("/auto-deassign", async (req, res) => {
    try {
        const threshold = new Date(Date.now() - 48 * 3600000).toISOString();

        await supabase.rpc("auto_deassign_leads", { since_time: threshold });

        return res.json({ ok: true });

    } catch (err) {
        console.log("AUTO DEASSIGN ERROR:", err);
        return res.json({ ok: false, error: err.message });
    }
});
// -------------------------------------------------------
// 6) FETCH NEXT LEAD FOR EMPLOYEE (CORRECT + AUTO SKIP)
// -------------------------------------------------------
router.post("/next-lead", async (req, res) => {
    const { employee_id } = req.body;

    if (!employee_id)
        return res.json({ ok: false, error: "Missing employee_id" });

    try {
        // Get employee's assigned leads (pending / assigned)
        const { data, error } = await supabase
            .from("scraped_leads_assignments")
            .select("id, status, scraped_lead_id, scraped_leads(*)")
            .eq("employee_id", employee_id)
            .in("status", ["assigned", "pending"])
            .order("created_at", { ascending: true });

        if (error) return res.json({ ok: false, error });
        if (!data || data.length === 0)
            return res.json({ ok: false, message: "NO_LEADS" });

        let nextLead = null;

        for (let row of data) {
            const lead = row.scraped_leads;

            // Auto-skip 1: Empty phone number
            if (!lead.phone || lead.phone.trim() === "") {
                await supabase
                    .from("scraped_leads_assignments")
                    .update({ status: "skipped" })
                    .eq("id", row.id);

                continue;
            }

            // Auto-skip 2: Mark stale leads older than 48 hrs as expired
            const assignedAt = new Date(row.created_at);
            const now = new Date();
            const hours = (now - assignedAt) / (1000 * 60 * 60);

            if (hours > 48) {
                await supabase
                    .from("scraped_leads_assignments")
                    .update({ status: "expired" })
                    .eq("id", row.id);

                continue;
            }

            // This is the next lead for the employee
            nextLead = lead;
            break;
        }

        if (!nextLead)
            return res.json({ ok: false, message: "NO_VALID_LEADS" });

        return res.json({
            ok: true,
            lead: nextLead
        });

    } catch (err) {
        console.log("NEXT LEAD ERROR:", err);
        return res.json({ ok: false, error: err.message });
    }
});


export default router;
