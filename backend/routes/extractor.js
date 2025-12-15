console.log("EXTRACTOR ROUTES LOADED");

import express from "express";
import { supabase } from "../api/supabase.js";
import { extract as serpExtract } from "../services/serp_worker.js";
import { sendSalesEmail } from "../utils/mailer.js";

const router = express.Router();

/* -------------------------------------------------------
   1) LIVE EXTRACTION
-------------------------------------------------------- */
router.post("/live", async (req, res) => {
    const { category, city } = req.body;

    try {
        const leads = await serpExtract(category, city);
        let savedCount = 0;

        for (let lead of leads) {
            let rawId = null;

            if (lead.website) {
                const { data: exists } = await supabase
                    .from("scraped_leads")
                    .select("id")
                    .eq("website", lead.website)
                    .maybeSingle();

                if (exists) rawId = exists.id;
            }

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

                if (!error) {
                    savedCount++;
                    rawId = raw.id;
                }
            }
        }

        return res.json({ ok: true, saved: savedCount });
    } catch (err) {
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   2) RAW FILTER ENGINE
-------------------------------------------------------- */
router.get("/raw", async (req, res) => {
    const { search, category, city, country, freshness, assigned, employee_id } = req.query;

    try {
        let query = supabase.from("scraped_leads").select("*");

        if (assigned === "unassigned") query = query.is("assigned_to", null);
        if (assigned === "me") query = query.eq("assigned_to", employee_id);
        if (category) query = query.ilike("category", `%${category}%`);
        if (city) query = query.ilike("city", `%${city}%`);
        if (country) query = query.ilike("country", `%${country}%`);

        if (freshness && freshness !== "all") {
            const t = new Date(Date.now() - Number(freshness) * 86400000).toISOString();
            query = query.gte("created_at", t);
        }

        if (search)
            query = query.or(
                `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%,website.ilike.%${search}%`
            );

        const { data, error } = await query.order("created_at", { ascending: false });

        return error ? res.json({ ok: false, error }) : res.json({ ok: true, leads: data });
    } catch (err) {
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   3) ASSIGN SELECTED LEADS → status = pending
-------------------------------------------------------- */
router.post("/assign-selected", async (req, res) => {
    const { lead_ids, employee_id } = req.body;

    try {
        let count = 0;

        for (let id of lead_ids) {
            const { error: updErr } = await supabase
                .from("scraped_leads")
                .update({ assigned_to: employee_id, status: "pending" })
                .eq("id", id)
                .is("assigned_to", null);

            if (updErr) continue;

            await supabase.from("scraped_leads_assignments").insert({
                scraped_lead_id: id,
                employee_id,
                status: "pending"
            });

            count++;
        }

        return res.json({ ok: true, assigned: count });
    } catch (err) {
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   4) NEXT LEAD (pending only, sorted by creation time)
-------------------------------------------------------- */
router.post("/next-lead", async (req, res) => {
    const { employee_id } = req.body;

    try {
        const { data, error } = await supabase
            .from("scraped_leads_assignments")
            .select("id, status, scraped_leads(*)")
            .eq("employee_id", employee_id)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(1);

        if (error) return res.json({ ok: false, error });
        if (!data || data.length === 0)
            return res.json({ ok: false, message: "NO_LEADS" });

        return res.json({
            ok: true,
            assignment_id: data[0].id,
            lead: data[0].scraped_leads
        });

    } catch (err) {
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   5) COMPLETE LEAD
-------------------------------------------------------- */
router.post("/complete-lead", async (req, res) => {
    const { assignment_id, mark_status } = req.body;

    try {
        const { error } = await supabase
            .from("scraped_leads_assignments")
            .update({
                status: mark_status || "completed",
                completed_at: new Date().toISOString()
            })
            .eq("id", assignment_id);

        return error ? res.json({ ok: false, error }) : res.json({ ok: true });
    } catch (err) {
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   6) UPDATE LEAD DETAILS (scraped_leads)
-------------------------------------------------------- */
router.post("/update-lead", async (req, res) => {
    const { id, status, notes, follow_date, follow_time } = req.body;

    try {
        const { error } = await supabase
            .from("scraped_leads")
  .update({
    status,
    notes
  })
  .eq("id", id);

        return error ? res.json({ ok: false, error }) : res.json({ ok: true });
    } catch (err) {
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   7) TIMELINE → ADD ENTRY
-------------------------------------------------------- */
router.post("/timeline/add", async (req, res) => {
    const { lead_id, event_text } = req.body;

    try {
        const { error } = await supabase
            .from("scraped_leads_timeline")
            .insert({
                lead_id,
                event_text,
                time: new Date().toISOString()
            });

        return error ? res.json({ ok: false, error }) : res.json({ ok: true });
    } catch (err) {
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   8) TIMELINE → LIST
-------------------------------------------------------- */
router.post("/timeline", async (req, res) => {
    const { lead_id } = req.body;

    try {
        const { data, error } = await supabase
            .from("scraped_leads_timeline")
            .select("*")
            .eq("lead_id", lead_id)
            .order("time", { ascending: false });

        return error ? res.json({ ok: false, error }) : res.json({ ok: true, timeline: data });
    } catch (err) {
        return res.json({ ok: false, error: err.message });
    }
});

/* -------------------------------------------------------
   9) FORWARD TO SALES TEAM
-------------------------------------------------------- */
router.post("/forward-sales", async (req, res) => {
  const { lead_id, forwarded_by, source_department, follow_date, follow_time } = req.body;

  let salesDept = null;

  if (source_department === "tele_lead_domestic") {
    salesDept = "tele_sales_domestic";
  }

  if (source_department === "tele_lead_international") {
    salesDept = "tele_sales_international";
  }

  if (!salesDept) {
    return res.json({
      ok: false,
      error: "Invalid source department",
      received: source_department
    });
  }

  const { data: salesEmp } = await supabase
    .from("employees")
    .select("id, name, email")
    .ilike("department", `%${salesDept}%`)
    .order("last_assigned_at", { ascending: true })
    .limit(1)
    .single();

  if (!salesEmp) {
    return res.json({ ok: false, error: "No sales employee available" });
  }

  await supabase.from("sales_queue").insert({
    lead_id,
    assigned_to: salesEmp.id,
    follow_date,
    follow_time,
    status: "pending"
  });

  await supabase
    .from("employees")
    .update({ last_assigned_at: new Date().toISOString() })
    .eq("id", salesEmp.id);

  return res.json({ ok: true });
});

export default router;
