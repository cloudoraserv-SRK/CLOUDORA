const supabaseUrl = "https://rfilnqigcadeawytwqmz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaWxucWlnY2FkZWF3eXR3cW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzE2NTIsImV4cCI6MjA3OTcwNzY1Mn0.1wtcjczrzhv2YsE7hGQL11imPxmFVS4sjxlJGvIZ26o";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {

  // --- Hamburger Menu Logic ---
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile');
  const navLinks = document.querySelectorAll('.navlinks a, .mobile a');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.setAttribute('aria-modal', !isExpanded);
      document.body.style.overflow = isExpanded ? 'auto' : 'hidden';
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-modal', 'false');
        document.body.style.overflow = 'auto';
      });
    });
  }

  // --- Footer Year ---
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- Currency Switcher ---
  const currencySelect = document.getElementById("currencySelect");

  function updatePrices(selectedCurrency) {
    fetch(`https://api.exchangerate-api.com/v4/latest/INR`)
      .then(res => res.json())
      .then(data => {
        const rate = data.rates[selectedCurrency];
        if (!rate) return;

        document.querySelectorAll('[data-inr]').forEach(el => {
          const basePrice = parseFloat(el.getAttribute('data-inr'));
          if (isNaN(basePrice)) return;

          const converted = (basePrice * rate).toFixed(0);
          const formatted = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: selectedCurrency
          }).format(converted);

          if (el.tagName.toLowerCase() === 'option' && el.parentElement.id === 'budget') {
            if (basePrice === 1000) {
              el.textContent = `${formatted} – ${new Intl.NumberFormat(undefined, { style: 'currency', currency: selectedCurrency }).format((5000 * rate).toFixed(0))}`;
            } else if (basePrice === 5000) {
              el.textContent = `${formatted} – ${new Intl.NumberFormat(undefined, { style: 'currency', currency: selectedCurrency }).format((10000 * rate).toFixed(0))}`;
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
});

// --- Mobile Nav Toggle ---
const hamburgerBtn = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
if (hamburgerBtn && mobileNav) {
  hamburgerBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('active');
  });
}

// --- Resume Requirement Logic ---
const vacancySelect = document.getElementById('vacancy');
const resumeField = document.getElementById('resumeLink');
const resumeHelp = document.getElementById('resumeHelp');
const jobForm = document.getElementById('jobForm');

if (vacancySelect && resumeField && resumeHelp) {
  vacancySelect.addEventListener('change', function() {
    const selected = vacancySelect.value;
    if (
      selected.includes('Developer') ||
      selected.includes('Engineer') ||
      selected.includes('Designer') ||
      selected.includes('Tech')
    ) {
      resumeField.required = true;
      resumeHelp.style.display = 'block';
    } else {
      resumeField.required = false;
      resumeHelp.style.display = 'none';
    }
  });

  jobForm.addEventListener('submit', function(e) {
    if (resumeField.required && !resumeField.value) {
      e.preventDefault();
      resumeHelp.style.display = 'block';
      resumeField.focus();
    }
  });
}

// --- Supabase Integration ---
const statusEl = document.getElementById("formStatus");

if (jobForm) {
  jobForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    statusEl.style.display = "inline-block";
    statusEl.textContent = "Submitting...";
    statusEl.classList.add("loading");

    const formData = new FormData(this);

    try {
      // --- 1. Submit to Formspree ---
      const response = await fetch("https://formspree.io/f/xnnykrzo", {
        method: "POST",
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      // --- 2. Supabase Insert ---
      const { data: leadData, error: leadError } = await supabase
        .from("lead")
        .insert([{
          full_name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          country: formData.get("country"),
          city: formData.get("city"),
          linkedin: formData.get("linkedin"),
          github: formData.get("github")
        }])
        .select();

      if (leadError) {
        statusEl.classList.remove("loading");
        statusEl.textContent = "❌ Lead insert failed: " + leadError.message;
        statusEl.style.backgroundColor = "#dc2626";
        return;
      }

      const leadId = leadData?.[0]?.id;
      if (!leadId) {
        statusEl.classList.remove("loading");
        statusEl.textContent = "❌ Lead ID missing after insert.";
        statusEl.style.backgroundColor = "#dc2626";
        return;
      }

      const { error: appError } = await supabase
        .from("application")
        .insert([{
          lead_id: leadId,
          form_type: "final",
          role_category: formData.get("vacancy"),
          preferred_language: formData.get("preferredLanguage"),
          work_mode: formData.get("workMode"),
          engagement_type: formData.get("availability"),
          country: formData.get("country"),
          work_country: formData.get("workCountry"),
          timezone: formData.get("shift"),
          preferred_schedule: formData.get("workMode"),
          skills: formData.get("skills"),
          experience: formData.get("experience"),
          resume_url: formData.get("resumeLink"),
          portfolio_url: formData.get("github"),
          notes: formData.get("message"),
          status: "submitted"
        }]);

      statusEl.classList.remove("loading");

      if (appError) {
        statusEl.textContent = "❌ Application insert failed: " + appError.message;
        statusEl.style.backgroundColor = "#dc2626";
      } else if (!response.ok) {
        statusEl.textContent = "❌ Formspree submission failed.";
        statusEl.style.backgroundColor = "#dc2626";
      } else {
        statusEl.textContent = "✅ Thank you! Your application has been submitted. Redirecting...";
        statusEl.style.backgroundColor = "#16a34a";
        jobForm.reset();
        setTimeout(() => {
          window.location.href = "./policy/privacy.html";
        }, 2000);
      }

    } catch (err) {
      statusEl.classList.remove("loading");
      statusEl.textContent = "❌ Error: " + err.message;
      statusEl.style.backgroundColor = "#dc2626";
    }
  });
}

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
