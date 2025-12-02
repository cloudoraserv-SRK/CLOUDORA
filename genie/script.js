/* app.js
   - Save as app.js in same folder as index.html, style.css
   - Place assets in ./assets/
   - Replace or extend QUESTIONS below as needed
   - Optional: enable Google Translate by setting USE_GOOGLE_TRANSLATE=true and setting GOOGLE_API_KEY
*/

/* ---------- CONFIG ---------- */
const USE_GOOGLE_TRANSLATE = false; // set true if you will provide API key below
const GOOGLE_API_KEY = "";         // paste key if you enable above. If empty, local translations used.
const DEFAULT_LANG = "en";         // default language on load
const SUPPORTED_LANGS = [
  { code:"en", name:"English" },
  { code:"hi", name:"Hindi / हिन्दी" },
  { code:"ur", name:"Urdu / اُردُو" },
  { code:"es", name:"Español" },
  { code:"bn", name:"Bengali / বাংলা" },
  { code:"pa", name:"Punjabi / ਪੰਜਾਬੀ" },
  { code:"ta", name:"Tamil / தமிழ்" },
  { code:"gu", name:"Gujarati / ગુજરાતી" }
];
const CLOUD_IMAGES = ["assets/cloud1.png","assets/cloud2.png","assets/cloud3.png","assets/cloud4.png","assets/cloud5.png"];

