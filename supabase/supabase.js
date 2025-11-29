// supabase.js
// Unified Supabase handler for all forms (Customer, Applicant, Employee)

// ---------- Supabase Config ----------
const SUPABASE_URL = "https://rfilnqigcadeawytwqmz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaWxucWlnY2FkZWF3eXR3cW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzE2NTIsImV4cCI6MjA3OTcwNzY1Mn0.1wtcjczrzhv2YsE7hGQL11imPxmFVS4sjxlJGvIZ26o";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Utilities ----------
const generateUUID = () => {
  // Polyfill for crypto.randomUUID
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const showStatus = (elId, message, color) => {
  const el = document.getElementById(elId);
  if (!el) return;
  el.style.display = "inline-block";
  el.textContent = message;
  if (color) el.style.backgroundColor = color;
};

// ---------- File Upload ----------
async function uploadFile(file, folder = "uploads", uuid = null) {
  if (!file) return null;
  const fileId = uuid || generateUUID();
  const ext = file.name.split('.').pop();
  const filePath = `${folder}/${fileId}/${file.name.replace(/\s/g,'_')}_${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('applicant-uploads').upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { publicUrl } = supabase.storage.from('applicant-uploads').getPublicUrl(filePath);
  return publicUrl;
}

// ---------- Customer Enquiry Form ----------
async function submitCustomerEnquiry(payload) {
  try {
    const { error } = await supabase.from("lead").insert([{
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      sourceref: payload.company || null,
      country: payload.country || null,
      productinterest: payload.service || null,
      status: "new",
      source: "website"
    }]);
    if (error) throw error;
    return { success: true };
  } catch(err) {
    console.error(err);
    return { success: false, error: err };
  }
}

// ---------- Applicant / Employee Application Form ----------
async function submitApplicationForm(payload) {
  try {
    // Insert Lead
    const { data: leadData, error: leadError } = await supabase.from("lead").insert([{
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.mobileNumber,
      country: payload.addrCountry || null,
      city: payload.addrCity || null,
      address: [payload.addrStreet, payload.addrCity, payload.addrState, payload.addrPincode].filter(Boolean).join(", "),
      source: payload.hearAbout || "website",
      status: "new"
    }]).select();
    if (leadError) throw leadError;
    const leadId = leadData?.[0]?.id;
    if (!leadId) throw new Error("Lead ID not returned");

    // Upload files
    const uploads = {};
    if (payload.files?.photo) uploads.photo_url = await uploadFile(payload.files.photo, `leads/${leadId}`);
    if (payload.files?.docFront) uploads.doc_front_url = await uploadFile(payload.files.docFront, `leads/${leadId}`);
    if (payload.files?.docBack) uploads.doc_back_url = await uploadFile(payload.files.docBack, `leads/${leadId}`);

    // Insert Application
    const { error: appError } = await supabase.from("application").insert([{
      lead_id: leadId,
      form_type: "final",
      role_category: (payload.departments || []).join(", "),
      preferred_language: (payload.languages || []).join(", "),
      work_mode: payload.employmentType,
      engagement_type: payload.employmentType,
      country: payload.addrCountry,
      work_country: payload.prefCountry,
      preferred_schedule: (payload.usaSlots || []).join(", "),
      skills: payload.skills || null,
      experience: payload.experience || null,
      resume_url: uploads.doc_front_url || null,
      portfolio_url: null,
      notes: payload.understandCloudora || payload.hearOther || null,
      status: "submitted"
    }]);
    if (appError) throw appError;

    // Agreement insert
    if (payload.agree) {
      const { error: agrErr } = await supabase.from("agreement").insert([{
        lead_id: leadId,
        agreed: true,
        agreed_at: new Date().toISOString(),
        terms_version: null
      }]);
      if (agrErr) console.warn("Agreement insert warning:", agrErr.message);
    }

    return { success: true, leadId, uploads };
  } catch(err) {
    console.error(err);
    return { success: false, error: err };
  }
}

// ---------- Final Employee Registration ----------
async function submitEmployeeRegistration(payload) {
  try {
    const employeeId = payload.employeeId || generateUUID();
    const password = payload.password || Math.random().toString(36).slice(-8); // simple temporary password
    const { error } = await supabase.from("employee").insert([{
      employee_id: employeeId,
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.mobileNumber,
      department: payload.department,
      role: payload.role,
      username: payload.email,
      password: password,  // store securely in real system
      status: "active"
    }]);
    if (error) throw error;
    return { success: true, employeeId, password };
  } catch(err) {
    console.error(err);
    return { success: false, error: err };
  }
}

// ---------- Expose globally ----------
window.CRM = {
  submitCustomerEnquiry,
  submitApplicationForm,
  submitEmployeeRegistration,
  uploadFile,
  generateUUID,
  showStatus
};
