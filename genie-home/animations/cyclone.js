// animations/cyclone.js — plain script, no export
// Provides global function: window.teleportEffect()

(function(){
  function createOverlay(){
    let el = document.getElementById('__cloudora_teleport_overlay');
    if(el) return el;
    el = document.createElement('div');
    el.id = '__cloudora_teleport_overlay';
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.transition = 'opacity .45s ease';
    el.style.opacity = '0';
    el.innerHTML = `
      <div style="width:220px;height:220px;display:flex;align-items:center;justify-content:center;transform-origin:center">
        <div style="position:absolute;width:200px;height:200px;border-radius:50%;border:4px solid rgba(255,255,255,0.06);animation:__cspin 1.4s linear infinite;"></div>
        <div style="position:absolute;width:160px;height:160px;border-radius:50%;border:4px solid rgba(255,255,255,0.04);animation:__cspin 1.4s linear infinite reverse;"></div>
      </div>
    `;
    document.body.appendChild(el);

    // add keyframes in runtime (one-time)
    if(!document.getElementById('__cyclone_keyframes')){
      const s = document.createElement('style');
      s.id = '__cyclone_keyframes';
      s.innerHTML = `
        @keyframes __cspin { from{transform:rotate(0deg) scale(.9)} to{transform:rotate(360deg) scale(1.02)} }
      `;
      document.head.appendChild(s);
    }
    return el;
  }

  window.teleportEffect = function({duration=800} = {}){
    try{
      const overlay = createOverlay();
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'none';
      // optional pulse
      overlay.animate([{opacity:1, transform:'scale(1)'}, {opacity:0.95, transform:'scale(1.03)'}], {duration:220, iterations:1});
      // hide after duration
      setTimeout(()=> { overlay.style.opacity = '0'; }, duration-80);
    }catch(e){
      console.warn('teleportEffect fallback', e);
    }
  };
})();
