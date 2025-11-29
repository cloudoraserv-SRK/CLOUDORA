// routefolder/supabase/supabase.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ✅ Supabase project credentials
const supabaseUrl = "https://rfilnqigcadeawytwqmz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaWxucWlnY2FkZWF3eXR3cW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzE2NTIsImV4cCI6MjA3OTcwNzY1Mn0.1wtcjczrzhv2YsE7hGQL11imPxmFVS4sjxlJGvIZ26o"
                         
// ✅ Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ✅ Storage bucket name
export const UPLOAD_BUCKET = "uploads";

// ---------- UUID Generator ----------
export function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// ---------- File Upload Helper ----------
export async function uploadFile(file, folder) {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const path = `${folder}/${file.name.replace(/\s/g, "_")}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(path, file, { upsert: true });
  if (error) throw new Error("File upload failed: " + error.message);
  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Lead + Trial Helpers ----------
// Lead helpers
export async function insertLead(leadData) {
  return await supabase.from("lead").insert([leadData]).select();
}

export async function insertTrial(trialData) {
  return await supabase.from("trial").insert([trialData]);
}

// 🔑 AUTH HELPERS
export async function signUp(email, password, metadata = {}) {
  return await supabase.auth.signUp({ email, password, options: { data: metadata } })
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getSession() {
  return await supabase.auth.getSession()
}

// 📊 LEAD + ENQUIRY HELPERS
export async function getLeads() {
  return await supabase.from('lead').select('*').order('created_at', { ascending: false })
}

export async function getEnquiries() {
  return await supabase.from('view_enquiry_full').select('*')
}

export async function insertEnquiry(enquiryData) {
  return await supabase.from('enquiry').insert([enquiryData])
}

// 📝 APPLICATION HELPERS
// 📝 APPLICATION HELPERS
export async function getApplications() {
  return await supabase.from("view_application_full").select("*");
}

export async function insertApplication(appData) {
  return await supabase.from("application").insert([appData]);
}


// 📄 AGREEMENT HELPERS
export async function insertAgreement(agreementData) {
  return await supabase.from('agreement').insert([agreementData])
}

export async function getAgreements() {
  return await supabase.from('agreement').select('*')
}

// 💼 SALES HELPERS
export async function getSalesPipeline() {
  return await supabase.from('view_sales_pipeline').select('*')
}

export async function insertSale(saleData) {
  return await supabase.from('sales').insert([saleData])
}

// 🛠 TECHNICAL HELPERS
export async function getTechnicalTasks() {
  return await supabase.from('technical').select('*')
}

export async function insertTechnicalTask(taskData) {
  return await supabase.from('technical').insert([taskData])
}

export async function insertDeliverable(deliverableData) {
  return await supabase.from('deliverables').insert([deliverableData])
}

// 🎧 SUPPORT HELPERS
export async function getSupportTickets() {
  return await supabase.from('view_support_full').select('*')
}

export async function insertSupportTicket(ticketData) {
  return await supabase.from('support').insert([ticketData])
}

// 👥 ASSIGNMENT HELPERS
export async function assignLead(assignData) {
  return await supabase.from('assignment').insert([assignData])
}

export async function getAssignments() {
  return await supabase.from('assignment').select('*')
}

// 📜 ACTIVITY LOGS
export async function logActivity(logData) {
  return await supabase.from('activity_logs').insert([logData])
}

export async function getActivityLogs(entityType, entityId) {
  return await supabase
    .from('activity_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
}

// ⚙️ ROUTING RULES
export async function getRoutingRules() {
  return await supabase.from('routing_rules').select('*')
}

export async function insertRoutingRule(ruleData) {
  return await supabase.from('routing_rules').insert([ruleData])
}
