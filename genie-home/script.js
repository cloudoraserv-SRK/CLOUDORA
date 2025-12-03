// script.js — UI only, binds DOM to Genie
// Defensive wiring: works if genie-core.js exposes Genie class and methods.

let genie = null;

window.addEventListener('DOMContentLoaded', async () => {
  // DOM refs (grab early but attach handlers after genie exists)
  const allowBtn = document.getElementById('allowBtn');
  const listenBtn = document.getElementById('listenBtn');
  const skipBtn = document.getElementById('skipBtn');   // control area skip
  const skipBtn2 = document.getElementById('skipBtn2'); // question area skip
  const micBtn = document.getElementById('micBtn');
  const cloth = document.getElementById('cloth');
  const speechStatus = document.getElementById('speechStatus');
  const genieImg = document.getElementById('genieImg');
  const cloudArea = document.getElementById('cloudArea');
  const bgAudio = document.getElementById('bgAudio');
  const audioSwitch = document.getElementById('audioSwitch');
  const userInput = document.getElementById('userInputBox');
  const suggestBox = document.getElementById('suggestBox');
  const langSelect = document.getElementById('langSelect');
  const helpBtn = document.getElementById('helpBtn');

  // small safety: if Genie isn't loaded yet, wait a short time
  function waitForGenie(timeout = 2000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const t = setInterval(() => {
        if (typeof window.Genie === 'function') {
          clearInterval(t);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(t);
          resolve(false);
        }
      }, 80);
    });
  }

  const hasGenie = await waitForGenie(3000);
  if (!hasGenie) {
    console.error('Genie class not found. genie-core.js may not be loaded or has errors.');
  } else {
    genie = new window.Genie(); // instantiate
    if (typeof genie.start === 'function') {
      try { genie.start(); } catch (e) { console.warn('genie.start() threw:', e); }
    }
    window.genie = genie;
  }

  // helper: animate genie to center and scale
  function animateGenieWake() {
    document.body.classList.add('genie-awake');
    try {
      genieImg.animate([
        { transform: 'translateX(-50%) scale(1)', filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.7))' },
        { transform: 'translateX(-50%) scale(1.12)', filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.8))' }
      ], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    } catch(e) { /* fallback no-anim */ }
  }

  // ALLOW AUDIO (user gesture required to start audio + mic)
  allowBtn && allowBtn.addEventListener('click', async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (genie && typeof genie.setMicAllowed === 'function') {
        genie.setMicAllowed(true);
      }
      cloth && cloth.classList.add('hidden');
      speechStatus && (speechStatus.textContent = 'Microphone: active');
      animateGenieWake();

      // play background audio (user gesture)
      if (bgAudio) {
        try { bgAudio.currentTime = 0; bgAudio.volume = 0.28; await bgAudio.play(); } catch (e) { /* ignored */ }
      }

    } catch (err) {
      alert('Microphone requires HTTPS or localhost. Continuing in demo mode.');
      if (genie && typeof genie.setMicAllowed === 'function') genie.setMicAllowed(false);
    }
  });

  // AUDIO SWITCH (toggle background audio + speechSynthesis)
  if (audioSwitch) {
    audioSwitch.dataset.on = 'false';
    audioSwitch.addEventListener('click', () => {
      const isOn = audioSwitch.dataset.on === 'true';
      if (isOn) {
        // turn off
        audioSwitch.textContent = 'Audio: OFF';
        audioSwitch.dataset.on = 'false';
        if (bgAudio && !bgAudio.paused) { try { bgAudio.pause(); } catch(e){} }
        try { window.speechSynthesis.cancel(); } catch(e){}
      } else {
        audioSwitch.textContent = 'Audio: ON';
        audioSwitch.dataset.on = 'true';
        if (bgAudio) { try { bgAudio.currentTime = 0; bgAudio.play().catch(()=>{}); } catch(e){} }
      }
    });
  }

  // HELP button speak short text via genie or fallback
  helpBtn && helpBtn.addEventListener('click', async () => {
    const msg = 'I am your Cloudora Genie. Allow audio to fully interact.';
    if (genie && typeof genie.speak === 'function') {
      try { await genie.speak(msg); return; } catch(e){/*continue*/ }
    }
    // fallback
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(msg);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  });

  // LISTEN (top control) -> reuse genie.toggleListen if present
  listenBtn && listenBtn.addEventListener('click', () => {
    if (!genie) return;
    if (typeof genie.toggleListen === 'function') {
      genie.toggleListen();
      // update button label if genie exposes isListening
      setTimeout(() => {
        listenBtn.textContent = genie.isListening ? 'Listening...' : 'Listen';
      }, 80);
    } else {
      console.warn('genie.toggleListen not implemented in genie-core.js');
    }
  });

  // MIC (question area) — start/stop listen
  micBtn && micBtn.addEventListener('click', () => {
    if (!genie) return;
    if (typeof genie.toggleListen === 'function') {
      genie.toggleListen();
    } else if (typeof genie.startListening === 'function') {
      genie.startListening();
    } else {
      alert('Voice recognition is not available in this build.');
    }
  });

  // SKIP buttons (both) — call genie.skip() if available
  if (skipBtn) skipBtn.addEventListener('click', () => { if (genie && typeof genie.skip === 'function') genie.skip(); });
  if (skipBtn2) skipBtn2.addEventListener('click', () => { if (genie && typeof genie.skip === 'function') genie.skip(); });

  // delegate cloud clicks to genie if method exists (graceful)
  if (cloudArea) {
    cloudArea.addEventListener('click', (ev) => {
      const item = ev.target.closest('.cloud-item');
      if (!item) return;
      const id = item.dataset.id;
      if (!id) return;
      if (genie && typeof genie.onCloudClick === 'function') {
        genie.onCloudClick(id);
      } else if (genie && typeof genie.selectOption === 'function') {
        genie.selectOption(id);
      } else {
        console.warn('genie.onCloudClick / selectOption missing; cloud click ignored.');
      }
    });
  }

  // show/hide user input box on demand (exposed as a small helper)
  window.UI = {
    showInput: (show) => {
      if (!userInput) return;
      userInput.style.display = show ? 'block' : 'none';
      if (!show) { userInput.value = ''; suggestBox && (suggestBox.style.display = 'none'); }
    },
    showSuggestions: (items) => {
      if (!suggestBox) return;
      if (!items || items.length === 0) { suggestBox.style.display = 'none'; return; }
      suggestBox.innerHTML = items.map(i => `<div class="sugg-item">${i}</div>`).join('');
      suggestBox.style.display = 'block';
    }
  };

  // language selector: if genie exposes supported languages, populate
  if (langSelect) {
    // default options if genie doesn't provide
    const defaults = [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi / हिन्दी' }
    ];
    const langs = (genie && genie.supportedLangs) ? genie.supportedLangs : defaults;
    langs.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.code; opt.textContent = l.name;
      langSelect.appendChild(opt);
    });
    langSelect.value = (genie && genie.lang) ? genie.lang : langs[0].code;
    langSelect.addEventListener('change', (e) => {
      if (genie && typeof genie.setLang === 'function') genie.setLang(e.target.value);
    });
  }

  // layout responsive helper
  const resizeHandler = () => {
    const w = window.innerWidth;
    if (w < 920) document.body.classList.add('narrow'); else document.body.classList.remove('narrow');
  };
  window.addEventListener('resize', resizeHandler);
  resizeHandler();

  console.log('Genie home UI wired.');
});
