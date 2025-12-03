// api/supabase.js — minimal supabase integration helper (no keys here)
// In production: replace createClient(...) with your Supabase URL & KEY from env/server
export function initSupabase() {
  // placeholder: real init must run on server or with env vars
  window._cloudora_supabase = null;
  console.log("Supabase init placeholder. Replace with createClient() in production.");
}

// createLead: send lead object to your server or supabase edge function
export async function createLead(leadPayload) {
  // For now we store locally and return success (mock)
  // In production, call your supabase endpoint, e.g.:
  // const { data, error } = await supabase.from('lead').insert(leadPayload).select();
  // if(error) throw error; return data;
  console.info("createLead (mock) payload:", leadPayload);
  // also store to localStorage as a simple persistence for dev/demo
  try {
    const stored = JSON.parse(localStorage.getItem("cloudora_local_leads") || "[]");
    stored.push(Object.assign({ id: Date.now() }, leadPayload));
    localStorage.setItem("cloudora_local_leads", JSON.stringify(stored));
  } catch (e) {
    console.warn("local lead store failed", e);
  }
  // simulate network delay
  await new Promise(r => setTimeout(r, 350));
  return { ok: true, id: Date.now() };
}
