// script.js — entry module wiring buttons, voice, and genie core
import { genieCore } from "./genie/genie-core.js";
import { speak } from "./api/tts.js";
import { listen } from "./api/stt.js";
import { initSupabase } from "./api/supabase.js";
import { loadLanguage, t } from "./i18n/t.js";

// init supabase (placeholder)
initSupabase();

// DOM refs
const languageSelect = document.getElementById("languageSelect");
const currencySelect = document.getElementById("currencySelect");
const audioToggle = document.getElementById("audioToggle");
const thunderAudio = document.getElementById("thunder");
const tapToSay = document.getElementById("tapToSay");
const userText = document.getElementById("userText");
const sendText = document.getElementById("sendText");
const goldCloud = document.querySelector(".gold-cloud");
const treasure = document.querySelector(".treasure");

// ensure i18n loaded
if (languageSelect) {
  languageSelect.addEventListener("change", () => loadLanguage(languageSelect.value));
}

// Initialize genie core with callbacks
genieCore.init({
  onOutput: async (txt) => {
    // display in UI (simple alert for now, replace with chat window)
    console.log("Genie says:", txt);
    // speak out if enabled
    if (audioToggle && audioToggle.checked) {
      await speak(txt);
    }
    // optionally show temporary visual (you can implement a chat message container)
    showToast(txt);
  },
  onUpdateUI: ({ mode, stepIndex, step }) => {
    // update UI hints if you have a step area
    console.log("UI update:", mode, stepIndex, step);
  }
});

// small UI helper to show messages (replace with your chat UI)
function showToast(msg){
  // simple ephemeral message at top-right
  let el = document.createElement("div");
  el.textContent = msg;
  el.style.position = "fixed";
  el.style.right = "18px";
  el.style.top = "18px";
  el.style.background = "rgba(0,0,0,0.7)";
  el.style.color = "#fff";
  el.style.padding = "10px 12px";
  el.style.borderRadius = "8px";
  el.style.zIndex = 9999;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 5500);
}

// button click handlers -> start flows
if (goldCloud) {
  goldCloud.addEventListener("click", () => {
    loadLanguage(languageSelect?.value || "en");
    genieCore.startFlow("business_flow");
  });
}
if (treasure) {
  treasure.addEventListener("click", () => {
    loadLanguage(languageSelect?.value || "en");
    genieCore.startFlow("website_flow");
  });
}

// voice input
if (tapToSay) {
  tapToSay.addEventListener("click", async () => {
    showToast(t("ui.listen_start") || "Listening...");
    const transcript = await listen();
    if (transcript) {
      userText.value = transcript;
      // pass to genie (handles intent or flow)
      await genieCore.handleUserInput(transcript);
    } else {
      showToast(t("ui.listen_failed") || "No input detected.");
    }
  });
}

// send typed text
if (sendText) {
  sendText.addEventListener("click", async () => {
    const txt = userText.value.trim();
    if (!txt) return;
    userText.value = "";
    await genieCore.handleUserInput(txt);
  });
}

// allow Enter to send
if (userText) {
  userText.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendText.click();
    }
  });
}

// small auto-detect language then load i18n
(function autoDetectAndLoad(){
  const navLang = navigator.language || "en-IN";
  const langCode = navLang.split("-")[0];
  if (languageSelect) {
    // if this value exists in options, select it; otherwise leave default
    const opt = Array.from(languageSelect.options).find(o => o.value === langCode);
    if (opt) languageSelect.value = langCode;
  }
  loadLanguage(languageSelect?.value || "en");
})();
