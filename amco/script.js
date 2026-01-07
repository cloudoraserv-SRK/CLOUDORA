// MENU TOGGLE
const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("mainNav");

menuToggle.onclick = () => nav.classList.toggle("show");

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.onclick=e=>{
    e.preventDefault();
    document.querySelector(link.getAttribute("href"))
    .scrollIntoView({behavior:"smooth"});
  };
});

// GOOGLE TRANSLATE TOGGLE
const langBtn = document.getElementById("langBtn");
const langBox = document.getElementById("google_translate_element");

langBtn.onclick = () => langBox.classList.toggle("show");

// GSAP
gsap.registerPlugin(ScrollTrigger);

gsap.from(".hero-content",{y:80,opacity:0,duration:1});

gsap.utils.toArray("section").forEach(sec=>{
  gsap.from(sec,{
    scrollTrigger:{trigger:sec,start:"top 80%"},
    y:60,opacity:0,duration:0.8
  });
});

// GOOGLE TRANSLATE INIT
function googleTranslateElementInit(){
  new google.translate.TranslateElement(
    {pageLanguage:'hi',includedLanguages:'hi,en'},
    'google_translate_element'
  );
}
