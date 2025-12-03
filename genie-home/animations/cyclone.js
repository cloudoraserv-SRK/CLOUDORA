// simple cyclone animation helper (export functions)
export function startCyclone(target = document.body){
  // create a simple rotating cyclone element for effect
  const el = document.createElement("div");
  el.className = "cyclone";
  el.style.position = "absolute";
  el.style.width = "240px";
  el.style.height = "240px";
  el.style.left = "50%";
  el.style.top = "30%";
  el.style.transform = "translate(-50%,-50%)";
  el.style.pointerEvents = "none";
  el.style.zIndex = 12;
  el.style.borderRadius = "50%";
  el.style.boxShadow = "0 0 60px 20px rgba(255,255,255,0.02) inset";
  el.style.animation = "spin 1.6s linear infinite";
  target.appendChild(el);

  // remove after some time
  setTimeout(()=>{ el.remove(); }, 4000);
}

export function stopCyclone(){
  // no-op placeholder
}

/* CSS needed: add to style.css for .cyclone and @keyframes spin */
