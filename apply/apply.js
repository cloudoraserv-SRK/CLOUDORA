const supabaseUrl = "https://rfilnqigcadeawytwqmz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaWxucWlnY2FkZWF3eXR3cW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzE2NTIsImV4cCI6MjA3OTcwNzY1Mn0.1wtcjczrzhv2YsE7hGQL11imPxmFVS4sjxlJGvIZ26o";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const UPLOAD_BUCKET = "uploads"; // Change to your storage bucket name

// ---------- UUID Generator ----------
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
// ---------- File Upload Helper ----------
async function uploadFile(file, folder) {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const path = `${folder}/${file.name.replace(/\s/g, "_")}_${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).upload(path, file, { upsert: true });
  if (error) throw new Error("File upload failed: " + error.message);
  const { publicUrl } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
  return publicUrl;
}

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {

  const jobForm = document.getElementById('jobForm');
  const statusEl = document.getElementById("formStatus");
  const vacancySelect = document.getElementById('vacancy');
  const resumeField = document.getElementById('resumeLink');
  const resumeHelp = document.getElementById('resumeHelp');
  const portfolioField = document.getElementById('portfolioLink');
  
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
  if (vacancySelect && resumeField && resumeHelp) {
    vacancySelect.addEventListener('change', () => {
      const selected = vacancySelect.value;
      if (/Developer|Engineer|Designer|Tech/i.test(selected)) {
        resumeField.required = true;
        resumeHelp.style.display = 'block';
      } else {
        resumeField.required = false;
        resumeHelp.style.display = 'none';
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
      const tempId = uuidv4(); // Temporary ID for this applicant

      try {
        // --- 1️⃣ Formspree Submission (optional) ---
        const fsResponse = await fetch("https://formspree.io/f/mrbwawkz", {
          method: "POST",
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        // --- 2️⃣ File Uploads ---
        let resumeUrl = null;
        let portfolioUrl = null;
        const resumeFile = resumeField.files[0];
        const portfolioFile = portfolioField?.files[0];

        if (resumeFile) resumeUrl = await uploadFile(resumeFile, `leads/${tempId}`);
        if (portfolioFile) portfolioUrl = await uploadFile(portfolioFile, `leads/${tempId}`);

        // --- 3️⃣ Insert Lead into Supabase ---
        const { data: leadData, error: leadError } = await supabase.from("lead").insert([{
          id: tempId,
          full_name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          country: formData.get("country"),
          city: formData.get("city"),
          linkedin: formData.get("linkedin"),
          github: formData.get("github"),
          resume_url: resumeUrl,
          portfolio_url: portfolioUrl,
          status: "trial" // mark as trial initially
        }]).select();

        if (leadError) throw new Error("Supabase Lead insert failed: " + leadError.message);

        // --- 4️⃣ Create Trial Record ---
        const { error: trialError } = await supabase.from("trial").insert([{
          lead_id: tempId,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 7*24*60*60*1000).toISOString(), // 7 days trial
          access_level: "trial",
          status: "active"
        }]);

        if (trialError) throw new Error("Trial record creation failed: " + trialError.message);

        statusEl.classList.remove("loading");

        if (!fsResponse.ok) {
          statusEl.textContent = "❌ Formspree submission failed.";
          statusEl.style.backgroundColor = "#dc2626";
        } else {
          statusEl.textContent = `✅ Application submitted! Your temporary ID: ${tempId}`;
          statusEl.style.backgroundColor = "#16a34a";
          jobForm.reset();

          // Optionally, redirect to trial form page with tempId
          setTimeout(() => {
            window.location.href = `trial.html?tempId=${tempId}`;
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
