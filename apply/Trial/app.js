// main.js
// Single JS file with Supabase integration for the Cloudora form

// ---------- Supabase config ----------
const SUPABASE_URL = "https://rfilnqigcadeawytwqmz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaWxucWlnY2FkZWF3eXR3cW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzE2NTIsImV4cCI6MjA3OTcwNzY1Mn0.1wtcjczrzhv2YsE7hGQL11imPxmFVS4sjxlJGvIZ26o";
const UPLOAD_BUCKET = "applicant-uploads";

// ---------- Load Supabase client ----------
(async () => {
  if (!window.supabase) {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.min.js";
    document.head.appendChild(s);
    await new Promise(res => (s.onload = res));
  }
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  initForm();
})();

// ---------- Utilities ----------
const $ = (id) => document.getElementById(id);
const show = (el) => el && el.classList.remove("hidden");
const hide = (el) => el && el.classList.add("hidden");
const showErr = (id, cond) => {
  const el = $(id);
  if (!el) return;
  el.classList[cond ? "add" : "remove"]("show");
};

// ---------- Validation ----------
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const isIntlPhone = (v) => /^\+?\d{6,15}$/.test((v || "").trim());
const isPincode = (v) => /^\d{6}$/.test((v || "").trim());
const maxSize = 5 * 1024 * 1024;
const validImageTypes = ["image/jpeg", "image/png"];
const validDocTypes = ["image/jpeg", "image/png", "application/pdf"];
const isValidFile = (file, types) => file && types.includes(file.type) && file.size <= maxSize;

// ---------- USA Slots builder ----------
function buildUsaSlots() {
  const wrap = $("usaSlots");
  if (!wrap) return;
  wrap.innerHTML = "";
  const slots = [
    "07:00–08:00","08:00–09:00","09:00–10:00",
    "10:00–11:00","11:00–12:00","12:00–13:00",
    "13:00–14:00","14:00–15:00","15:00–16:00"
  ];
  const container = document.createElement("div");
  container.className = "flex";
  slots.forEach(s => {
    const label = document.createElement("label");
    label.className = "tag";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = s;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + s));
    container.appendChild(label);
  });
  wrap.appendChild(container);
}

// ---------- Role mapping ----------
const ROLE_MAP = {
  tele_lead_domestic: ["Tele Lead - Domestic"],
  tele_lead_international: ["Tele Lead - International"],
  tele_sales_domestic: ["Sales - Domestic"],
  tele_sales_international: ["Sales - International"],
  chat_support: ["Chat Support"],
  tele_support_domestic: ["Tele Support - Domestic"],
  tele_support_international: ["Tele Support - International"],
  developer: ["Frontend Developer", "Backend Developer", "Full-stack Developer"],
  content_creatives: ["Content Creator", "Video Editor", "Graphic Designer"],
  marketing_outreach: ["Marketing Executive", "SEO Specialist"]
};

// ---------- Populate roles based on departments ----------
function populateRoles() {
  const depSel = $("departments");
  const roleSel = $("roles");
  if (!depSel || !roleSel) return;
  const selectedDeps = Array.from(depSel.selectedOptions).map(o => o.value);
  roleSel.innerHTML = "";
  const roles = new Set();
  selectedDeps.forEach(d => {
    (ROLE_MAP[d] || []).forEach(r => roles.add(r));
  });
  Array.from(roles).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    roleSel.appendChild(opt);
  });
}

// ---------- Toggle other fields ----------
function attachToggles() {
  const addrProofType = $("addrProofType");
  if (addrProofType) {
    addrProofType.addEventListener("change", (e) => {
      if (e.target.value === "Other") show($("addrProofOtherWrap")); else hide($("addrProofOtherWrap"));
    });
  }
  const hearAbout = $("hearAbout");
  if (hearAbout) {
    hearAbout.addEventListener("change", (e) => {
      if (e.target.value === "Other") show($("hearOtherWrap")); else hide($("hearOtherWrap"));
    });
  }
  const langOtherChk = $("langOtherChk");
  if (langOtherChk) {
    langOtherChk.addEventListener("change", (e) => {
      if (e.target.checked) show($("langOtherWrap")); else hide($("langOtherWrap"));
    });
  }
}

// ---------- Employment & USA slot logic ----------
function toggleUsaSlots() {
  const emp = $("employmentType")?.value;
  const pref = $("prefCountry")?.value;
  const wrap = $("usaSlots");
  if (!wrap) return;
  if (emp === "part" && pref === "United States") {
    show(wrap);
    buildUsaSlots();
  } else {
    hide(wrap);
    wrap.innerHTML = "";
  }
}

