// script.js
// Cloudora — Digital Innovation Studio
// JS for animations, interactivity, and effects

// Ensure the DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {

  // Initialize GSAP for animations
  gsap.registerPlugin(ScrollTrigger);

  // Set the current year in the footer
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- 1. Hero Title Animation ---
  const heroTitle = document.querySelector('.title');
  if (heroTitle) {
    gsap.from(heroTitle, {
      opacity: 0,
      y: 60,
      duration: 1.5,
      ease: 'power3.out',
      delay: 0.7
    });
  }

  // --- 2. Service Slider Functionality ---
  const scroller = document.getElementById('serviceScroller');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');

  if (scroller && prevBtn && nextBtn) {
    // Add event listeners for navigation buttons
    nextBtn.addEventListener('click', () => {
      scroller.scrollBy({
        left: scroller.clientWidth * 0.8,
        behavior: 'smooth'
      });
    });

    prevBtn.addEventListener('click', () => {
      scroller.scrollBy({
        left: -scroller.clientWidth * 0.8,
        behavior: 'smooth'
      });
    });

    // Animate cards on scroll
    gsap.utils.toArray('.scroller .card').forEach((card, i) => {
      gsap.from(card, {
        opacity: 0,
        x: 100,
        rotation: 3,
        scale: 0.95,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          end: 'bottom 10%',
          toggleActions: 'play none none none',
          once: true
        }
      });
    });
  }

  // --- 3. Scroll Reveal Animations (for sections) ---
  const revealElements = document.querySelectorAll('[data-reveal]');

  // Use a slightly different animation for these
  revealElements.forEach(el => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%', // Adjust trigger point
        toggleActions: 'play none none none',
        once: true
      }
    });
  });

  // --- 4. Mobile Menu Toggle ---
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true' || false;
      hamburger.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('active');
      });
    });
  }

  // --- 5. Job Filter Tabs ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const jobCards = document.querySelectorAll('.job-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      // Activate the clicked button
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      // Show/hide job cards with a fade effect
      jobCards.forEach(card => {
        if (card.classList.contains(filter)) {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            display: 'flex',
            duration: 0.5,
            ease: 'power2.out'
          });
        } else {
          gsap.to(card, {
            opacity: 0,
            y: 20,
            display: 'none',
            duration: 0.5,
            ease: 'power2.out'
          });
        }
      });
    });
  });

  // Initially hide all but the first category
  const initialFilter = document.querySelector('.job-filters .active').dataset.filter;
  jobCards.forEach(card => {
    if (!card.classList.contains(initialFilter)) {
      gsap.set(card, { display: 'none', opacity: 0 });
    }
  });

  // --- 6. Modal Functionality ---
  const privacyModal = document.getElementById('privacyModal');
  const termsModal = document.getElementById('termsModal');
  const openPrivacyBtn = document.getElementById('openPrivacy');
  const openTermsBtn = document.getElementById('openTerms');
  const closeBtns = document.querySelectorAll('[data-close]');

  // Open modals
  openPrivacyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    privacyModal.setAttribute('aria-hidden', 'false');
  });

  openTermsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    termsModal.setAttribute('aria-hidden', 'false');
  });

  // Close modals
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').setAttribute('aria-hidden', 'true');
    });
  });

  // Close modals when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.setAttribute('aria-hidden', 'true');
    }
  });

  // --- 7. Form Submission Handling ---
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formStatus.style.display = 'block';
      formStatus.textContent = 'Sending...';

      const formData = new FormData(contactForm);
      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          formStatus.textContent = '🚀 Sent! We will contact you soon.';
          formStatus.style.backgroundColor = '#00ffaa';
          contactForm.reset();
        } else {
          formStatus.textContent = '❌ Failed to send. Please try again.';
          formStatus.style.backgroundColor = '#aa00ff';
        }
      } catch (error) {
        formStatus.textContent = '❌ Error. Check your connection.';
        formStatus.style.backgroundColor = '#aa00ff';
      }
      
      // Hide status message after a few seconds
      setTimeout(() => {
        gsap.to(formStatus, {
          opacity: 0,
          duration: 1,
          onComplete: () => {
            formStatus.style.display = 'none';
            formStatus.style.opacity = 1;
          }
        });
      }, 5000);
    });
  }
});
