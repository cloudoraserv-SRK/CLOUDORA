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

  // Step 1: Insert into lead table
  const { data: leadData, error: leadError } = await supabase
    .from("lead")
    .insert([{
      full_name: formData.get("firstName") + " " + formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("mobile"),
      country: formData.get("country"),
      city: formData.get("address"),
      // optional fields
      alt_phone: formData.get("altMobile"),
      sex: formData.get("sex")
    }])
    .select();

  if (leadError) {
    statusEl.textContent = "❌ Lead insert failed: " + leadError.message;
    statusEl.style.backgroundColor = "#dc2626";
    return;
  }

  const leadId = leadData?.[0]?.id;

  // Step 2: Insert into application table
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
      preferred_schedule: formData.get("workSlot"),
      skills: formData.get("workLinks"),
      experience: formData.get("experience"),
      notes: "Expected Salary: " + formData.get("expectedSalary") +
             ", Last Salary: " + formData.get("lastSalary") +
             ", Last Company: " + formData.get("lastCompany"),
      status: "submitted"
    }]);

  if (appError) {
    statusEl.textContent = "❌ Application insert failed: " + appError.message;
    statusEl.style.backgroundColor = "#dc2626";
    return;
  }

  // Step 3: Handle document proof + photo upload (optional)
  // Example: upload photo to Supabase storage
  const photoFile = formData.get("photo");
  if (photoFile && photoFile.size > 0) {
    const { data: photoData, error: photoError } = await supabase.storage
      .from("photos")
      .upload(`employee-${leadId}/${photoFile.name}`, photoFile);

    if (!photoError) {
      await supabase.from("application").update({
        portfolio_url: photoData.path
      }).eq("lead_id", leadId);
    }
  }

  statusEl.textContent = "✅ Application submitted successfully!";
  statusEl.style.backgroundColor = "#10b981";
});