// ---------- Collect form data ----------
function collectData(includeFiles = true) {
  const departments = Array.from($("departments")?.selectedOptions || []).map(o => o.value);
  const roles = Array.from($("roles")?.selectedOptions || []).map(o => o.value);
  const languages = Array.from(document.querySelectorAll('input[name="lang"]:checked')).map(i => i.value);
  const usaSlots = Array.from($("usaSlots")?.querySelectorAll('input[type="checkbox"]:checked') || []).map(cb => cb.value);

  return {
    fullName: $("fullName")?.value?.trim(),
    email: $("email")?.value?.trim(),
    mobileNumber: $("mobileNumber")?.value?.trim(),
    altMobile: $("altMobile")?.value?.trim(),
    addrStreet: $("addrStreet")?.value?.trim(),
    addrCity: $("addrCity")?.value?.trim(),
    addrPincode: $("addrPincode")?.value?.trim(),
    addrState: $("addrState")?.value?.trim(),
    addrCountry: $("addrCountry")?.value,
    addrProofType: $("addrProofType")?.value,
    addrProofOther: $("addrProofOther")?.value?.trim(),
    employmentType: $("employmentType")?.value,
    prefCountry: $("prefCountry")?.value,
    departments,
    roles,
    usaSlots,
    languages,
    langOther: $("langOther")?.value?.trim(),
    understandCloudora: $("understandCloudora")?.value?.trim(),
    hearAbout: $("hearAbout")?.value,
    hearOther: $("hearOther")?.value?.trim(),
    agree: !!$("agree")?.checked,
    files: includeFiles ? {
      photoUpload: $("photoUpload")?.files[0] || null,
      docFront: $("docFront")?.files[0] || null,
      docBack: $("docBack")?.files[0] || null
    } : undefined
  };
}

// ---------- Upload file to Supabase ----------
async function uploadFileToSupabase(file, pathInBucket) {
  if (!file) return null;
  try {
    const { data, error } = await window.supabaseClient.storage.from(UPLOAD_BUCKET).upload(pathInBucket, file, { cacheControl: "3600", upsert: true });
    if (error) throw error;
    const { data: urlData } = window.supabaseClient.storage.from(UPLOAD_BUCKET).getPublicUrl(pathInBucket);
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error("uploadFileToSupabase failed:", err);
    return null;
  }
}

// ---------- Submit to Supabase ----------
async function submitToSupabase(payload, statusElId = "formStatus") {
  const statusEl = $(statusElId);
  if (statusEl) {
    statusEl.style.display = "inline-block";
    statusEl.textContent = "Saving...";
    statusEl.style.backgroundColor = "";
  }
  try {
    const addressCombined = [payload.addrStreet, payload.addrCity, payload.addrState, payload.addrPincode].filter(Boolean).join(", ");
    const leadRow = {
      full_name: payload.fullName || null,
      email: payload.email || null,
      phone: payload.mobileNumber || null,
      country: payload.addrCountry || null,
      city: payload.addrCity || null,
      address: addressCombined || null,
      source: payload.hearAbout || null,
      status: "new"
    };

    const { data: leadData, error: leadError } = await window.supabaseClient.from("lead").insert([leadRow]).select();
    if (leadError) throw new Error("Lead insert failed: " + leadError.message);
    const leadId = leadData?.[0]?.id;
    if (!leadId) throw new Error("No lead ID returned.");

    // --- upload files
    const uploads = {};
    const ts = Date.now();
    if (payload.files?.photoUpload) uploads.photo_url = await uploadFileToSupabase(payload.files.photoUpload, `leads/${leadId}/photo_${ts}.${payload.files.photoUpload.name.split(".").pop()}`);
    if (payload.files?.docFront) uploads.doc_front_url = await uploadFileToSupabase(payload.files.docFront, `leads/${leadId}/doc_front_${ts}.${payload.files.docFront.name.split(".").pop()}`);
    if (payload.files?.docBack) uploads.doc_back_url = await uploadFileToSupabase(payload.files.docBack, `leads/${leadId}/doc_back_${ts}.${payload.files.docBack.name.split(".").pop()}`);

    // --- application insert
    const applicationRow = {
      lead_id: leadId,
      form_type: "final",
      role_category: (payload.departments || []).join(", "),
      preferred_language: (payload.languages || []).join(", "),
      work_mode: payload.employmentType || null,
      engagement_type: payload.employmentType || null,
      country: payload.addrCountry || null,
      work_country: payload.prefCountry || null,
      timezone: null,
      preferred_schedule: (payload.usaSlots || []).join(", "),
      skills: null,
      experience: null,
      resume_url: uploads.doc_front_url || null,
      portfolio_url: null,
      notes: payload.understandCloudora || payload.hearOther || null,
      status: "submitted"
    };
    const { error: appError } = await window.supabaseClient.from("application").insert([applicationRow]);
    if (appError) throw new Error("Application insert failed: " + appError.message);

    // --- agreement
    if (payload.agree) {
      const agreementRow = {
        lead_id: leadId,
        agreed: true,
        agreed_at: new Date().toISOString(),
        terms_version: null
      };
      const { error: agrErr } = await window.supabaseClient.from("agreement").insert([agreementRow]);
      if (agrErr) console.warn("Agreement insert warning:", agrErr.message);
    }

    if (statusEl) {
      statusEl.textContent = "✅ Submitted successfully";
      statusEl.style.backgroundColor = "#16a34a";
    }
    return { success: true, leadId, uploads };
  } catch (err) {
    console.error(err);
    if (statusEl) {
      statusEl.textContent = "❌ " + (err.message || "Submission failed");
      statusEl.style.backgroundColor = "#dc2626";
    }
    return { success: false, error: err };
  }
}

