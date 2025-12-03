// script.js — Genie homepage controller (hybrid model UI + voice + text)
import { genieCore } from "./genie/genie-core.js";
import { speak } from "./api/tts.js";
import { listen } from "./api/stt.js";
import { initSupabase } from "./api/supabase.js";
import { loadLanguage, t } from "./i18n/t.js";

// ⚠ Supabase disabled until flows are complete
initSupabase();

// DOM References
const languageSelect = document.getElementById("languageSelect");
const currencySelect = document.getElementById("currencySelect");
const audioToggle = document.getElementById("audioToggle");
const tapToSay = document.getElementById("tapToSay");
const userText = document.getElementById("userText");
const sendText = document.getElementById("sendText");
const goldCloud = document.querySelector(".gold-cloud");
const treasure = document.querySelector(".treasure");

// 🌐 Load i18n on start
(function autoDetectLanguage(){
  const nav = navigator.language || "en-IN";
  const lang = nav.split("-")[0];
  if (languageSelect) {
    const opt = [...languageSelect.options].find(o => o.value === lang);
    if (opt) languageSelect.value = lang;
  }
  loadLanguage(languageSelect?.value || "en");
})();

if (languageSelect) {
  languageSelect.addEventListener("change", () => {
    loadLanguage(languageSelect.value);
  });
}

// 🧞 Initialize Genie Core
genieCore.init({
  onOutput: async (txt) => {
    addMessage(txt, "genie");
    if (audioToggle && audioToggle.checked) speak(txt);
  },

  onOptions: (opts) => {
    showOptions(opts);
  }
});

btn.addEventListener("click", () => {
  addMessage(opt.label, "user");
  // opt.value may be JSON (our design) => parse
  let payload = opt.value;
  try { payload = JSON.parse(opt.value); } catch(e) { /* not JSON */ }
  // if payload.action exists, handle locally
  if (payload && payload.action) {
    // handle common actions locally
    if (payload.action === "quote") {
      genieCore.sendOutput("Sure — I can prepare a quick quote. Please share your budget (or type 'no budget').");
      // optionally set mode to a quote flow
      genieCore.mode = "quote_flow";
      return;
    }
    if (payload.action === "connect_sales") {
      genieCore.sendOutput("I'll connect you to our sales team — please share your contact number or say 'call me'.");
      return;
    }
    if (payload.action.startsWith("plan_")) {
      // show brief plan summary or ask follow-up questions
      genieCore.sendOutput(`Here's a short plan for ${payload.category}: we'll run targeted campaigns, set up listings, and provide telecaller follow-ups. Do you want the detailed plan?`);
      return;
    }
    if (payload.action === "join_partner") {
      genieCore.sendOutput("Great — we can onboard you as a service partner. Please share your name and phone number to start.");
      return;
    }
  }
  // fallback: when option is plain string, pass to normal flow
  genieCore.handleUserInput(opt.value);
  clearOptionButtons();
});


document.getElementById("chatSendBtn")?.addEventListener("click", async () => {
  const txt = document.getElementById("chatInput").value.trim();
  if (!txt) return;
  addMessage(txt, "user");
  document.getElementById("chatInput").value = "";
  await genieCore.handleUserInput(txt);
});

// 🔊 Toast-style popup (temporary UI)
function showToast(msg){
  let el = document.createElement("div");
  el.textContent = msg;
  el.style.position = "fixed";
  el.style.right = "22px";
  el.style.bottom = "22px";
  el.style.background = "rgba(0,0,0,.75)";
  el.style.color = "#fff";
  el.style.padding = "10px 16px";
  el.style.borderRadius = "10px";
  el.style.zIndex = "9999";
  el.style.maxWidth = "260px";
  el.style.fontSize = "14px";
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 5000);
}

// ☁️ GOLD CLOUD BUTTON → BUSINESS FLOW
goldCloud?.addEventListener("click", () => {
  genieCore.startFlow("business_flow");
});

// 💎 TREASURE BUTTON → WEBSITE FLOW
treasure?.addEventListener("click", () => {
  genieCore.startFlow("website_flow");
});

// 🎤 Microphone Input
tapToSay?.addEventListener("click", async () => {
  showToast(t("ui.listen_start") || "Listening...");
  const transcript = await listen();
  if (!transcript) return showToast(t("ui.listen_failed") || "No audio detected.");

  userText.value = transcript;
  genieCore.handleUserInput(transcript);
});

// ⌨️ Text Send Button
sendText?.addEventListener("click", async () => {
  const text = userText.value.trim();
  if (!text) return;
  userText.value = "";
  await genieCore.handleUserInput(text);
});

// ↵ Enter Key for Send
userText?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendText.click();
  }
});

function addMessage(text, sender = "genie") {
  const msgWrapper = document.getElementById("chatMessages");
  const msg = document.createElement("div");
  msg.classList.add(sender === "genie" ? "genie-msg" : "user-msg");
  msg.textContent = text;
  msgWrapper.appendChild(msg);
  msgWrapper.scrollTop = msgWrapper.scrollHeight;
}

function clearOptionButtons() {
  document.getElementById("optionButtons").innerHTML = "";
}

function showOptions(options) {
  clearOptionButtons();
  const container = document.getElementById("optionButtons");

  options.forEach(opt => {
    const btn = document.createElement("div");
    btn.classList.add("option-btn");
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      addMessage(opt.label, "user");
      genieCore.handleUserInput(opt.value);
      clearOptionButtons();
    });
    container.appendChild(btn);
  });
}