/* ---------- GENIE QUESTIONS DATA (structured) ----------
  Each item: { id, prompts: {lang: text}, options: [ { id, label: {lang:text} } ], type }
  type currently 'single' (single-choice). You can extend to free-text later.
*/
const QUESTIONS = [
  {
    id: "welcome",
    prompts: {
      en: "Hello! I'm your Cloudora Genie. What would you like help with today?",
      hi: "नमस्ते! मैं आपका Cloudora Genie हूँ। आज किस काम में मदद चाहिए?",
      ur: "ہیلو! میں آپ کا Cloudora Genie ہوں۔ آج کس کام میں مدد چاہئیے؟",
      es: "¡Hola! Soy tu Genio Cloudora. ¿En qué te gustaría que te ayude hoy?",
      bn: "হ্যালো! আমি আপনার Cloudora Genie। আজ কী সাহায্য করতে পারি?",
      pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ Cloudora Genie ਹਾਂ। ਅੱਜ ਕਿਸ ਕੰਮ ਵਿੱਚ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?",
      ta: "வணக்கம்! நான் உங்கள் Cloudora Genie. இன்று எப்படி உதவ வேண்டும்?",
      gu: "હેલો! હું તમારો Cloudora Genie છું. આજે કયા ઉપયોગમાં મદદ જોઈએ?"
    },
    options: [
      { id:"leads", label: {
          en:"Lead Generation Training",
          hi:"लीड जनरेशन ट्रेनिंग",
          ur:"لیڈ جنریشن ٹریننگ",
          es:"Entrenamiento de generación de leads",
          bn:"লিড জেনারেশন ট্রেনিং",
          pa:"ਲੀਡ ਜਨਰੇਸ਼ਨ ਟਰੇਨਿੰਗ",
          ta:"லீட் ஜெனரேஷன் பயிற்சி",
          gu:"લીડ જનરેશન ટ્રેનિંગ"
        }},
      { id:"crm", label: {
          en:"CRM Setup & Demo",
          hi:"CRM सेटअप और डेमो",
          ur:"CRM سیٹ اپ اور ڈیمو",
          es:"Configuración y demo de CRM",
          bn:"CRM সেটআপ ও ডেমো",
          pa:"CRM ਸੈਟਅਪ ਅਤੇ ਡੈਮੋ",
          ta:"CRM அமைப்பு மற்றும் டெமோ",
          gu:"CRM સેટઅપ અને ડેમો"
        }},
      { id:"training", label: {
          en:"Sales & Calling Training",
          hi:"सेल्स और कॉलिंग ट्रेनिंग",
          ur:"سیلز اور کالنگ ٹریننگ",
          es:"Entrenamiento en ventas y llamadas",
          bn:"বিক্রয় ও কল প্রশিক্ষণ",
          pa:"ਸੇਲਜ਼ ਅਤੇ ਕਾਲਿੰਗ ਟਰੇਨਿੰਗ",
          ta:"விற்பனை மற்றும் அழைப்புத் பயிற்சி",
          gu:"સેલ્સ અને કોલિંગ ટ્રેનિંગ"
        }}
    ],
    type: "single"
  },

  {
    id: "region",
    prompts: {
      en: "Which city or region are you working in?",
      hi: "आप किस शहर/क्षेत्र में काम कर रहे हैं?",
      ur: "آپ کس شہر/علاقے میں کام کر رہے ہیں؟",
      es: "¿En qué ciudad o región trabajas?",
      bn: "আপনি কোন শহর/অঞ্চলে কাজ করছেন?",
      pa: "ਤੁਸੀਂ ਕਿਸ ਸ਼ਹਿਰ/ਛੇਤਰ ਵਿੱਚ ਕੰਮ ਕਰ ਰਹੇ ਹੋ?",
      ta: "நீங்கள் எந்த நகரம் / பகுதிகளில் வேலை செய்கிறீர்கள்?",
      gu: "તમે કયા શહેર/પ્રદેશમાં કામ કરી રહ્યા છો?"
    },
    options: [
      { id:"city_local", label: { en:"Local City", hi:"स्थानीय शहर", ur:"مقامی شہر", es:"Ciudad local", bn:"স্থানীয় শহর", pa:"ਸਥਾਨਕ ਸ਼ਹਿਰ", ta:"உள்ளூர் நகரம்", gu:"સ્થાનીય શહેર" } },
      { id:"metro", label: { en:"Metro / Big City", hi:"मेट्रो / बड़ा शहर", ur:"میٹرو/بڑا شہر", es:"Ciudad grande / metro", bn:"মেট্রো / বড় শহর", pa:"ਮੈਟਰੋ / ਵੱਡਾ ਸ਼ਹਿਰ", ta:"மெட்ரோ / பெரிய நகரம்", gu:"મેટ્રો / મોટું શહેર" } },
      { id:"other", label: { en:"Other / Remote", hi:"अन्य / दूरस्थ", ur:"دیگر/دور دراز", es:"Otro / remoto", bn:"অন্যান্য/দূরবর্তী", pa:"ਹੋਰ/ਰੇਮੋਟ", ta:"மற்றவை / தொலைவிலுள்ளவை", gu:"હોર/દૂરનું" } }
    ],
    type: "single"
  },

  {
    id: "goal",
    prompts: {
      en: "What is your primary goal? (choose one)",
      hi: "आपका मुख्य लक्ष्य क्या है? (एक चुनें)",
      ur: "آپ کا بنیادی مقصد کیا ہے؟ (ایک منتخب کریں)",
      es: "¿Cuál es tu objetivo principal? (elige uno)",
      bn: "আপনার প্রধান লক্ষ্য কী? (একটি নির্বাচন করুন)",
      pa: "ਤੁਹਾਡਾ ਮੁੱਖ ਲਕੜ ਕੀ ਹੈ? (ਇੱਕ ਚੁਣੋ)",
      ta: "உங்கள் முக்கிய குறிக்கோள் என்ன? (ஒரைத் தேர்ந்தெடுக்கவும்)",
      gu: "તમારો મુખ્ય ઉદ્દેશ શું છે? (એક પસંદ કરો)"
    },
    options:[
      { id:"earn", label: { en:"Earn Commission", hi:"कमीशन कमाना", ur:"کمیشن کمانا", es:"Ganar comisión", bn:"কমিশন অর্জন", pa:"ਕਮਾਈ ਕਮਾਉਣਾ", ta:"கமிஷன் சம்பாதிக்க", gu:"કમીશન કમાવવું" } },
      { id:"learn", label: { en:"Learn Skills", hi:"कौशल सीखना", ur:"مہارت سیکھنا", es:"Aprender habilidades", bn:"কৌশল শেখা", pa:"ਕੌਸ਼ਲ ਸਿੱਖਣਾ", ta:"திறனை கற்க", gu:"કૌશલ્ય શીખવુ" } },
      { id:"build", label: { en:"Find Clients", hi:"क्लाइंट पाना", ur:"کلائنٹس ڈھونڈنا", es:"Encontrar clientes", bn:"ক্লায়েন্ট খোঁজা", pa:"ਕਲਾਇੰਟ ਲੱਭੋ", ta:"கஸ்டமர் பெற", gu:"ક્લાયન્ટ મેળવવા" } }
    ],
    type: "single"
  },

  {
    id: "confirm",
    prompts: {
      en: "Great — ready to start a short training demo?",
      hi: "बहुत अच्छा — क्या आप छोटा प्रशिक्षण डेमो शुरू करना चाहेंगे?",
      ur: "بہت اچھا — کیا آپ مختصر تربیتی ڈیمو شروع کرنا چاہیں گے؟",
      es: "Genial — ¿listo para comenzar una breve demo de formación?",
      bn: "দারুন — একটি সংক্ষিপ্ত প্রশিক্ষণ ডেমো শুরু করতে প্রস্তুত?",
      pa: "ਵਧੀਆ — ਇੱਕ ਛੋਟਾ ਟਰੇਨਿੰਗ ਡੈਮੋ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਤਿਆਰ?",
      ta: "சிறந்தது — ஒரு குறுகிய பயிற்சி டெமோ துவக்க தயாரா?",
      gu: "સારો — ટૂંકા તાલિમ ડેમો શરૂ કરવા તૈયાર?"
    },
    options:[
      { id:"yes", label: { en:"Yes, start demo", hi:"हाँ, डेमो शुरू करें", ur:"ہاں، ڈیمو شروع کریں", es:"Sí, iniciar demo", bn:"হ্যাঁ, ডেমো শুরু করুন", pa:"ਹਾਂ, ਡੈਮੋ ਸ਼ੁਰੂ ਕਰੋ", ta:"ஆம், டெமோ தொடங்கு", gu:"હા, ડેમો શરૂ કરો" } },
      { id:"no", label: { en:"Not now", hi:"अभी नहीं", ur:"ابھی نہیں", es:"Ahora no", bn:"এখন নয়", pa:"ਹੁਣ ਨਹੀਂ", ta:"இப்போது இல்லை", gu:"હવે નહીં" } }
    ],
    type:"single"
  }
];

