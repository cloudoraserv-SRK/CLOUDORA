import express from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabaseClient.js";

const router = express.Router();

function hashPassword(value = "") {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sanitizeClient(client) {
  return {
    id: client.id,
    client_id: client.client_id,
    name: client.name || "",
    email: client.email || "",
    business_name: client.business_name || "",
    phone: client.phone || "",
    status: client.status || "active"
  };
}

router.post("/signup", async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      password = "",
      phone = "",
      business_name = ""
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: "name, email, and password are required" });
    }

    const client_id = `CL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const password_hash = hashPassword(password);

    const { data, error } = await supabase
      .from("clients")
      .insert([{
        client_id,
        name,
        email: email.toLowerCase(),
        password_hash,
        phone,
        business_name,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select("*")
      .maybeSingle();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, client: sanitizeClient(data) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email and password are required" });
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("password_hash", hashPassword(password))
      .maybeSingle();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (!data) return res.status(401).json({ ok: false, error: "Invalid client credentials" });

    return res.json({ ok: true, client: sanitizeClient(data) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
