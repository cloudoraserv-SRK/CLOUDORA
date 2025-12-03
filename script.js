 // ---------- IMPORT CENTRAL SUPABASE CLIENT ----------
import("./supabase/supabase.js").then(({ supabase, insertLead }) => {
document.addEventListener('DOMContentLoaded', () => {
// GENIE INTRO BUTTON
document.getElementById("playGenieIntro").addEventListener("click", function () {
    alert("Genie intro video/audio will play here. (Hook your TTS or intro animation)");
});
    
  // --- Hamburger Menu ---
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile');
  const navLinks = document.querySelectorAll('.navlinks a, .mobile a');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.setAttribute('aria-modal', !isExpanded);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-modal', 'false');
        document.body.style.overflow = 'auto';
      });
    });
  }

  // --- Services Slider ---
  const scroller = document.getElementById('serviceScroller');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');

  if (scroller && prevBtn && nextBtn) {
    const scrollAmount = 350;
    prevBtn.addEventListener('click', () => {
      scroller.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      scroller.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // --- Scroll Reveal ---
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("revealed"));
  }

  // --- Legal Modals ---
  const privacyModal = document.getElementById('privacyModal');
  const termsModal = document.getElementById('termsModal');
  const openPrivacyBtn = document.getElementById('openPrivacy');
  const openTermsBtn = document.getElementById('openTerms');
  const closeButtons = document.querySelectorAll('[data-close]');

  const openModal = (modal) => {
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modal) => {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
  };

  if (openPrivacyBtn) {
    openPrivacyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(privacyModal);
    });
  }

  if (openTermsBtn) {
    openTermsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(termsModal);
    });
  }

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const parentModal = btn.closest('.modal');
      if (parentModal) closeModal(parentModal);
    });
  });

  [privacyModal, termsModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

 // CLOUDORA VIDEO AUTOPLAY ON SCROLL
window.addEventListener("scroll", function () {
    const video = document.getElementById("cloudoraVideo");
    const rect = video.getBoundingClientRect();

    if (rect.top < window.innerHeight && rect.bottom > 0) {
        video.play();
    }
});

  // --- Job Filter ---
  const filterButtons = document.querySelectorAll('.job-filters .filter-btn');
  const jobCards = document.querySelectorAll('.job-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const filter = button.getAttribute('data-filter');
      jobCards.forEach(card => {
        card.style.display = (filter === 'all' || card.classList.contains(filter)) ? 'block' : 'none';
      });
    });
  });

  const initialFilter = document.querySelector('.job-filters .active');
  if (initialFilter) initialFilter.click();

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

  const savedCurrency = localStorage.getItem("cloudoraCurrency");
  const localeCurrency = new Intl.NumberFormat().resolvedOptions().currency || 'USD';

  const initialCurrency = savedCurrency || localeCurrency;
  currencySelect.value = initialCurrency;
  localStorage.setItem("cloudoraCurrency", initialCurrency);
  updatePrices(initialCurrency);

  currencySelect.addEventListener("change", function () {
    const selectedCurrency = this.value;
    localStorage.setItem("cloudoraCurrency", selectedCurrency);
    updatePrices(selectedCurrency);
  });

  // --- Footer Year ---
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});

// ---------- Theme Toggle ----------
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  // Load saved theme
  const savedTheme = localStorage.getItem('cloudoraTheme') || 'dark';
  root.setAttribute('data-theme', savedTheme);
  toggle.checked = savedTheme === 'light';

  toggle.addEventListener('change', () => {
    const newTheme = toggle.checked ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('cloudoraTheme', newTheme);
  });
});

// ========= Supabase Client ===========
const supabaseUrl = "YOUR_URL";
const supabaseKey = "YOUR_ANON_KEY";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ========= Insert Lead ===============
async function insertLead(data) {
    const { data: inserted, error } = await supabase
        .from("leads")
        .insert([data])
        .select();

    return { inserted, error };
}

// ========= Log Activity ===============
async function logActivity(employee_id, action, details) {
    return supabase.from("activity_log").insert([
        {
            employee_id,
            action,
            details,
        }
    ]);
}

window.insertLead = insertLead;
window.logActivity = logActivity;


// --- google translate ---
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
    } else {
      setTimeout(tryTranslate, 500);
    }
  };

  tryTranslate();
}
});

window.addEventListener('load', autoTranslateByBrowserLang);
 

