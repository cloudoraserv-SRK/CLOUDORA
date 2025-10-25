document.addEventListener('DOMContentLoaded', () => {
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

        document.querySelectorAll('.new-price[data-inr]').forEach(el => {
          const basePrice = parseFloat(el.getAttribute('data-inr'));
          const converted = (basePrice * rate).toFixed(2);
          const formatted = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: selectedCurrency
          }).format(converted);
          el.textContent = formatted;
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
