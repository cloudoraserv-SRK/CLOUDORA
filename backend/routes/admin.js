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

async function getLeads(req, res) {
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
}

async function getUnassignedTasks(req, res) {
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
}

async function insertLead(req, res) {
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
}

async function listGenieMembers(req, res) {
  try {
    const { data, error } = await supabase
      .from("genie_members")
      .select("id, member_id, tier, name, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return res.status(500).json({ ok: false, error: error.message });

    const members = data || [];
    const memberIds = members.map((item) => item.member_id).filter(Boolean);

    let profiles = [];
    let usage = [];
    let campaigns = [];

    if (memberIds.length) {
      const profileQuery = await supabase
        .from("genie_profiles")
        .select("member_id, business_name, industry, updated_at")
        .in("member_id", memberIds);
      if (!profileQuery.error) profiles = profileQuery.data || [];

      const usageQuery = await supabase
        .from("genie_usage_logs")
        .select("member_id, action_type, created_at")
        .in("member_id", memberIds)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (!usageQuery.error) usage = usageQuery.data || [];

      const campaignQuery = await supabase
        .from("genie_campaign_logs")
        .select("member_id, status, created_at, sent_count, failed_count")
        .in("member_id", memberIds)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!campaignQuery.error) campaigns = campaignQuery.data || [];
    }

    const profileMap = new Map(profiles.map((item) => [item.member_id, item]));
    const usageMap = new Map();
    const campaignMap = new Map();

    usage.forEach((item) => {
      if (!usageMap.has(item.member_id)) {
        usageMap.set(item.member_id, {
          totalUsage: 0,
          lastUsedAt: item.created_at || null
        });
      }
      usageMap.get(item.member_id).totalUsage += 1;
    });

    campaigns.forEach((item) => {
      if (!campaignMap.has(item.member_id)) {
        campaignMap.set(item.member_id, {
          campaignRuns: 0,
          totalSent: 0,
          totalFailed: 0
        });
      }
      const row = campaignMap.get(item.member_id);
      row.campaignRuns += 1;
      row.totalSent += Number(item.sent_count || 0);
      row.totalFailed += Number(item.failed_count || 0);
    });

    return res.json({
      ok: true,
      members: members.map((member) => ({
        ...member,
        profile: profileMap.get(member.member_id) || null,
        usage: usageMap.get(member.member_id) || { totalUsage: 0, lastUsedAt: null },
        campaigns: campaignMap.get(member.member_id) || {
          campaignRuns: 0,
          totalSent: 0,
          totalFailed: 0
        }
      }))
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}

async function createGenieMember(req, res) {
  try {
    const {
      member_id,
      access_code,
      tier = "business",
      name = "",
      status = "active"
    } = req.body || {};

    if (!member_id || !access_code) {
      return res.status(400).json({ ok: false, error: "member_id and access_code are required" });
    }

    const { error } = await supabase.from("genie_members").insert([
      {
        member_id,
        access_code,
        tier,
        name,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}

async function updateGenieMember(req, res) {
  try {
    const {
      id,
      member_id,
      access_code,
      tier,
      name,
      status
    } = req.body || {};

    if (!id) {
      return res.status(400).json({ ok: false, error: "id is required" });
    }

    const payload = {
      updated_at: new Date().toISOString()
    };

    if (member_id !== undefined) payload.member_id = member_id;
    if (access_code !== undefined) payload.access_code = access_code;
    if (tier !== undefined) payload.tier = tier;
    if (name !== undefined) payload.name = name;
    if (status !== undefined) payload.status = status;

    const { error } = await supabase
      .from("genie_members")
      .update(payload)
      .eq("id", id);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}

// ----------------------------
// VIEW ALL LEADS (manager/admin)
// ----------------------------
router.get("/leads", checkRole(["view_all_leads"]), getLeads);
router.get("/admin/leads", checkRole(["view_all_leads"]), getLeads);

// ----------------------------
// VIEW UNASSIGNED TASKS
// ----------------------------
router.get("/unassigned_tasks", checkRole(["assign_tasks"]), getUnassignedTasks);
router.get("/admin/unassigned_tasks", checkRole(["assign_tasks"]), getUnassignedTasks);

// ----------------------------
// INSERT LEAD (ADMIN)
// ----------------------------
router.post("/leads", insertLead);
router.post("/insert-lead", insertLead);

// ----------------------------
// GENIE MEMBER MANAGEMENT
// ----------------------------
router.get("/genie-members", listGenieMembers);
router.post("/genie-members", createGenieMember);
router.post("/genie-members/update", updateGenieMember);
router.post("/genie-members/deactivate", async (req, res) => {
  req.body = {
    ...(req.body || {}),
    status: req.body?.status || "paused"
  };
  return updateGenieMember(req, res);
});

export default router;
