import { insertLead } from "./supabase/supabase.js";

/* ========== SAFE STORAGE ========== */
const sGet = k => { try { return localStorage.getItem(k); } catch { return null } };
const sSet = (k,v) => { try { localStorage.setItem(k,v); } catch {} };

/* ========== DOM READY ========== */
document.addEventListener("DOMContentLoaded", () => {

  /* ===== MOBILE NAV ===== */
  const hamburger = document.querySelector(".hamburger");
  const mobile = document.getElementById("mobileMenu");

  if (hamburger && mobile) {
    hamburger.onclick = () => {
      const open = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", !open);
      mobile.setAttribute("aria-modal", !open);
      document.body.style.overflow = open ? "auto" : "hidden";
    };

    mobile.querySelectorAll("a").forEach(a =>
      a.onclick = () => {
        hamburger.setAttribute("aria-expanded", "false");
        mobile.setAttribute("aria-modal", "false");
        document.body.style.overflow = "auto";
      }
    );
  }

  /* ===== SCROLL REVEAL ===== */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("revealed"));
  }

  /* ===== SERVICES SCROLLER ===== */
  const scroller = document.getElementById("serviceScroller");
  document.getElementById("prev")?.onclick = () =>
    scroller?.scrollBy({ left: -350, behavior: "smooth" });
  document.getElementById("next")?.onclick = () =>
    scroller?.scrollBy({ left: 350, behavior: "smooth" });

  /* ===== PORTFOLIO FILTER ===== */
  document.querySelectorAll("#portfolio .filter-btn").forEach(btn => {
    btn.onclick = () => {
      const f = btn.dataset.filter;
      btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll("#portfolio .card").forEach(card => {
        card.style.display = f === "all" || card.dataset.category?.includes(f) ? "block" : "none";
      });
    };
  });

  /* ===== HIRING FILTER ===== */
  document.querySelectorAll("#hiring .filter-btn").forEach(btn => {
    btn.onclick = () => {
      const f = btn.dataset.filter;
      btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll("#hiring .job-card").forEach(card => {
        card.style.display = card.classList.contains(f) ? "block" : "none";
      });
    };
  });

  /* ===== VIDEO AUTOPLAY ===== */
  const video = document.getElementById("cloudoraVideo");
  if (video) {
    window.addEventListener("scroll", () => {
      const r = video.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) video.play().catch(()=>{});
    });
  }

  /* ===== MODALS ===== */
  document.querySelectorAll("[data-close]").forEach(btn =>
    btn.onclick = () => btn.closest(".modal").setAttribute("aria-hidden","true")
  );
  document.getElementById("openPrivacy")?.onclick = e => {
    e.preventDefault(); document.getElementById("privacyModal").setAttribute("aria-hidden","false");
  };
  document.getElementById("openTerms")?.onclick = e => {
    e.preventDefault(); document.getElementById("termsModal").setAttribute("aria-hidden","false");
  };

  /* ===== THEME ===== */
  const toggle = document.getElementById("themeToggle");
  const theme = sGet("cloudoraTheme") || "dark";
  document.documentElement.dataset.theme = theme;
  if (toggle) toggle.checked = theme === "light";
  toggle?.addEventListener("change", () => {
    const t = toggle.checked ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    sSet("cloudoraTheme", t);
  });

  /* ===== CONTACT FORM + AUTO ROUTING ===== */
  const form = document.getElementById("contactForm");
  if (form) {
    form.onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const service = (fd.get("service")||"").toLowerCase();

      let lead_type = "general";
      if (service.includes("job")) lead_type = "job";
      else if (service.includes("marketing") || service.includes("development")) lead_type = "business";

      const payload = Object.fromEntries(fd.entries());
      payload.lead_type = lead_type;
      payload.source = "website";
      payload.page = "index";

      try {
        await insertLead(payload);
        alert("✅ Submitted successfully");
        form.reset();
      } catch {
        alert("❌ Submission failed");
      }
    };
  }

  console.log("✅ Cloudora index fully wired");
});

/* ===== GOOGLE TRANSLATE AUTO ===== */
window.addEventListener("load", () => {
  setTimeout(() => {
    const map = { hi:'hi',fr:'fr',es:'es',de:'de',zh:'zh-CN',ar:'ar',ja:'ja',ru:'ru',pt:'pt',bn:'bn',ta:'ta',mr:'mr' };
    const lang = map[navigator.language.slice(0,2)];
    const sel = document.querySelector(".goog-te-combo");
    if (lang && sel) {
      sel.value = lang;
      sel.dispatchEvent(new Event("change"));
    }
  }, 1200);
});
