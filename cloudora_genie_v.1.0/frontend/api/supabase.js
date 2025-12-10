// api/supabase.js - minimal wrapper
// requires global.js supabase to be set
async function createLead(lead){ return supabase.from('leads').insert([lead]).select().single(); }
async function fetchAssignedLeads(userId){ return supabase.from('lead_assignments').select('*,leads(*)').eq('assigned_to', userId).order('created_at', {ascending:true}); }
window.api = { createLead, fetchAssignedLeads };