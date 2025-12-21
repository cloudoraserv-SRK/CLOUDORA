/* ================= SUPABASE ================= */
const supabase = window.supabase;


/* ================= CURRENCY CONFIG ================= */
export const CURRENCY_RATES = {
  INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0096,
  CAD: 0.016, AUD: 0.018, JPY: 1.78, CNY: 0.086, AED: 0.044
};

export const COUNTRY_CURRENCY = {
  IN: "INR", US: "USD", GB: "GBP", AE: "AED",
  CA: "CAD", AU: "AUD", JP: "JPY", CN: "CNY",
  FR: "EUR", DE: "EUR"
};

/* ================= CURRENCY APPLY (SST) ================= */
export function applyCurrency(currency) {
  const rate = CURRENCY_RATES[currency];
  if (!rate) return;

  document.querySelectorAll("[data-inr]").forEach(el => {
    el.textContent = Math.round(el.dataset.inr * rate) + " " + currency;
  });
}

/* ================= AUTO DETECT ================= */
export async function detectCurrency() {
  let cur = localStorage.getItem("cloudora-currency");
  if (cur) return cur;

  try {
    const geo = await fetch("https://ipapi.co/json/").then(r => r.json());
    cur = COUNTRY_CURRENCY[geo.country_code] || "INR";
  } catch {
    cur = "INR";
  }

  localStorage.setItem("cloudora-currency", cur);
  return cur;
}

export { supabase };
