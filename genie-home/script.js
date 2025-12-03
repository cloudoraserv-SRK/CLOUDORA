// script.js — entry module
import { genieCore } from "./genie/genie-core.js";
import { speak } from "./api/tts.js";
import { listen } from "./api/stt.js";
import { initSupabase } from "./api/supabase.js";
import { loadLanguage, t } from "./i18n/t.js";
// load default detected language
loadLanguage(languageSelect.value);

languageSelect.addEventListener("change", () => {
  loadLanguage(languageSelect.value);
});


// Initialize Supabase connection (optional, no keys here)
initSupabase();

// DOM refs
const languageSelect = document.getElementById("languageSelect");
const currencySelect = document.getElementById("currencySelect");
const audioToggle = document.getElementById("audioToggle");
const thunderAudio = document.getElementById("thunder");
const tapToSay = document.getElementById("tapToSay");
const userText = document.getElementById("userText");
const sendText = document.getElementById("sendText");

// language priority list (you can expand)
const priorityLanguages = [
  {code:"hi","label":"हिंदी"},
  {code:"en","label":"English"},
  {code:"pa","label":"Punjabi"},
  {code:"gu","label":"ગુજરાતી"},
  {code:"ra","label":"Rajasthani"},
  {code:"kn","label":"ಕನ್ನಡ"},
  {code:"ta","label":"தமிழ்"},
  // add other regional and global languages as needed
];

// small currency map by region (expand as needed)
const localeCurrency = {
  "IN": "INR",
  "US": "USD",
  "GB": "GBP",
  "EU": "EUR"
};

function populateLanguageBar(detected){
  // put detected first if available
  const seen = new Set();
  if(detected){
    seen.add(detected.code);
    const opt = document.createElement("option");
    opt.value = detected.code; opt.textContent = detected.label + " (detected)";
    languageSelect.appendChild(opt);
  }
  for(const lang of priorityLanguages){
    if(seen.has(lang.code)) continue;
    const opt=document.createElement("option");
    opt.value=lang.code; opt.textContent=lang.label;
    languageSelect.appendChild(opt);
  }
}

function populateCurrency(detectedCountry){
  const detectedCurrency = localeCurrency[detectedCountry] || "USD";
  const opt = document.createElement("option");
  opt.value = detectedCurrency;
  opt.textContent = detectedCurrency + " (detected)";
  currencySelect.appendChild(opt);

  // add a few common ones
  ["INR","USD","EUR","GBP","AED","AUD"].forEach(c=>{
    if(c===detectedCurrency) return;
    const o=document.createElement("option");o.value=c;o.textContent=c;currencySelect.appendChild(o);
  });
}

// Basic auto-detect
function autoDetect(){
  const navLang = navigator.language || navigator.userLanguage || "en";
  const langCode = navLang.split("-")[0];
  const country = (navLang.split("-")[1] || "IN").toUpperCase();
  const detected = priorityLanguages.find(l=>l.code===langCode) || {code:langCode,label:langCode};
  populateLanguageBar(detected);
  populateCurrency(country);
}
autoDetect();

// thunder effect every 8 seconds (5-10s requirement approximated)
let thunderInterval = null;
function startThunder() {
  if(thunderInterval) clearInterval(thunderInterval);
  thunderInterval = setInterval(() => {
    if(audioToggle.checked){
      thunderAudio.currentTime = 0;
      thunderAudio.play().catch(()=>{ /* muted autoplay may block; acceptable */ });
    }
  }, 8000 + Math.random()*4000);
}
startThunder();

audioToggle.addEventListener("change", () => {
  if(audioToggle.checked) startThunder();
  else if(thunderInterval) clearInterval(thunderInterval);
});

// Tap-to-say behavior
tapToSay.addEventListener("click", async () => {
  try{
    const text = await listen(); // STT module returns transcript
    if(text) {
      userText.value = text;
      // send to genie
      const reply = await genieCore.handleUserInput(text);
      if(audioToggle.checked) speak(reply);
    }
  }catch(e){ console.error(e) }
});

// send text button
sendText.addEventListener("click", async () => {
  const text = userText.value.trim();
  if(!text) return;
  const reply = await genieCore.handleUserInput(text);
  if(audioToggle.checked) speak(reply);
});

// small init for Genie animations / behaviours
genieCore.init({
  onSpeak: (txt)=>{ if(audioToggle.checked) speak(txt) },
  languageSelect,
  currencySelect
});
