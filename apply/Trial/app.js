// app.js
import { supabase, uuidv4, uploadFile, insertLead, insertApplication, insertAgreement } from "/supabase/supabase.js";

const UPLOAD_BUCKET = "applicant-uploads";

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
  const slots = ["07:00–08:00","08:00–09:00","09:00–10:00","10:00–11:00","11:00–12:00","12:00–13:00","13:00–14:00","14:00–15:00","15:00–16:00"];
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
  developer: ["Frontend Developer","Backend Developer","Full-stack Developer"],
  content_creatives: ["Content Creator","Video Editor","Graphic Designer"],
  marketing_outreach: ["Marketing Executive","SEO Specialist"]
};

// ---------- Populate roles ----------
function populateRoles() {
  const depSel = $("departments");
  const roleSel = $("roles");
  if (!depSel || !roleSel) return;
  const selectedDeps = Array.from(depSel.selectedOptions).map(o => o.value);
  roleSel.innerHTML = "";
  const roles = new Set();
  selectedDeps.forEach(d => (ROLE_MAP[d] || []).forEach(r => roles.add(r)));
  Array.from(roles).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    roleSel.appendChild(opt);
  });
}

// ---------- Toggle "Other" fields ----------
function attachToggles() {
  $("addrProofType")?.addEventListener("change", e => e.target.value === "Other" ? show($("addrProofOtherWrap")) : hide($("addrProofOtherWrap")));
  $("hearAbout")?.addEventListener("change", e => e.target.value === "Other" ? show($("hearOtherWrap")) : hide($("hearOtherWrap")));
  $("langOtherChk")?.addEventListener("change", e => e.target.checked ? show($("langOtherWrap")) : hide($("langOtherWrap")));
}

// ---------- Employment & USA slots ----------
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

// ---------- Submit to Supabase ----------
async function submitToSupabase(payload, statusElId = "formStatus") {
  const statusEl = $(statusElId);
  if (statusEl) { statusEl.style.display = "inline-block"; statusEl.textContent = "Saving..."; statusEl.style.backgroundColor = ""; }

  try {
    const leadId = uuidv4();
    const addressCombined = [payload.addrStreet, payload.addrCity, payload.addrState, payload.addrPincode].filter(Boolean).join(", ");

    await insertLead({
      id: leadId,
      full_name: payload.fullName || null,
      email: payload.email || null,
      phone: payload.mobileNumber || null,
      country: payload.addrCountry || null,
      city: payload.addrCity || null,
      address: addressCombined || null,
      source: payload.hearAbout || null,
      status: "new"
    });

    // --- Upload files ---
    const uploads = {};
    const ts = Date.now();
    if (payload.files?.photoUpload) uploads.photo_url = await uploadFile(payload.files.photoUpload, `leads/${leadId}/photo_${ts}.${payload.files.photoUpload.name.split(".").pop()}`);
    if (payload.files?.docFront) uploads.doc_front_url = await uploadFile(payload.files.docFront, `leads/${leadId}/doc_front_${ts}.${payload.files.docFront.name.split(".").pop()}`);
    if (payload.files?.docBack) uploads.doc_back_url = await uploadFile(payload.files.docBack, `leads/${leadId}/doc_back_${ts}.${payload.files.docBack.name.split(".").pop()}`);

    // --- Application insert ---
    await insertApplication({
      lead_id: leadId,
      form_type: "final",
      role_category: (payload.departments || []).join(", "),
      preferred_language: (payload.languages || []).join(", "),
      work_mode: payload.employmentType || null,
      engagement_type: payload.employmentType || null,
      country: payload.addrCountry || null,
      work_country: payload.prefCountry || null,
      preferred_schedule: (payload.usaSlots || []).join(", "),
      resume_url: uploads.doc_front_url || null,
      notes: payload.understandCloudora || payload.hearOther || null,
      status: "submitted"
    });

    // --- Agreement insert ---
    if (payload.agree) await insertAgreement({ lead_id: leadId, agreed: true, agreed_at: new Date().toISOString(), terms_version: null });

    if (statusEl) { statusEl.textContent = "✅ Submitted successfully"; statusEl.style.backgroundColor = "#16a34a"; }
    return { success: true, leadId, uploads };
  } catch (err) {
    console.error(err);
    if (statusEl) { statusEl.textContent = "❌ " + (err.message || "Submission failed"); statusEl.style.backgroundColor = "#dc2626"; }
    return { success: false, error: err };
  }
}

