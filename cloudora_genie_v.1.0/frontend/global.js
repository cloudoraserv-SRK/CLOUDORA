// -----------------------------------------
// Cloudora Genie — Global Engine (FINAL FIXED)
// -----------------------------------------

const CONFIG = {
  SUPA_URL: "https://gnihhujwqxkigwwnksgw.supabase.co",
  SUPA_ANON: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaWhodWp3cXhraWd3d25rc2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4OTc2MjcsImV4cCI6MjA4MDQ3MzYyN30.tOYXHySzEQ2py-NUNBmlpp7QWciaGSSD_NeWpLbeRaw",
  BACKEND: "cloudora.railway.internal",

  LANG: localStorage.getItem("lang") || "en",
  CURRENCY: localStorage.getItem("currency") || "INR",

  supported_languages: ["en", "hi", "es"],
  currency_supported: ["INR", "USD"]
};

// -----------------------------------------
// FIXED I18N (NO COMMA ERRORS)
// -----------------------------------------
const I18N = {
  en: {
    welcome: "Welcome to Cloudora Genie",
    subtitle: "Your multilingual AI assistant for job, business & automation.",
    apply_job: "Apply for Job / Lead",
    emp_login: "Employee Login",
    client_login: "Customer Login",
    partner_login: "Partner Login",
    admin_panel: "Admin Panel",

    job_apply_title: "Job Application Form",
    job_apply_sub: "Fill details to apply for Cloudora workforce",
    full_name: "Full Name",
    phone: "Phone Number",
    email: "Email",
    dept: "Select Department",
    job_type: "Job Type",
    shift: "Preferred Shift",
    experience: "Experience (months)",
    city: "Current City",
    apply_trial: "Apply for 7-day trial (employee)",
    apply_now: "Submit Application"
  },

  hi: {
    welcome: "क्लाउडोरा जीनि में आपका स्वागत है",
    subtitle: "आपका मल्टीलिंगुअल एआई असिस्टेंट – नौकरी, बिज़नेस और ऑटोमेशन के लिए।",
    apply_job: "जॉब / लीड के लिए आवेदन करें",
    emp_login: "कर्मचारी लॉगिन",
    client_login: "ग्राहक लॉगिन",
    partner_login: "पार्टनर लॉगिन",
    admin_panel: "एडमिन पैनल",

    job_apply_title: "जॉब आवेदन फ़ॉर्म",
    job_apply_sub: "क्लाउडोरा टीम के लिए आवेदन करें",
    full_name: "पूरा नाम",
    phone: "फोन नंबर",
    email: "ईमेल",
    dept: "विभाग चुनें",
    job_type: "नौकरी प्रकार",
    shift: "पसंदीदा शिफ्ट",
    experience: "अनुभव (महीने)",
    city: "शहर",
    apply_trial: "7-दिन ट्रायल (कर्मचारी) के लिए आवेदन करें",
    apply_now: "आवेदन जमा करें"
  }
};

// -----------------------------------------
// SUPABASE CLIENT FIX (FINAL WORKING)
// -----------------------------------------
if (!window.supabase) {
  console.error("❌ Supabase SDK not loaded before global.js");
} else {
  console.log("✅ Supabase SDK loaded");
}

// CREATE CLIENT SAFELY
const supabase = window.supabase.createClient(
  CONFIG.SUPA_URL,
  CONFIG.SUPA_ANON
);

// expose supabase globally
window.supabase = supabase;


// -----------------------------------------
// GLOBAL UTILS
// -----------------------------------------
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = CONFIG.LANG;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function startListening(onResult) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("STT not supported");
    return;
  }
  const rec = new SR();
  rec.lang = CONFIG.LANG;
  rec.onresult = (e) => onResult(e.results[0][0].transcript);
  rec.start();
}


// -----------------------------------------
// LANG + TRANSLATION ENGINE
// -----------------------------------------
function applyTranslations() {
  const lang = CONFIG.LANG;
  document.querySelectorAll("[data-translate]").forEach((el) => {
    const key = el.getAttribute("data-translate");
    el.innerText = I18N[lang][key] || I18N["en"][key] || key;
  });
}

function initializeLanguageSelector() {
  const sel = document.getElementById("langSelect");
  if (!sel) return;

  sel.innerHTML = "";
  CONFIG.supported_languages.forEach((l) => {
    const op = document.createElement("option");
    op.value = l;
    op.innerText = l.toUpperCase();
    sel.appendChild(op);
  });

  sel.value = CONFIG.LANG;

  sel.onchange = () => {
    CONFIG.LANG = sel.value;
    localStorage.setItem("lang", CONFIG.LANG);
    applyTranslations();
  };
}


// -----------------------------------------
// EXPORT GLOBALS
// -----------------------------------------
window.CONFIG = CONFIG;
window.speak = speak;
window.startListening = startListening;
window.applyTranslations = applyTranslations;
window.initializeLanguageSelector = initializeLanguageSelector;