/* ---------- STATE ---------- */
let state = {
  lang: DEFAULT_LANG,
  qIndex: 0,
  answers: {},
  isListening: false,
  recognition: null
};

/* ---------- UTILITIES ---------- */
function $(sel){ return document.querySelector(sel) }
function $all(sel){ return Array.from(document.querySelectorAll(sel)) }

/* populate language selector */
function populateLangs(){
  const sel = $("#langSelect");
  SUPPORTED_LANGS.forEach(l=>{
    const opt = document.createElement("option");
    opt.value = l.code; opt.textContent = l.name;
    sel.appendChild(opt);
  });
  sel.value = state.lang;
  sel.addEventListener("change", async (e)=>{
    const newLang = e.target.value;
    state.lang = newLang;
    await renderCurrentQuestion();
  });
}

/* translate helper:
   - If USE_GOOGLE_TRANSLATE true & key provided, calls Google Translate API (v2)
   - Otherwise uses local text (already provided in QUESTIONS)
*/
async function translateText(text, target){
  if(!USE_GOOGLE_TRANSLATE || !GOOGLE_API_KEY) return text;
  // Google Translate REST v2 (simple example)
  try{
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;
    const res = await fetch(url, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ q: text, target: target })
    });
    const j = await res.json();
    if(j && j.data && j.data.translations && j.data.translations[0]) return j.data.translations[0].translatedText;
  }catch(err){ console.warn("Translate API failed", err) }
  return text;
}

