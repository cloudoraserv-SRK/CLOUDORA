import crypto from "crypto";
import { supabase } from "../api/supabase.js";

function sanitizeEmployee(emp) {
  return {
    id: emp.id,
    employee_id: emp.employee_id,
    name: emp.name || emp.full_name || null,
    department: emp.department || null,
    role: emp.role || null,
  };
}

export async function loginEmployee({ employee_id, password }) {
  if (!employee_id || !password) {
    return {
      ok: false,
      status: 400,
      error: "employee_id and password are required",
    };
  }

  const { data: emp, error } = await supabase
    .from("employees")
    .select("*")
    .eq("employee_id", employee_id)
    .eq("password", password)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: error.message || "Login failed" };
  }

  if (!emp) {
    return { ok: false, status: 401, error: "Invalid Employee ID or Password" };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiry = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString();

  const { error: sessionError } = await supabase
    .from("employees")
    .update({
      session_token: token,
      token_expiry: expiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", emp.id);

  if (sessionError) {
    return { ok: false, status: 500, error: sessionError.message || "Session update failed" };
  }

  return {
    ok: true,
    status: 200,
    employee: sanitizeEmployee(emp),
    token,
    token_expiry: expiry,
  };
}

export async function getEmployeeByToken(token) {
  if (!token) {
    return { ok: false, status: 401, error: "Missing token" };
  }

  const { data: emp, error } = await supabase
    .from("employees")
    .select("*")
    .eq("session_token", token)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: error.message || "Lookup failed" };
  }

  if (!emp) {
    return { ok: false, status: 401, error: "Invalid token" };
  }

  if (emp.token_expiry && new Date(emp.token_expiry) < new Date()) {
    return { ok: false, status: 401, error: "Token expired" };
  }

  return {
    ok: true,
    status: 200,
    employee: sanitizeEmployee(emp),
  };
}

export async function logoutEmployee(token) {
  if (!token) {
    return { ok: false, status: 400, error: "Missing token" };
  }

  const { error } = await supabase
    .from("employees")
    .update({
      session_token: null,
      token_expiry: null,
      updated_at: new Date().toISOString(),
    })
    .eq("session_token", token);

  if (error) {
    return { ok: false, status: 500, error: error.message || "Logout failed" };
  }

  return { ok: true, status: 200 };
}
