// CLOUDORA GENIE - FLOW MANAGER (FINAL STABLE)
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JOB FIELDS
export const JOB_FIELDS = [
  "name",
  "phone",
  "email",
  "city",
  "role_applied",
  "experience_years",
  "languages",
  "preferred_shift",
];

// NEXT FIELD
export function getNextMissingField(state, FIELDS) {
  for (const f of FIELDS) {
    if (!state[f] || state[f].toString().trim() === "") return f;
  }
  return null;
}

// SUBMIT JOB APPLICATION
export async function submitJobApplication(data) {
  const rowData = {
    name: data.name || "",
    phone: data.phone || "",
    email: data.email || "",
    city: data.city || "",
    role_applied: data.role_applied || "",
    experience_years: data.experience_years || "",
    languages: data.languages || "",
    preferred_shift: data.preferred_shift || "",
    notes: "Genie auto-generated application",
    status: "pending"
  };

  const { data: row, error } = await supabase
    .from("job_applications")
    .insert(rowData)
    .select()
    .single();

  if (error) throw error;
  return row;
}

// SUBMIT BUSINESS LEADS
export async function submitLead(data) {
  const payload = {
    name: data.name || "",
    phone: data.phone || "",
    email: data.email || "",
    business_name: data.business_name || "",
    requirement: data.requirement || "",
    budget_range: data.budget_range || "",
    timeline: data.timeline || "",
    preferred_contact: data.preferred_contact || ""
  };

  const { data: row, error } = await supabase
    .from("business_leads")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return row;
}

// EMBEDDINGS (kept for future, no use in genie-core now)
export async function embedText(text) {
  const res = await fetch(process.env.GEMINI_EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GOOGLE_API_KEY
    },
    body: JSON.stringify({
      model: "text-embedding-004",
      input: text
    })
  });

  const data = await res.json();
  return data.embedding || data.data?.[0]?.embedding;
}

export async function matchKB(embedding, limit = 5) {
  const { data, error } = await supabase.rpc("match_kb", {
    query_embedding: embedding,
    match_count: limit
  });
  if (error) return [];
  return data || [];
}

// ONBOARDING LOG
export async function logOnboardingStep(step, answer, applicationId) {
  await supabase.from("onboarding_logs").insert({
    step,
    answer,
    application_id: applicationId || null
  });
}
