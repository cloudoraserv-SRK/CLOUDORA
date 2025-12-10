// backend/routes/auth.js
import express from "express";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import crypto from "crypto";

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Simple "login" by phone or email (no password) — returns employee object and a short-lived token (optional)
router.post("/login", async (req, res) => {
  try {
    const { phone, email } = req.body || {};
    if (!phone && !email) return res.status(400).json({ error: "phone or email required" });

    const q = phone
      ? supabase.from("employees").select("*").eq("phone", phone).maybeSingle()
      : supabase.from("employees").select("*").eq("email", email).maybeSingle();

    const { data: emp, error } = await q;
    if (error) return res.status(500).json({ error: error.message || error });

    if (!emp) return res.status(404).json({ error: "Employee not found" });

    // create a simple session token and store in employees table (session_token + token_expiry)
    const token = crypto.randomBytes(20).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(); // 8 hours

    await supabase.from("employees").update({ session_token: token, token_expiry: expiry }).eq("id", emp.id);

    // return employee (id, name, role) + token
    return res.json({
      ok: true,
      employee: { id: emp.id, name: emp.name || emp.full_name || null, role: emp.role || null },
      token
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || e });
  }
});

// GET /api/auth/me  -> requires header x-employee-token
router.get("/me", async (req, res) => {
  try {
    const token = req.headers["x-employee-token"] || req.query.token;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data: emp, error } = await supabase.from("employees").select("*").eq("session_token", token).maybeSingle();
    if (error) return res.status(500).json({ error: error.message || error });
    if (!emp) return res.status(401).json({ error: "Invalid token" });

    // check expiry
    if (emp.token_expiry && new Date(emp.token_expiry) < new Date()) {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.json({ ok: true, employee: { id: emp.id, name: emp.name || emp.full_name, role: emp.role } });
  } catch (e) {
    return res.status(500).json({ error: e.message || e });
  }
});

// POST /api/auth/logout  -> invalidate token
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers["x-employee-token"] || req.body.token;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const { error } = await supabase.from("employees").update({ session_token: null, token_expiry: null }).eq("session_token", token);
    if (error) return res.status(500).json({ error: error.message || error });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || e });
  }
});

export default router;
