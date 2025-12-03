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
    console.log("%cGenie:", "color:#0ff;font-weight:bold", txt);

    // speak only if audio toggle ON
    if (audioToggle?.checked) {
      try { await speak(txt); } catch(e){ console.warn("TTS error", e); }
    }

    showToast(txt); // temporary message
  },

  onUpdateUI: ({ mode, stepIndex, step }) => {
    console.log("UI Update →", mode, stepIndex, step);
    // here later we will display step-based option buttons
  }
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
