import { supabase, insertLead, logActivity } from "./supabase/supabase.js";

/* ================= SAFE STORAGE ================= */
const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k,v) => { try { localStorage.setItem(k,v); } catch {} };

/* ================= DOM READY ================= */
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- MOBILE NAV ---------- */
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const open = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", !open);
      mobileMenu.setAttribute("aria-modal", !open);
      document.body.style.overflow = open ? "auto" : "hidden";
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        hamburger.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-modal", "false");
        document.body.style.overflow = "auto";
      });
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => obs.observe(el));
  }

  /* ---------- SERVICES SCROLLER ---------- */
  const scroller = document.getElementById("serviceScroller");
  document.getElementById("prev")?.addEventListener("click", () =>
    scroller?.scrollBy({ left: -350, behavior: "smooth" })
  );
  document.getElementById("next")?.addEventListener("click", () =>
    scroller?.scrollBy({ left: 350, behavior: "smooth" })
  );

  /* ---------- VIDEO AUTOPLAY SAFE ---------- */
  const video = document.getElementById("cloudoraVideo");
  if (video) {
    window.addEventListener("scroll", () => {
      const r = video.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) video.play().catch(()=>{});
    });
  }

  /* ---------- THEME ---------- */
  const toggle = document.getElementById("themeToggle");
  const root = document.documentElement;
  const savedTheme = safeGet("cloudoraTheme") || "dark";
  root.dataset.theme = savedTheme;
  if (toggle) toggle.checked = savedTheme === "light";

  toggle?.addEventListener("change", () => {
    const t = toggle.checked ? "light" : "dark";
    root.dataset.theme = t;
    safeSet("cloudoraTheme", t);
  });

  /* ---------- CURRENCY ---------- */
  const currencySelect = document.getElementById("currencySelect");
  if (currencySelect) {
    const init = safeGet("cloudoraCurrency") || "USD";
    currencySelect.value = init;
    safeSet("cloudoraCurrency", init);

    currencySelect.addEventListener("change", () =>
      safeSet("cloudoraCurrency", currencySelect.value)
    );
  }

  /* ---------- FOOTER YEAR ---------- */
  document.getElementById("year")?.textContent = new Date().getFullYear();

  console.log("✅ Cloudora script loaded cleanly");
});

/* ---------- GOOGLE TRANSLATE SAFE ---------- */
window.addEventListener("load", () => {
  setTimeout(() => {
    if (!window.google) return;
    const lang = navigator.language.slice(0,2);
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = lang;
      combo.dispatchEvent(new Event("change"));
    }
  }, 1200);
});