/* speak text in selected language using Web Speech API (speechSynthesis)
   map language codes to speechSynthesis locales where possible.
*/
function speakText(text){
  if(!("speechSynthesis" in window)) return Promise.resolve();
  return new Promise((resolve)=>{
    const u = new SpeechSynthesisUtterance(text);
    // prefer exact mapping if available
    const map = {
      en:"en-US", hi:"hi-IN", ur:"ur-PK", es:"es-ES",
      bn:"bn-IN", pa:"pa-IN", ta:"ta-IN", gu:"gu-IN"
    };
    u.lang = map[state.lang] || map.en;
    u.rate = 1;
    u.pitch = 1;
    u.onend = ()=>resolve();
    u.onerror = ()=>resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

/* start / stop SpeechRecognition (browser) */
function setupSpeechRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) {
    console.warn("No SpeechRecognition available");
    return null;
  }
  const r = new SpeechRecognition();
  r.lang = state.lang === "en" ? "en-IN" : state.lang + "-" + (state.lang.toUpperCase());
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = async (ev)=>{
    const txt = ev.results[0][0].transcript;
    console.log("User said:", txt);
    $("#speechStatus").textContent = "Heard: " + txt;
    // For now: treat voice as selecting first matching option by label substring
    await handleVoiceReply(txt);
  };
  r.onend = ()=> {
    state.isListening = false;
    $("#listenBtn").textContent = "Listen";
    $("#speechStatus").textContent = "Microphone: not active";
  };
  r.onerror = (e)=> { console.warn("SpeechRecognition error", e); state.isListening=false; $("#listenBtn").textContent="Listen"; }
  return r;
}

/* find best matching option for voice reply */
async function handleVoiceReply(text){
  const q = QUESTIONS[state.qIndex];
  if(!q) return;
  const opts = q.options || [];
  const lower = text.toLowerCase();
  // try to match by translated label or english label
  for(const opt of opts){
    const label = (opt.label[state.lang] || opt.label.en).toLowerCase();
    if(lower.includes(label.split(" ")[0]) || lower.includes(opt.id)) {
      // simulate click
      const el = document.querySelector(`.cloud-item[data-id="${opt.id}"]`);
      if(el) await onCloudSelected(el, opt);
      return;
    }
  }
  // fallback: speak "I didn't get it"
  await speakText(await translateText("Sorry, I did not understand. Please choose an option.", state.lang));
}

/* ---------- RENDER ---------- */
async function renderCurrentQuestion(){
  const q = QUESTIONS[state.qIndex];
  if(!q) {
    $("#questionText").textContent = "Done";
    $("#subText").textContent = "";
    $("#cloudArea").innerHTML = "";
    return;
  }
  // question text
  let qtext = q.prompts[state.lang] || q.prompts.en || "…";
  // if Google translate enabled and original missing target, you could call translateText here
  $("#questionText").textContent = qtext;
  $("#subText").textContent = "";
  // render options as clouds
  const area = $("#cloudArea");
  area.innerHTML = "";
  const opts = q.options || [];
  for(let i=0;i<opts.length;i++){
    const opt = opts[i];
    const label = (opt.label[state.lang] || opt.label.en) || opt.label.en;
    const cloud = document.createElement("div");
    cloud.className = "cloud-item";
    cloud.setAttribute("role","listitem");
    cloud.setAttribute("tabindex","0");
    cloud.dataset.id = opt.id;
    // background image placeholder (use images in assets)
    const img = document.createElement("img");
    img.className = "cloud-bg";
    img.alt = label;
    // choose a cloud image cycling through list
    img.src = CLOUD_IMAGES[i % CLOUD_IMAGES.length] || "assets/cloud1.png";
    cloud.appendChild(img);
    const labelDiv = document.createElement("div");
    labelDiv.className = "cloud-label";
    labelDiv.innerHTML = label;
    cloud.appendChild(labelDiv);
    // click handler
    cloud.addEventListener("click", async ()=> await onCloudSelected(cloud, opt));
    cloud.addEventListener("keydown", async (e)=> { if(e.key==="Enter"||e.key===" ") await onCloudSelected(cloud,opt) });
    area.appendChild(cloud);
  }
  // have Genie speak the question
  setTimeout(()=> speakText(qtext), 350);
}

/* called when a cloud is selected */
async function onCloudSelected(cloudEl, opt){
  // animate teleport/poof
  cloudEl.classList.add("teleport");
  // store answer
  const q = QUESTIONS[state.qIndex];
  state.answers[q.id] = opt.id;
  // speak confirmation
  const confirmText = {
    en: `You chose ${opt.label.en}.`,
    hi: `आपने चुना ${opt.label.hi || opt.label.en}.`,
  };
  // choose text in selected language if available, otherwise english
  const chosenText = opt.label[state.lang] || opt.label.en;
  await speakText(chosenText + " — " + (QUESTIONS[state.qIndex+1] ? (QUESTIONS[state.qIndex+1].prompts[state.lang] || QUESTIONS[state.qIndex+1].prompts.en) : ""));
  // after animation, move to next question
  setTimeout(async ()=>{
    // remove cloud from DOM (clean)
    cloudEl.remove();
    // advance index
    state.qIndex++;
    if(state.qIndex >= QUESTIONS.length){
      await handleFinish();
    } else {
      await renderCurrentQuestion();
    }
  }, 750);
}

/* final handler */
async function handleFinish(){
  $("#questionText").textContent = "All done!";
  $("#subText").textContent = "Thank you — Genie saved your choices.";
  // speak summary (short)
  const summaryEn = Object.entries(state.answers).map(([k,v])=> `${k}: ${v}`).join(", ");
  await speakText("All done. Summary saved. Thank you.");
  console.log("Answers:", state.answers);
}

/* ---------- UI hooks ---------- */
function wireUI(){
  $("#helpBtn").addEventListener("click", ()=> {
    const txt = {
      en: "I am your Cloudora Genie. Allow audio to fully interact.",
      hi: "मैं आपका Cloudora Genie हूँ। पूर्ण बातचीत के लिए ऑडियो अनुमति दें।"
    };
    speakText(txt[state.lang] || txt.en);
  });

  $("#allowBtn").addEventListener("click", async ()=>{
    try {
      await navigator.mediaDevices.getUserMedia({ audio:true });
      $("#cloth").classList.add("hidden");
      $("#speechStatus").textContent = "Microphone: active";
    } catch (err) {
      alert("Microphone access requires HTTPS (or localhost). Continue with demo mode.");
    }
  });

  $("#listenBtn").addEventListener("click", ()=>{
    if(!state.recognition){
      state.recognition = setupSpeechRecognition();
      if(!state.recognition) { alert("Your browser does not support voice recognition."); return; }
    }
    if(!state.isListening){
      state.recognition.start();
      state.isListening = true;
      $("#listenBtn").textContent = "Listening...";
      $("#speechStatus").textContent = "Microphone: listening";
    } else {
      try{ state.recognition.stop(); }catch(e){}
      state.isListening = false;
      $("#listenBtn").textContent = "Listen";
      $("#speechStatus").textContent = "Microphone: not active";
    }
  });

  $("#nextBtn").addEventListener("click", async ()=>{
    // skip to next question
    state.qIndex++;
    if(state.qIndex >= QUESTIONS.length) handleFinish();
    else renderCurrentQuestion();
  });
}

/* ---------- INIT ---------- */
async function init(){
  populateLangs();
  wireUI();
  // render first question
  await renderCurrentQuestion();
  // warm up speechSynthesis voices (optional)
  if('speechSynthesis' in window) { window.speechSynthesis.getVoices(); }
  // pre-load cloud images to avoid flicker
  CLOUD_IMAGES.forEach(src=> { const i=new Image(); i.src=src; });
}

/* kick-off */
init();
