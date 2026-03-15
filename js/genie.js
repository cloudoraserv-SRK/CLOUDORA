import { supabase } from "/supabase/supabase.js";

console.log("✅ Home Genie Loaded");

/* =========================
   CONFIG
========================= */
const DEFAULT_LANG = "en";

/* =========================
   SOUND
========================= */
function playGenieSound() {
  const sound = document.getElementById("genieSound");
  if (!sound) return;
  sound.currentTime = 0;
  sound.volume = 0.4;
  sound.play().catch(() => {});
}

/* =========================
   MULTI-LANGUAGE CONTENT
========================= */
const I18N = {
  en: {
    intro: `
      <strong>Hi, I’m Genie.</strong><br>
      I’m here to guide you through Cloudora.<br>
      What would you like to explore?
    `,
    cloudora: `
      <strong>What is Cloudora?</strong><br><br>
      Cloudora is an AI-powered digital ecosystem designed for businesses,
      job seekers, teams, and partners.<br><br>
      Its purpose is to simplify growth, automation, and earning opportunities.
    `,
    genie: `
      <strong>What does Genie do?</strong><br><br>
      Genie is Cloudora’s intelligent assistant that guides users,
      simplifies tasks, and supports better decisions.
    `,
    services: `
      <strong>Cloudora Services</strong><br><br>
      • AI-powered Websites<br>
      • CRM & Lead Management Systems<br>
      • Automation & AI Integrations<br>
      • Business Growth Solutions
    `,
    jobs: `
      <strong>Jobs & Opportunities</strong><br><br>
      • Internships<br>
      • Freelance projects<br>
      • Sales & partner programs<br>
      • Skill-based remote work
    `,
    contact: `
      <strong>Contact Cloudora</strong><br><br>
      You can connect with our team via the Contact or Apply section.
    `,
    buttons: [
      ["✨", "What is Cloudora?", "cloudora"],
      ["🧠", "What does Genie do?", "genie"],
      ["🛠️", "View Services", "services"],
      ["💼", "Jobs & Apply", "jobs"],
      ["📞", "Contact Team", "contact"]
    ],
    cta: "Explore Genie (Full AI)"
  },

  hi: {
    intro: `
      <strong>Namaste, main Genie hoon.</strong><br>
      Main Cloudora ko samajhne me aapki madad karta hoon.<br>
      Aap kya dekhna chahte hain?
    `,
    cloudora: `
      <strong>Cloudora kya hai?</strong><br><br>
      Cloudora ek AI-powered digital ecosystem hai
      jo business, jobs aur teams ke liye bana hai.
    `,
    genie: `
      <strong>Genie kya karta hai?</strong><br><br>
      Genie Cloudora ka intelligent assistant hai
      jo guide karta hai aur decisions simplify karta hai.
    `,
    services: `
      <strong>Cloudora Services</strong><br><br>
      • AI Websites<br>
      • CRM & Leads System<br>
      • Automation & AI Setup<br>
      • Business Growth Solutions
    `,
    jobs: `
      <strong>Jobs & Opportunities</strong><br><br>
      • Internship<br>
      • Freelancing<br>
      • Sales & Partner Programs
    `,
    contact: `
      <strong>Contact Cloudora</strong><br><br>
      Aap directly team se connect kar sakte hain.
    `,
    buttons: [
      ["✨", "Cloudora kya hai?", "cloudora"],
      ["🧠", "Genie kya karta hai?", "genie"],
      ["🛠️", "Services dekho", "services"],
      ["💼", "Jobs & Apply", "jobs"],
      ["📞", "Contact Team", "contact"]
    ],
    cta: "Genie ko detail me explore karein"
  }
};

/* =========================
   SUPABASE TRACKING
========================= */
async function trackGenieEvent(action, label) {
  await supabase.from("genie_events").insert({
    source: "home_genie",
    action,
    label,
    page: "home",
    user_agent: navigator.userAgent
  });

  const intentMap = {
    services: "business_interest",
    jobs: "job_seeker",
    contact: "hot_lead",
    explore_genie_full_ai: "ai_curiosity"
  };

  if (intentMap[label]) {
    await supabase.from("crm_intents").insert({
      source: "home_genie",
      intent: intentMap[label],
      page: "home"
    });
  }
}

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("genieToggle");
  const panel = document.getElementById("geniePanel");
  const close = document.getElementById("genieClose");
  const body = document.querySelector(".genie-body");

  if (!toggle || !panel || !close || !body) return;

  const lang =
    document.documentElement.lang ||
    localStorage.getItem("lang") ||
    DEFAULT_LANG;

  const T = I18N[lang] || I18N.en;

  toggle.onclick = e => {
    e.stopPropagation();
    panel.classList.toggle("open");
    playGenieSound();
  };

  close.onclick = () => panel.classList.remove("open");

  function clearBody() {
    body.innerHTML = "";
  }

  function addBotMsg(html) {
    const div = document.createElement("div");
    div.className = "genie-msg bot";
    div.innerHTML = html;
    body.appendChild(div);
  }

  function smoothScroll(id) {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      panel.classList.remove("open");
    }
  }

  function handleAction(key) {
    playGenieSound();
    trackGenieEvent("button_click", key);

    clearBody();
    addBotMsg(T[key]);
    addButtons();

    const scrollMap = {
      cloudora: "#about",
      services: "#services",
      jobs: "#hiring",
      contact: "#contact"
    };

    if (scrollMap[key]) {
      setTimeout(() => smoothScroll(scrollMap[key]), 400);
    }
  }

  function addButtons() {
    const wrap = document.createElement("div");
    wrap.className = "genie-actions";

    T.buttons.forEach(([icon, label, key]) => {
      const btn = document.createElement("button");
      btn.className = "genie-action-btn";
      btn.innerHTML = `<span>${icon}</span><div>${label}</div>`;
      btn.onclick = () => handleAction(key);
      wrap.appendChild(btn);
    });

    const cta = document.createElement("button");
    cta.className = "genie-action-btn primary";
    cta.innerHTML = `<span>🚀</span><div>${T.cta}</div>`;
    cta.onclick = () => {
      playGenieSound();
      trackGenieEvent("cta_click", "explore_genie_full_ai");
      window.location.href = "/cloudora_genie_v.1.0/frontend/index.html";
    };

    wrap.appendChild(cta);
    body.appendChild(wrap);
  }

  /* INIT */
  clearBody();
  addBotMsg(T.intro);
  addButtons();
});