// ---------- Validation & front-end submit ----------
function validateAndCollect() {
  document.querySelectorAll(".error").forEach(el => el.classList.remove("show"));
  $("successMsg").style.display = "none";
  $("formStatus").style.display = "none";
  let ok = true;

  if (!($("fullName")?.value || "").trim()) { showErr("errFullName", true); ok = false; }
  if (!isEmail($("email")?.value || "")) { showErr("errEmail", true); ok = false; }
  const mobile = ($("mobileNumber")?.value || "").trim();
  if (!isIntlPhone(mobile)) { showErr("errMobileNumber", true); ok = false; }
  const alt = ($("altMobile")?.value || "").trim();
  if (alt && !isIntlPhone(alt)) { showErr("errAltMobile", true); ok = false; }
  if (!($("addrStreet")?.value || "").trim()) { showErr("errAddrStreet", true); ok = false; }
  if (!($("addrCity")?.value || "").trim()) { showErr("errAddrCity", true); ok = false; }
  if (!isPincode($("addrPincode")?.value || "")) { showErr("errAddrPincode", true); ok = false; }
  if (!($("addrState")?.value || "").trim()) { showErr("errAddrState", true); ok = false; }
  if (!($("addrCountry")?.value || "")) { showErr("errAddrCountry", true); ok = false; }
  if (!($("addrProofType")?.value || "")) { showErr("errAddrProofType", true); ok = false; }
  if (($("addrProofType")?.value || "") === "Other" && !($("addrProofOther")?.value || "").trim()) { showErr("errAddrProofType", true); ok = false; }

  const photo = $("photoUpload")?.files[0];
  const front = $("docFront")?.files[0];
  const back = $("docBack")?.files[0];
  if (!isValidFile(photo, validImageTypes)) { showErr("errPhotoUpload", true); ok = false; }
  if (!isValidFile(front, validDocTypes)) { showErr("errDocFront", true); ok = false; }
  if (!isValidFile(back, validDocTypes)) { showErr("errDocBack", true); ok = false; }

  const emp = $("employmentType")?.value;
  if (!emp) { showErr("errEmploymentType", true); ok = false; }

  const deps = Array.from($("departments")?.selectedOptions || []).map(o => o.value);
  if (deps.length === 0) { showErr("errDepartments", true); ok = false; }
  if (emp === "full" && deps.length !== 1) { showErr("errDepartments", true); ok = false; }
  if (emp === "part" && deps.length > 3) { showErr("errDepartments", true); ok = false; }

  const roles = Array.from($("roles")?.selectedOptions || []).map(o => o.value);
  if (roles.length === 0) { showErr("errRoles", true); ok = false; }

  const usaVisible = !$("usaSlots")?.classList.contains("hidden");
  const usaSelectedSlots = Array.from($("usaSlots")?.querySelectorAll('input[type="checkbox"]:checked') || []).length;
  if (usaVisible && emp === "part" && usaSelectedSlots === 0) { alert("Select at least one USA slot for part-time USA preference."); ok = false; }

  const langChecked = document.querySelectorAll('input[name="lang"]:checked').length;
  if (langChecked === 0) { showErr("errLang", true); ok = false; }
  if ($("langOtherChk")?.checked && !($("langOther")?.value || "").trim()) { showErr("errLang", true); ok = false; }

  if ((($("understandCloudora")?.value || "").trim().length) < 20) { showErr("errUnderstand", true); ok = false; }
  if (!($("agree")?.checked)) { showErr("errAgree", true); ok = false; }

  if (!ok) return null;
  return collectData(true);
}

// ---------- Save / Load draft ----------
function saveDraftToLocal() {
  const data = collectData(false);
  localStorage.setItem("cloudoraDraft", JSON.stringify(data));
  alert("Draft saved locally on this device.");
}

function loadDraftFromLocal() {
  const raw = localStorage.getItem("cloudoraDraft");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.fullName) $("fullName").value = data.fullName;
    if (data.email) $("email").value = data.email;
    if (data.mobileNumber) $("mobileNumber").value = data.mobileNumber;
    if (data.altMobile) $("altMobile").value = data.altMobile;
    if (data.addrStreet) $("addrStreet").value = data.addrStreet;
    if (data.addrCity) $("addrCity").value = data.addrCity;
    if (data.addrPincode) $("addrPincode").value = data.addrPincode;
    if (data.addrState) $("addrState").value = data.addrState;
    if (data.addrCountry) $("addrCountry").value = data.addrCountry;
    if (data.prefCountry) $("prefCountry").value = data.prefCountry;
    if (data.addrProofType) $("addrProofType").value = data.addrProofType;
    if (data.addrProofOther) $("addrProofOther").value = data.addrProofOther;
    if (data.employmentType) $("employmentType").value = data.employmentType;
    if (Array.isArray(data.departments)) {
      const depSel = $("depart
