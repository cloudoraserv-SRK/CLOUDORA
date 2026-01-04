import { supabase } from "../lib/supabaseClient.js";

export async function autoAssignLead(lead) {
  if (!lead?.id) return;

  // 1. routing rule
  const { data: rules } = await supabase
    .from("routing_rules")
    .select("*");

  const rule = rules?.find(r =>
    r.condition?.department === lead.department ||
    r.condition?.lead_type === lead.lead_type
  );

  if (!rule) return;

  // 2. find employee
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("department", rule.assign_department)
    .eq("status", "active")
    .order("current_load", { ascending: true })
    .limit(1)
    .single();

  if (!emp) return;

  // 3. assign in leads table
  await supabase
    .from("leads")
    .update({ assigned_to: emp.id, status: "assigned" })
    .eq("id", lead.id);

  // 4. sales queue
  await supabase.from("sales_queue").insert([{
    lead_id: lead.id,
    assigned_to: emp.id,
    source_department: rule.assign_department
  }]);

  // 5. update load
  await supabase
    .from("employees")
    .update({ current_load: emp.current_load + 1 })
    .eq("id", emp.id);
}
