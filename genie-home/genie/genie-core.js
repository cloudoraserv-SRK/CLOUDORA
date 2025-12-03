
/* genie-core.js
   Cloudora Genie core logic (UI glue, flow, TTS/STT hooks, teleport)
   - Designed to be included as plain <script> (non-module)
   - Exposes global `Genie` constructor (window.Genie)
   - Looks for optional globals:
       window.apiSpeak(text, lang)   -> preferred TTS (from api/tts.js)
       window.createRecognizer(lang)-> preferred STT factory (from api/stt.js)
       window.saveToSupabase(data)  -> optional persistence (from api/supabase.js)
       window.teleportEffect()      -> optional cyclone animation (from animations/cyclone.js)
*/

(function(){
  // ----------------------------
  // Supported languages + questions
  // ----------------------------
  const SUPPORTED_LANGS = [
    { code:'en', name:'English', locale:'en-US', currency:'USD' },
    { code:'hi', name:'Hindi / हिंदी', locale:'hi-IN', currency:'INR' },
    { code:'ur', name:'Urdu / اُردُو', locale:'ur-PK', currency:'PKR' },
    { code:'es', name:'Español', locale:'es-ES', currency:'EUR' },
    { code:'bn', name:'Bengali / বাংলা', locale:'bn-BD', currency:'BDT' },
    { code:'pa', name:'Punjabi / ਪੰਜਾਬੀ', locale:'pa-IN', currency:'INR' },
    { code:'ta', name:'Tamil / தமிழ்', locale:'ta-IN', currency:'INR' },
    { code:'gu', name:'Gujarati / ગુજરાતી', locale:'gu-IN', currency:'INR' }
  ];

  const QUESTIONS = [
    {
      id: "welcome",
      prompts: {
        en: "Hello! I'm your Cloudora Genie. What would you like help with today?",
        hi: "नमस्ते! मैं आपका Cloudora Genie हूँ। आज किस काम में मदद चाहिए?",
        ur: "ہیلو! میں آپ کا Cloudora Genie ہوں۔ آج کس کام میں مدد چاہئیے؟"
      },
      options: [
        { id:"leads", label:{en:"Lead Generation Training", hi:"लीड जनरेशन ट्रेनिंग", ur:"لیڈ جنریشن ٹریننگ"} },
        { id:"crm", label:{en:"CRM Setup & Demo", hi:"CRM सेटअप और डेमो", ur:"CRM سیٹ اپ اور ڈیمو"} },
        { id:"training", label:{en:"Sales & Calling Training", hi:"सेल्स और कॉलिंग ट्रेनिंग", ur:"سیلز اور کالنگ ٹریننگ"} }
      ],
      type: "single"
    },
    {
      id: "region",
      prompts: {
        en: "Which city or region are you working in?",
        hi: "आप किस शहर/क्षेत्र में काम कर रहे हैं?",
        ur: "آپ کس شہر/علاقے میں کام کر رہے ہیں؟"
      },
      options: [
        { id:"city_local", label:{en:"Local City", hi:"स्थानीय शहर", ur:"مقامی شہر"} },
        { id:"metro", label:{en:"Metro / Big City", hi:"मेट्रो / बड़ा शहर", ur:"میٹرو/بڑا شہر"} },
        { id:"other", label:{en:"Other / Remote", hi:"अन्य / दूरस्थ", ur:"دیگر/دور دراز"} }
      ],
      type: "single"
    },
    {
      id: "goal",
      prompts:{
        en: "What is your primary goal? (choose one)",
        hi: "आपका मुख्य लक्ष्य क्या है? (एक चुनें)",
        ur: "آپ کا بنیادی مقصد کیا ہے؟ (ایک منتخب کریں)"
      },
      options:[
        { id:"earn", label:{en:"Earn Commission", hi:"कमीशन कमाना", ur:"کمیشن کمانا"} },
        { id:"learn", label:{en:"Learn Skills", hi:"कौशल सीखना", ur:"مہارت سیکھنا"} },
        { id:"build", label:{en:"Find Clients", hi:"क्लाइंट पाना", ur:"کلائنٹس ڈھونڈنا"} }
      ],
      type:"single"
    },
    {
      id:"confirm",
      prompts:{
        en:"Great — ready to start a short training demo?",
        hi:"बहुत अच्छा — क्या आप छोटा प्रशिक्षण डेमो शुरू करना चाहेंगे?",
        ur:"بہت اچھا — کیا آپ مختصر تربیتی ڈیمو شروع کرنا چاہیں گے؟"
      },
      options:[
        { id:"yes", label:{en:"Yes, start demo", hi:"हाँ, डेमो शुरू करें", ur:"ہاں، ڈیمو شروع کریں"} },
        { id:"no", label:{en:"Not now", hi:"अभी नहीं", ur:"ابھی نہیں"}}
      ],
      type:"single"
    }
  ];

  // ----------------------------
  // Small mapping for country -> currency (fallback)
  // ----------------------------
  const COUNTRY_TO_CURRENCY = {
    IN: 'INR', US: 'USD', GB: 'GBP', AE: 'AED', SG: 'SGD', CA: 'CAD', AU: 'AUD',
    PK: 'PKR', BD: 'BDT', ZA: 'ZAR', SG: 'SGD', FR: 'EUR', DE: 'EUR', ES: 'EUR'
  };

  // ----------------------------
  // Genie class
  // ----------------------------
  function Genie(opts = {}){
    // state
    this.lang = opts.lang || detectBrowserLang();
    this.qIndex = 0;
    this.answers = {};
    this.isListening = false;
    this.recognition = null;
    this.micAllowed = false;
    this.currency = null;
    this.region = null;

    // DOM refs
    this.dom = {
      langSelect: document.getElementById('langSelect'),
      questionText: document.getElementById('questionText'),
      subText: document.getElementById('subText'),
      cloudArea: document.getElementById('cloudArea'),
      cloth: document.getElementById('cloth'),
      speechStatus: document.getElementById('speechStatus'),
      bgAudio: document.getElementById('bgAudio')
    };

    // attach event hooks if present in global
    this.apiSpeak = window.apiSpeak || window.speak || null; // prefer api/tts.js binding
    this.createRecognizer = window.createRecognizer || null;
    this.saveAnswers = window.saveToSupabase || window.saveAnswers || null;
    this.teleportEffect = window.teleportEffect || window.teleportEffectSync || null;

    // initialize UI pieces
    this._populateLangs();
    this._autoDetectRegionAndCurrency();
  }

  // ----------------------------
  // Helper functions
  // ----------------------------
  function detectBrowserLang(){
    const nav = navigator.language || navigator.userLanguage || 'en';
    const two = (nav || 'en').split('-')[0];
    // if supported return code otherwise default 'en'
    return SUPPORTED_LANGS.some(s=>s.code===two) ? two : 'en';
  }

  function pickLabel(opt, lang){
    return (opt.label && (opt.label[lang] || opt.label.en)) || (typeof opt.label === 'string' ? opt.label : opt.id);
  }

  Genie.prototype._populateLangs = function(){
    const sel = this.dom.langSelect;
    if(!sel) return;
    sel.innerHTML = '';
    SUPPORTED_LANGS.forEach(l=>{
      const o = document.createElement('option');
      o.value = l.code; o.textContent = l.name;
      sel.appendChild(o);
    });
    sel.value = this.lang;
    sel.addEventListener('change', (e)=> {
      this.changeLanguage(e.target.value);
    });
  };

  Genie.prototype._autoDetectRegionAndCurrency = function(){
    // try geolocation (non-blocking)
    const tryGeo = async () => {
      try{
        // use Intl locale as best-effort
        const nav = navigator.language || 'en-US';
        const parts = nav.split('-');
        const country = parts[1] ? parts[1].toUpperCase() : null;
        this.region = country || null;
        this.currency = country && COUNTRY_TO_CURRENCY[country] ? COUNTRY_TO_CURRENCY[country] : (SUPPORTED_LANGS.find(s=>s.code===this.lang)?.currency || 'USD');
      }catch(e){
        this.region = null; this.currency = 'USD';
      }
    };
    tryGeo();
    // Also attempt to fetch geolocation via free API if allowed (non-blocking, optional)
    // Not calling any remote service here by default to keep offline.
  };

  // ----------------------------
  // Core: speak text (tries apiSpeak, fallback to speechSynthesis)
  // ----------------------------
  Genie.prototype._speak = async function(text){
    if(!text) return;
    const lang = this.lang;
    // If prefered api provided
    try{
      if(this.apiSpeak && typeof this.apiSpeak === 'function'){
        // apiSpeak should return a Promise; play blob or let it handle playback
        const r = this.apiSpeak(text, lang);
        if(r && r.then) await r;
        return;
      }
    }catch(e){
      console.warn('apiSpeak failed, falling back to speechSynthesis', e);
    }

    // fallback to browser speech synthesis
    if('speechSynthesis' in window){
      return new Promise((resolve)=>{
        const u = new SpeechSynthesisUtterance(text);
        const map = { en:'en-US', hi:'hi-IN', ur:'ur-PK', es:'es-ES', bn:'bn-BD' };
        u.lang = map[this.lang] || map.en;
        u.onend = ()=>resolve();
        u.onerror = ()=>resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      });
    } else {
      console.warn('No TTS available');
    }
  };

  // ----------------------------
  // STT setup & handlers
  // ----------------------------
  Genie.prototype._setupRecognition = function(){
    if(this.recognition) return this.recognition;
    // try provided factory first
    if(this.createRecognizer && typeof this.createRecognizer === 'function'){
      try{
        this.recognition = this.createRecognizer(this.lang);
        return this.recognition;
      }catch(e){ console.warn('createRecognizer failed', e); }
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR) return null;
    const r = new SR();
    // prefer specific locales mapping
    const mapLang = { en:'en-US', hi:'hi-IN', ur:'ur-PK', es:'es-ES' };
    r.lang = mapLang[this.lang] || (navigator.language || 'en-US');
    r.interimResults = false;
    r.maxAlternatives = 1;
    const self = this;
    r.onresult = async function(ev){
      const txt = (ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript) || '';
      if(txt) {
        self.dom.speechStatus.textContent = 'Heard: ' + txt;
        await self._handleVoiceReply(txt);
      }
    };
    r.onend = function(){ self.isListening = false; if(self.dom) self.dom.speechStatus.textContent = 'Microphone: not active'; };
    r.onerror = function(e){ console.warn('STT error', e); self.isListening = false; if(self.dom) self.dom.speechStatus.textContent = 'Microphone: error'; };
    this.recognition = r;
    return r;
  };

  Genie.prototype.toggleListen = function(){
    if(!this.micAllowed){
      alert('Please click Allow Audio first to enable microphone (HTTPS or localhost required).');
      return;
    }
    if(!this.recognition) this._setupRecognition();
    if(!this.recognition){
      alert('Speech recognition not available in this browser.');
      return;
    }
    if(!this.isListening){
      try{
        this.recognition.start();
        this.isListening = true;
        if(this.dom) this.dom.speechStatus.textContent = 'Microphone: listening';
      }catch(e){
        console.warn('recognition start failed', e);
      }
    } else {
      try{ this.recognition.stop(); }catch(e){}
      this.isListening = false;
      if(this.dom) this.dom.speechStatus.textContent = 'Microphone: not active';
    }
  };

  // ----------------------------
  // Voice reply -> match options
  // ----------------------------
  Genie.prototype._handleVoiceReply = async function(text){
    const q = QUESTIONS[this.qIndex];
    if(!q) return;
    const lower = text.toLowerCase();
    for(const opt of (q.options||[])){
      const label = (opt.label && (opt.label[this.lang] || opt.label.en) || opt.id).toLowerCase();
      // match if any word present
      const firstWord = label.split(' ')[0];
      if(lower.includes(firstWord) || lower.includes(opt.id)){
        const el = document.querySelector(`.cloud-item[data-id="${opt.id}"]`);
        if(el) await this._onCloudSelected(el, opt);
        return;
      }
    }
    await this._speak({ en:'Sorry, I did not understand. Please choose an option.', hi:'क्षमा करें, मैं समझ नहीं पाया। कृपया विकल्प चुनें।' }[this.lang] || 'Sorry, I did not understand.');
  };

  // ----------------------------
  // Render current question + options
  // ----------------------------
  Genie.prototype._renderCurrentQuestion = async function(){
    const q = QUESTIONS[this.qIndex];
    if(!q){
      this._finish();
      return;
    }
    const qtext = q.prompts[this.lang] || q.prompts.en || '...';
    if(this.dom.questionText) this.dom.questionText.textContent = qtext;
    if(this.dom.subText) this.dom.subText.textContent = '';
    // clouds
    if(this.dom.cloudArea){
      this.dom.cloudArea.innerHTML = '';
      (q.options||[]).forEach((opt, i)=>{
        const cloud = document.createElement('div');
        cloud.className = 'cloud-item';
        cloud.tabIndex = 0;
        cloud.dataset.id = opt.id;
        // background image placeholder - use available assets or plain gradient
        const img = document.createElement('img');
        img.className = 'cloud-bg';
        img.alt = pickLabel(opt, this.lang);
        // pick a cloud image if exists in assets folder (cloud1..cloud5)
        const idx = (i % 5) + 1;
        img.src = `assets/images/cloud${idx}.png`;
        // if asset missing, hide image and use CSS background (handled by CSS)
        img.onerror = function(){ this.style.display = 'none'; };
        cloud.appendChild(img);
        const label = document.createElement('div');
        label.className = 'cloud-label';
        label.innerText = pickLabel(opt, this.lang);
        cloud.appendChild(label);
        // click / keyboard
        cloud.addEventListener('click', async ()=> await this._onCloudSelected(cloud, opt));
        cloud.addEventListener('keydown', async (e)=> { if(e.key==='Enter' || e.key===' ') await this._onCloudSelected(cloud,opt); });
        this.dom.cloudArea.appendChild(cloud);
      });
    }
    // speak question (non-blocking)
    setTimeout(()=> this._speak(qtext), 300);
  };

  // ----------------------------
  // click handler for a cloud option
  // ----------------------------
  Genie.prototype._onCloudSelected = async function(cloudEl, opt){
    // animate
    cloudEl.classList.add('teleport');
    // save answer
    const q = QUESTIONS[this.qIndex];
    this.answers[q.id] = opt.id;
    // speak short confirmation
    const chosenText = (opt.label && (opt.label[this.lang] || opt.label.en)) || opt.id;
    await this._speak(chosenText);
    // small delay for animation
    await new Promise(r=>setTimeout(r, 650));
    // remove element
    try{ cloudEl.remove(); }catch(e){}
    // advance
    this.qIndex++;
    if(this.qIndex < QUESTIONS.length){
      await this._renderCurrentQuestion();
    } else {
      await this._finish();
    }
  };

  // ----------------------------
  // finish flow: save & teleport or thank you
  // ----------------------------
  Genie.prototype._finish = async function(){
    // summary speak
    await this._speak({
      en: 'All done. Our team will contact you shortly. Thank you.',
      hi: 'सब हो गया। हमारी टीम जल्द आपसे संपर्क करेगी। धन्यवाद।',
      ur: 'تمام۔ ہماری ٹیم جلد آپ سے رابطہ کرے گی۔ شکریہ۔'
    }[this.lang] || 'All done. Thank you.');

    // try to save answers (if provided)
    try{
      if(this.saveAnswers && typeof this.saveAnswers === 'function'){
        await this.saveAnswers({ answers: this.answers, lang: this.lang, region: this.region, currency: this.currency, created_at: new Date().toISOString() });
      } else {
        console.info('Answers (not saved - no save function):', this.answers);
      }
    }catch(e){ console.warn('Saving answers failed', e); }

    // If user is employee/unlock page -> teleport to login/admin; else show thanks
    // We were told: if this is public user show thank you; but user asked "yes teleport to next page with cyclone effect for login"
    // We'll teleport to /employee.html if a special condition is met (for now always teleport to login page after a short delay).
    const teleportTo = '/employee.html'; // default next page (change as required)
    // Play small teleport effect if available
    if(this.teleportEffect && typeof this.teleportEffect === 'function'){
      try { this.teleportEffect(); } catch(e){ console.warn('teleportEffect failed', e); }
      setTimeout(()=> {
        // navigate after effect
        window.location.href = teleportTo;
      }, 850);
    } else {
      // fallback: small fade then redirect
      document.body.style.transition = 'opacity .5s';
      document.body.style.opacity = '0.02';
      setTimeout(()=> window.location.href = teleportTo, 600);
    }
  };

  // ----------------------------
  // external API: start, skip, changeLanguage, toggleListen
  // ----------------------------
  Genie.prototype.start = async function(){
    // warm voices
    if('speechSynthesis' in window) window.speechSynthesis.getVoices();
    // render first question
    this.qIndex = 0;
    this.answers = {};
    await this._renderCurrentQuestion();
  };

  Genie.prototype.skip = async function(){
    // user clicked skip -> just move forward
    this.qIndex++;
    if(this.qIndex >= QUESTIONS.length) await this._finish();
    else await this._renderCurrentQuestion();
  };

  Genie.prototype.changeLanguage = async function(code){
    if(!code) return;
    this.lang = code;
    // update region/currency guess from language if possible
    const s = SUPPORTED_LANGS.find(x=>x.code===code);
    if(s){ this.currency = s.currency || this.currency; }
    await this._renderCurrentQuestion();
  };

  Genie.prototype.setMicAllowed = function(v){
    this.micAllowed = !!v;
    if(this.micAllowed && this.dom.bgAudio){
      try{ this.dom.bgAudio.play().catch(()=>{}); }catch(e){}
    }
  };

  // replace the old broken toggleListen implementation with this:
Genie.prototype.toggleListen = function(){
  // ensure mic permission
  if(!this.micAllowed){
    alert('Please click Allow Audio first to enable microphone (HTTPS or localhost required).');
    return;
  }
  // ensure recognition exists
  if(!this.recognition) this._setupRecognition();
  if(!this.recognition){
    alert('Speech recognition not available in this browser.');
    return;
  }

  if(!this.isListening){
    try{
      this.recognition.start();
      this.isListening = true;
      if(this.dom && this.dom.speechStatus) this.dom.speechStatus.textContent = 'Microphone: listening';
    }catch(e){
      console.warn('recognition.start failed', e);
    }
  } else {
    try{ this.recognition.stop(); }catch(e){ /* ignore */ }
    this.isListening = false;
    if(this.dom && this.dom.speechStatus) this.dom.speechStatus.textContent = 'Microphone: not active';
  }
};
Genie.prototype.showInput = function(show){
  const box = document.getElementById("userInputBox");
  if(!box) return;
  box.style.display = show ? "block" : "none";
};

   export default {
    start() {
        console.log("Genie Core Started");
    }
};


  // attach to window
  window.Genie = Genie;

  // Also attach small helpers so other modules can call the TTS easily if they loaded as simple scripts
  // If api/tts.js wants to register, it can set window.apiSpeak = function
})();
