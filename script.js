// === Navbar Hamburger Toggle ===
const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  const expanded = hamburger.classList.contains("active");
  hamburger.setAttribute("aria-expanded", expanded);
  mobileMenu.style.display = expanded ? "block" : "none";
  mobileMenu.setAttribute("aria-modal", expanded ? "true" : "false");
});

// Close menu on link click
mobileMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.style.display = "none";
  });
});

// === Services Scroller Controls ===
const scroller = document.getElementById("serviceScroller");
document.getElementById("prev").addEventListener("click", () => {
  scroller.scrollBy({ left: -340, behavior: "smooth" });
});
document.getElementById("next").addEventListener("click", () => {
  scroller.scrollBy({ left: 340, behavior: "smooth" });
});

// === GSAP Animations ===
gsap.registerPlugin(ScrollTrigger);

// Hero title + subtitle entrance
gsap.from(".hero .title", {
  y: 50, opacity: 0, duration: 1, ease: "power3.out"
});
gsap.from(".hero .subtitle", {
  y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 0.3
});
gsap.from(".launch-offer", {
  scale: 0.9, opacity: 0, duration: 1, ease: "back.out(1.7)", delay: 0.6
});

// Reveal animations for [data-reveal]
document.querySelectorAll("[data-reveal]").forEach(el => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
    },
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out"
  });
});

// === Hiring Filter Buttons ===
const filterBtns = document.querySelectorAll(".filter-btn");
const jobCards = document.querySelectorAll(".job-card");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;

    jobCards.forEach(card => {
      if (card.classList.contains(filter)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  });
});

