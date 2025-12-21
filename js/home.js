/* ===== SERVICES SCROLLER ===== */
const scroller = document.getElementById("serviceScroller");
if (scroller) {
  let down=false,startX,scrollLeft;

  scroller.onmousedown = e => {
    down=true;
    startX=e.pageX - scroller.offsetLeft;
    scrollLeft=scroller.scrollLeft;
    scroller.style.cursor="grabbing";
  };
  scroller.onmouseup = scroller.onmouseleave = () => {
    down=false;
    scroller.style.cursor="grab";
  };
  scroller.onmousemove = e => {
    if(!down) return;
    scroller.scrollLeft = scrollLeft - (e.pageX-startX)*1.6;
  };
}

/* ===== DOT SNAP ===== */
const cards = [...document.querySelectorAll("#serviceScroller .card")];
const dotsWrap = document.getElementById("serviceDots");

cards.forEach((_,i)=>{
  const d=document.createElement("button");
  d.onclick=()=>cards[i].scrollIntoView({behavior:"smooth",inline:"center"});
  dotsWrap?.appendChild(d);
});

/* ===== GSAP ===== */
window.addEventListener("load",()=>{
  if(window.gsap){
    gsap.from(".project-grid .card",{opacity:0,y:40,stagger:0.1});
  }
});
