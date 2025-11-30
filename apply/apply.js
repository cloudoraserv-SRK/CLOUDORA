import { supabase, uuidv4, uploadFile, insertApplication, insertLead, insertTrial } from "/supabase/supabase.js";

// --- DOM Ready ---
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM references ---
  const jobForm = document.getElementById("jobForm");
  const statusEl = document.getElementById("formStatus");
  const vacancySelect = document.getElementById("vacancy");
  const resumeField = document.getElementById("resumeLink");
  const resumeHelp = document.getElementById("resumeHelp");
  const portfolioField = document.getElementById("portfolioLink");

  // --- Hamburger Menu Logic ---
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile");
  const navLinks = document.querySelectorAll(".navlinks a, .mobile a");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", !isExpanded);
      mobileMenu.setAttribute("aria-modal", !isExpanded);
      document.body.style.overflow = isExpanded ? "auto" : "hidden";
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-modal", "false");
        document.body.style.overflow = "auto";
      });
    });
  }

  // --- Footer Year ---
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- Currency Switcher ---
  const currencySelect = document.getElementById("currencySelect");

  function updatePrices(selectedCurrency) {
    fetch(`https://api.exchangerate-api.com/v4/latest/INR`)
      .then((res) => res.json())
      .then((data) => {
        const rate = data.rates[selectedCurrency];
        if (!rate) return;

        document.querySelectorAll("[data-inr]").forEach((el) => {
          const basePrice = parseFloat(el.getAttribute("data-inr"));
          if (isNaN(basePrice)) return;

          const converted = (basePrice * rate).toFixed(0);
          const formatted = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: selectedCurrency,
          }).format(converted);

          if (el.tagName.toLowerCase() === "option" && el.parentElement.id === "budget") {
            if (basePrice === 1000) {
              el.textContent = `${formatted} – ${new Intl.NumberFormat(undefined, { style: "currency", currency: selectedCurrency }).format((5000 * rate).toFixed(0))}`;
            } else if (basePrice === 5000) {
              el.textContent = `${formatted} – ${new Intl.NumberFormat(undefined, { style: "currency", currency: selectedCurrency }).format((10000 * rate).toFixed(0))}`;
            } else if (basePrice === 10000) {
              el.textContent = `${formatted}+`;
            }
          } else {
            el.textContent = formatted;
          }
        });
      });
  }

  const savedCurrency = localStorage.getItem("cloudoraCurrency") || "INR";
  if (currencySelect) {
    currencySelect.value = savedCurrency;
    updatePrices(savedCurrency);

    currencySelect.addEventListener("change", function () {
      const selectedCurrency = this.value;
      localStorage.setItem("cloudoraCurrency", selectedCurrency);
      updatePrices(selectedCurrency);
    });
  }

  // --- Vacancy logic ---
  if (vacancySelect && resumeField && resumeHelp) {
    vacancySelect.addEventListener("change", () => {
      const selected = vacancySelect.value;
      if (/Developer|Engineer|Designer|Tech/i.test(selected)) {
        resumeField.required = true;
        resumeHelp.style.display = "block";
      } else {
        resumeField.required = false;
        resumeHelp.style.display = "none";
      }
    });
  }

  // --- Job Form Submission ---
  if (jobForm) {
    jobForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      statusEl.style.display = "inline-block";
      statusEl.textContent = "Submitting...";
      statusEl.style.backgroundColor = "";
      statusEl.classList.add("loading");

      const formData = new FormData(jobForm);
      const tempId = uuidv4();

      try {
            // --- 2️⃣ Resume / Portfolio Link ---
  const resumeUrl = resumeField?.value || null;

        // 1️⃣ Insert into lead
const { error: leadError, data: leadData } = await insertLead({
  full_name: formData.get("name"),
  email: formData.get("email"),
  phone: formData.get("phone"),
  country: formData.get("country"),
});
if (leadError) throw new Error("Supabase Lead insert failed: " + leadError.message);

// Get the lead_id from the inserted lead
const leadId = leadData[0].id;

// 2️⃣ Insert into application
const { error: appError } = await insertApplication({
  lead_id: leadId,
  city: formData.get("city"),
  role_category: formData.get("vacancy"),
  resume_url: resumeField?.value || null,
  status: "trial",
  skills: formData.get("skills"),
  experience: formData.get("experience"),
  availability: formData.get("availability"),
  work_mode: formData.get("work_mode"),
  engagement_type: formData.get("engagement_type"),
  schedule: formData.get("schedule"),
  notes: formData.get("notes"),
});
if (appError) throw new Error("Supabase Application insert failed: " + appError.message);
        
        
        // --- 4️⃣ Create Trial Record ---
        const { error: trialError } = await insertTrial({
          lead_id: tempId,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          access_level: "trial",
          status: "active",
        });
        if (trialError) throw new Error("Trial record creation failed: " + trialError.message);

        // --- Success ---
        statusEl.classList.remove("loading");
        if (!fsResponse.ok) {
          statusEl.textContent = "❌ Formspree submission failed.";
          statusEl.style.backgroundColor = "#dc2626";
        } else {
          statusEl.textContent = `✅ Application submitted! Your temporary ID: ${tempId}`;
          statusEl.style.backgroundColor = "#16a34a";
          jobForm.reset();

          setTimeout(() => {
            window.location.href = `../apply/trial/application.html?tempId=${tempId}`;
          }, 2000);
        }
      } catch (err) {
        statusEl.classList.remove("loading");
        statusEl.textContent = "❌ Error: " + err.message;
        statusEl.style.backgroundColor = "#dc2626";
      }
    });
  }
});


// --- Google Translate ---
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'en,hi,fr,es,de,zh-CN,ar,ja,ru,pt,bn,ta,mr',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE
  }, 'google_translate_element');
}

function autoTranslateByBrowserLang() {
  const langMap = { hi:'hi', fr:'fr', es:'es', de:'de', zh:'zh-CN', ar:'ar', ja:'ja', ru:'ru', pt:'pt', bn:'bn', ta:'ta', mr:'mr' };
  const browserLang = navigator.language.slice(0, 2);
  const targetLang = langMap[browserLang];

  const tryTranslate = () => {
    const select = document.querySelector('.goog-te-combo');
    if (select && targetLang) {
      select.value = targetLang;
      select.dispatchEvent(new Event('change'));
      localStorage.setItem("cloudoraLang", targetLang);
    } else {
      setTimeout(tryTranslate, 500);
    }
  };
  tryTranslate();
}

window.addEventListener('load', autoTranslateByBrowserLang);
