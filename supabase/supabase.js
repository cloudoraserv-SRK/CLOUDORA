import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://gnihhujwqxkigwwnksgw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaWhodWp3cXhraWd3d25rc2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4OTc2MjcsImV4cCI6MjA4MDQ3MzYyN30.tOYXHySzEQ2py-NUNBmlpp7QWciaGSSD_NeWpLbeRaw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Insert lead
export async function insertLead(payload) {
  return await supabase.from("leads").insert([payload]);
}

// Log activity
export async function logActivity(employee_id, action, details = {}) {
  return await supabase.from("activity_log").insert([
    { employee_id, action, details }
  ]);
}
