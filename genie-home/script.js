// script.js — UI only, binds DOM to Genie
// Overwrite your old script.js with this one.

let genie = null;

window.addEventListener('DOMContentLoaded', () => {
  // ensure Genie exists
  if(typeof Genie !== 'function'){
    console.error('Genie not found. Make sure genie-core.js is loaded BEFORE script.js');
    return;
  }

  // instantiate
  genie = new Genie();
  window.genie = genie;
  genie.start();

  // DOM refs
  const allowBtn = document.getElementById('allowBtn');
  const listenBtn = document.getElementById('listenBtn');
  const skipBtn = document.getElementById('skipBtn');
  const cloth = document.getElementById('cloth');
  const speechStatus = document.getElementById('speechStatus');
  const genieImg = document.getElementById('genieImg');
  const cloudArea = document.getElementById('cloudArea');
  const bgAudio = document.getElementById('bgAudio');
  const langSelect = document.getElementById('langSelect');

  // Add a small audio ON/OFF switch UI next to Allow (optional)
  const audioSwitch = document.createElement('button');
  audioSwitch.id = 'audioSwitch';
  audioSwitch.className = 'btn ghost';
  audioSwitch.textContent = 'Audio: ON';
  allowBtn.parentNode.insertBefore(audioSwitch, allowBtn.nextSibling);

  // helper animate genie to center and scale
  function animateGenieWake(){
    // move genie to center of screen visually by adding class
    document.body.classList.add('genie-awake');
    genieImg.animate([
      { transform: 'translateX(-50%) scale(1)', filter:'drop-shadow(0 25px 50px rgba(0,0,0,0.7))' },
      { transform: 'translateX(-50%) scale(1.12)', filter:'drop-shadow(0 40px 80px rgba(0,0,0,0.8))' }
    ], { duration: 520, easing:'cubic-bezier(.2,.9,.3,1)', fill:'forwards' });
  }

  // Allow Audio
  allowBtn.addEventListener('click', async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio:true });
      genie.setMicAllowed(true);
      if(cloth) cloth.classList.add('hidden');
      if(speechStatus) speechStatus.textContent = 'Microphone: active';
      // animate genie and center UI
      animateGenieWake();

      // try to play background thunder only on user gesture
      try { bgAudio.currentTime = 0; bgAudio.play().catch(()=>{}); } catch(e){}

    } catch (err){
      alert('Microphone requires HTTPS or localhost. Continue in demo mode.');
      genie.setMicAllowed(false);
    }
  });

  // Audio on/off toggle
  audioSwitch.addEventListener('click', ()=>{
    const on = audioSwitch.textContent.includes('ON');
    audioSwitch.textContent = on ? 'Audio: OFF' : 'Audio: ON';
    // disable speechSynthesis if OFF
    if(on){
      // turning off
      window.speechSynthesis.cancel();
      audioSwitch.dataset.on = 'false';
    } else {
      audioSwitch.dataset.on = 'true';
    }
  });

  // Listen button: use Genie toggleListen (fixed in genie-core)
  listenBtn.addEventListener('click', () => {
    if(!genie) return;
    genie.toggleListen();
    listenBtn.textContent = genie.isListening ? 'Listening...' : 'Listen';
  });

  // Skip
  skipBtn.addEventListener('click', () => {
    genie.skip();
  });

  // Make clouds float over background and always be above video
  // This is handled in CSS update; but ensure cloudArea has high z-index
  if(cloudArea) cloudArea.style.zIndex = 60;

  // adjust layout: put options below genie bubble if screen narrow
  const resizeHandler = () => {
    const w = window.innerWidth;
    if(w < 920){
      document.body.classList.add('narrow');
    } else {
      document.body.classList.remove('narrow');
    }
  };
  window.addEventListener('resize', resizeHandler);
  resizeHandler();

  console.log('Genie home initialized.');
});
