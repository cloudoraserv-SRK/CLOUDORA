document.querySelectorAll('a[href^="#"]').forEach(link=>{
link.addEventListener('click',e=>{
e.preventDefault();
document.querySelector(link.getAttribute('href'))
.scrollIntoView({behavior:'smooth'});
});
});
const langBtn = document.getElementById("langBtn");
const langBox = document.getElementById("google_translate_element");

langBtn.addEventListener("click", () => {
  langBox.classList.toggle("show");
});
const menuToggle = document.getElementById("menuToggle");
const nav = document.querySelector("nav");

menuToggle.addEventListener("click",()=>{
  nav.classList.toggle("show");
});
const images = document.querySelectorAll(".gallery-grid img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

images.forEach(img=>{
  img.onclick=()=>{
    lightboxImg.src = img.src;
    lightbox.classList.add("show");
  }
});

lightbox.onclick=()=>{
  lightbox.classList.remove("show");
};
gsap.registerPlugin(ScrollTrigger);

// Hero text
gsap.from(".hero-content",{
  opacity:0,
  y:80,
  duration:1.2,
  ease:"power3.out"
});

// Sections
gsap.utils.toArray("section").forEach(sec=>{
  gsap.from(sec,{
    scrollTrigger:{
      trigger:sec,
      start:"top 80%",
    },
    opacity:0,
    y:60,
    duration:1,
    ease:"power2.out"
  });
});

// Cards
gsap.from(".card",{
  scrollTrigger:{
    trigger:".products",
    start:"top 75%"
  },
  y:60,
  opacity:0,
  stagger:0.15
});
