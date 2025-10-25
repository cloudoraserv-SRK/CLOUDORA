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

    // --- Services Scroller Logic ---
    const scroller = document.getElementById('serviceScroller');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    if (scroller && prevBtn && nextBtn) {
        const scrollAmount = 350; // Adjust as needed

        prevBtn.addEventListener('click', () => {
            scroller.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        nextBtn.addEventListener('click', () => {
            scroller.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
    }

    // --- Scroll Reveal Animation with Intersection Observer ---
    const revealElements = document.querySelectorAll('[data-reveal]');

    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1, // Element is revealed when 10% visible
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target); // Stop observing once revealed
                }
            });
        }, observerOptions);

        revealElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => {
            el.classList.add('revealed');
        });
    }

    // --- Legal Modals Logic ---
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
            if (parentModal) {
                closeModal(parentModal);
            }
        });
    });

    // Close modals by clicking outside
    [privacyModal, termsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        }
    });

    // --- Job Filter Logic ---
    const filterButtons = document.querySelectorAll('.job-filters .filter-btn');
    const jobCards = document.querySelectorAll('.job-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');

            jobCards.forEach(card => {
                if (filter === 'all' || card.classList.contains(filter)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Set initial filter
    const initialFilter = document.querySelector('.job-filters .active');
    if (initialFilter) {
      initialFilter.click();
    }

    // --- Set current year in footer ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});

document.querySelectorAll('.locale-switcher select').forEach(select => {
  select.addEventListener('blur', () => {
    document.body.style.overflowY = 'auto';
  });
});

<script>
document.addEventListener("DOMContentLoaded", function () {
  const languageSelect = document.getElementById("languageSelect");
  const currencySelect = document.getElementById("currencySelect");

  // Load saved preferences
  const savedLang = localStorage.getItem("cloudoraLang");
  const savedCurrency = localStorage.getItem("cloudoraCurrency");

  if (savedLang) languageSelect.value = savedLang;
  if (savedCurrency) currencySelect.value = savedCurrency;

  // Handle language change
  languageSelect.addEventListener("change", function () {
    const selectedLang = this.value;
    localStorage.setItem("cloudoraLang", selectedLang);

    // Placeholder: You can load translated content here
    alert("Language switched to: " + selectedLang);
    // Optionally reload or fetch translated content
  });

  // Handle currency change
  currencySelect.addEventListener("change", function () {
    const selectedCurrency = this.value;
    localStorage.setItem("cloudoraCurrency", selectedCurrency);

    // Placeholder: You can update pricing display here
    alert("Currency switched to: " + selectedCurrency);
    // Optionally fetch exchange rates and update prices
  });
});
</script>
