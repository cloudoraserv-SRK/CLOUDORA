// Initialize Supabase client
const supabaseUrl = "https://YOUR_PROJECT.supabase.co";
const supabaseKey = "YOUR_ANON_KEY";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const form = document.getElementById("applicationForm");
const statusEl = document.getElementById("formStatus");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.style.display = "inline-block";
  statusEl.textContent = "⏳ Submitting...";
  statusEl.style.backgroundColor = "#fbbf24";

  const formData = new FormData(form);

  // Insert into lead
  const { data: leadData, error: leadError } = await supabase
    .from("lead")
    .insert([{
      full_name: formData.get("firstName") + " " + formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("mobile"),
      country: formData.get("country"),
      city: formData.get("address"),
    }])
    .select();

  if (leadError) {
    statusEl.textContent = "❌ Lead insert failed: " + leadError.message;
    statusEl.style.backgroundColor = "#dc2626";
    return;
  }

  const leadId = leadData?.[0]?.id;

  // Insert into application
  const { error: appError } = await supabase
    .from("application")
    .insert([{
      lead_id: leadId,
      role_category: formData.get("jobRole"),
      preferred_language: formData.get("language"),
      work_mode: formData.get("workType"),
      engagement_type: formData.get("workType"),
      country: formData.get("country"),
      timezone: formData.get("workSlot"),
      experience: formData.get("experience"),
      notes: "Expected Salary: " + formData.get("expectedSalary") +
             ", Last Salary: " + formData.get("lastSalary")
      
