import { applyCurrency, detectCurrency } from "./core.js";

document.addEventListener("DOMContentLoaded", async () => {

  /* ===== HAMBURGER ===== */
  const hamburger = document.querySelector(".hamburger");
  const mobile = document.querySelector(".mobile");

  hamburger?.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    mobile.classList.toggle("open");
    document.body.style.overflow = mobile.classList.contains("open") ? "hidden" : "auto";
  });

  mobile?.querySelectorAll("a").forEach(a =>
    a.onclick = () => {
      hamburger.classList.remove("active");
      mobile.classList.remove("open");
      document.body.style.overflow = "auto";
    }
  );

  /* ===== THEME ===== */
  const toggle = document.getElementById("themeToggle");
  const saved = localStorage.getItem("cloudora-theme") || "dark";
  document.documentElement.dataset.theme = saved;
  if (toggle) {
    toggle.checked = saved === "light";
    toggle.onchange = () => {
      const t = toggle.checked ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      localStorage.setItem("cloudora-theme", t);
    };
  }

  /* ===== COOKIE ===== */
  const cookie = document.getElementById("cookieConsent");
  if (cookie && !localStorage.getItem("cookieAccepted")) {
    cookie.style.display = "block";
    cookie.querySelector("button").onclick = () => {
      localStorage.setItem("cookieAccepted", "yes");
      cookie.remove();
    };
  }

  /* ===== GOOGLE TRANSLATE AUTO ===== */
  setTimeout(() => {
    const map = { hi:"hi", fr:"fr", de:"de", ar:"ar", ja:"ja", zh:"zh-CN", ta:"ta", bn:"bn" };
    const lang = map[navigator.language.slice(0,2)];
    const select = document.querySelector(".goog-te-combo");
    if (select && lang) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    }
  }, 1200);

  /* ===== CURRENCY ===== */
  const select = document.getElementById("currencySelect");
  const currency = await detectCurrency();

  if (select) {
    select.value = currency;
    applyCurrency(currency);
    select.onchange = () => {
      localStorage.setItem("cloudora-currency", select.value);
      applyCurrency(select.value);
    };
  }
});
