import { supabase } from "../supabase/supabase.js";

console.log("✅ forms.js loaded");

const PUBLIC_API = window.CONFIG?.BACKEND || "https://cloudora-production.up.railway.app";

/* =========================
   CONTACT FORM
========================= */
const contact = document.getElementById("contactForm");

if (contact) {
  contact.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;

    const payload = {
      name: document.getElementById("name")?.value || null,
      product: document.getElementById("service")?.value || null,
      email: document.getElementById("email")?.value || null,
      phone: document.getElementById("phone")?.value || null,
      country: document.getElementById("country")?.value || "IN",
      business_name: document.getElementById("company")?.value || null,
      requirement: document.getElementById("msg")?.value || null,
      budget_range: document.getElementById("budget")?.value || null,
      timeline: document.getElementById("timeline")?.value || null,
      preferred_contact: "call",

      lead_type: "business",
      source: "home_form",
      department: "sales",
      status: "new"
    };

    const res = await fetch(`${PUBLIC_API}/api/public/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      console.error("❌ Lead pipeline error:", json);
      alert("❌ Form submit failed");
      return;
    }

    alert("✅ Thanks! We will contact you soon.");
    f.reset();
  });
}

/* =========================
   TESTIMONIAL FORM
========================= */
const tForm = document.getElementById("testimonialForm");

if (tForm) {
  tForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      author: document.getElementById("reviewAuthor")?.value || "Anonymous",
      text: document.getElementById("reviewText")?.value || "",
      stars: parseInt(document.getElementById("reviewStars")?.value || "5"),
      genie: false
    };

    const { error } = await supabase.from("testimonials").insert([payload]);

    if (error) {
      console.error("❌ Testimonial error:", error);
      alert("❌ Could not submit testimonial");
      return;
    }

    alert("✅ Thanks! Testimonial submitted for review.");
    e.target.reset();
  });
}

/* =========================
   FOOTER YEAR
========================= */
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