// ---------- Validate & collect ----------
function validateAndCollect() {
  document.querySelectorAll(".error").forEach(el => el.classList.remove("show"));
  $("successMsg").style.display = "none";
  $("formStatus").style.display = "none";
  let ok = true;

  if (!($("fullName")?.value || "").trim()) { showErr("errFullName", true); ok = false; }
  if (!isEmail($("email")?.value || "")) { showErr("errEmail", true); ok = false; }
  if (!isIntlPhone(($("mobileNumber")?.value || "").trim())) { showErr("errMobileNumber", true); ok = false; }
  if (($("altMobile")?.value || "").trim() && !isIntlPhone(($("altMobile")?.value || "").trim())) { showErr("errAltMobile", true); ok = false; }
  if (!($("addrStreet")?.value || "").trim()) { showErr("errAddrStreet", true); ok = false; }
  if (!($("addrCity")?.value || "").trim()) { showErr("errAddrCity", true); ok = false; }
  if (!isPincode($("addrPincode")?.value || "")) { showErr("errAddrPincode", true); ok = false; }
  if (!($("addrState")?.value || "").trim()) { showErr("errAddrState", true); ok = false; }
  if (!($("addrCountry")?.value || "")) { showErr("errAddrCountry", true); ok = false; }
  if (!($("addrProofType")?.value || "")) { showErr("errAddrProofType", true); ok = false; }
  if (($("addrProofType")?.value || "") === "Other" && !($("addrProofOther")?.value || "").trim()) { showErr("errAddrProofType", true); ok = false; }

  const photo = $("photoUpload")?.files[0], front = $("docFront")?.files[0], back = $("docBack")?.files[0];
  if (!isValidFile(photo, validImageTypes)) { showErr("errPhotoUpload", true); ok = false; }
  if (!isValidFile(front, validDocTypes)) { showErr("errDocFront", true); ok = false; }
  if (!isValidFile(back, validDocTypes)) { showErr("errDocBack", true); ok = false; }

  const emp = $("employmentType")?.value;
  if (!emp) { showErr("errEmploymentType", true); ok = false; }

  const deps = Array.from($("departments")?.selectedOptions || []).map(o => o.value);
  if (deps.length === 0 || (emp === "full" && deps.length !== 1) || (emp === "part" && deps.length > 3)) { showErr("errDepartments", true); ok = false; }

  const roles = Array.from($("roles")?.selectedOptions || []).map(o => o.value);
  if (roles.length === 0) { showErr("errRoles", true); ok = false; }

  const usaVisible = !$("usaSlots")?.classList.contains("hidden");
  const usaSelectedSlots = Array.from($("usaSlots")?.querySelectorAll('input[type="checkbox"]:checked') || []).length;
  if (usaVisible && emp === "part" && usaSelectedSlots === 0) { alert("Select at least one USA slot for part-time USA preference."); ok = false; }

  const langChecked = document.querySelectorAll('input[name="lang"]:checked').length;
  if (langChecked === 0 || ($("langOtherChk")?.checked && !($("langOther")?.value || "").trim())) { showErr("errLang", true); ok = false; }

  if ((($("understandCloudora")?.value || "").trim().length) < 20) { showErr("errUnderstand", true); ok = false; }
  if (!($("agree")?.checked)) { showErr("errAgree", true); ok = false; }

  if (!ok) return null;
  return collectData(true);
}

// ---------- Draft save/load ----------
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
    Object.keys(data).forEach(k => { if ($(k)) $(k).value = data[k]; });
    if (data.departments) { Array.from($("departments").options).forEach(o => o.selected = data.departments.includes(o.value)); populateRoles(); }
    if (data.roles) { Array.from($("roles").options).forEach(o => o.selected = data.roles.includes(o.value)); }
    if (data.languages && Array.isArray(data.languages)) { document.querySelectorAll('input[name="lang"]').forEach(i => i.checked = data.languages.includes(i.value)); }
    toggleUsaSlots();
  } catch (err) { console.warn("Failed to load draft:", err); }
}

// ---------- Initialize listeners ----------
function initForm() {
  attachToggles();
  $("departments")?.addEventListener("change", populateRoles);
  $("employmentType")?.addEventListener("change", function() { 
    Array.from($("departments").options).forEach(o => o.selected = false); 
    $("departments").multiple = this.value !== "full"; 
    populateRoles(); 
    toggleUsaSlots(); 
  });
  $("prefCountry")?.addEventListener("change", toggleUsaSlots);
  $("saveDraft")?.addEventListener("click", saveDraftToLocal);
  loadDraftFromLocal();

  const form = $("cloudoraForm");
  if (form) form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = validateAndCollect();
    if (!payload) return;
    $("formStatus").style.display = "inline-block"; $("formStatus").textContent = "Submitting...";
    const res = await submitToSupabase(payload, "formStatus");
    if (res.success) {
      $("successMsg").style.display = "block";
      form.reset();
      hide($("addrProofOtherWrap")); hide($("langOtherWrap")); hide($("hearOtherWrap"));
      localStorage.removeItem("cloudoraDraft");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } else { alert("Submission failed. See console for details."); }
  });

  populateRoles();
  toggleUsaSlots();
}

// Initialize form on page load
window.addEventListener("DOMContentLoaded", initForm);
