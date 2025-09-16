// script.js — Defensive + GSAP-safe
(() => {
  'use strict';

  /* ---------------------------
     Mobile menu toggle
     --------------------------- */
  try {
    const burger = document.querySelector('.hamburger');
    const mobile = document.getElementById('mobileMenu');

    if (burger && mobile) {
      burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        const open = burger.classList.contains('active');
        burger.setAttribute('aria-expanded', String(open));
        mobile.style.display = open ? 'block' : 'none';
      });

      // Close mobile on link click
      mobile.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          burger.classList.remove('active');
          burger.setAttribute('aria-expanded', 'false');
          mobile.style.display = 'none';
        });
      });
    }
  } catch (err) {
    console.error('Mobile menu error:', err);
  }

  /* ---------------------------
     Services scroller controls
     --------------------------- */
  try {
    const scroller = document.getElementById('serviceScroller');
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');

    function scrollByCard(dir = 1) {
      if (!scroller) return;
      const card = scroller.querySelector('.card');
      const gap = 18;
      let w = 320;
      if (card) {
        const rect = card.getBoundingClientRect();
        w = rect.width + gap;
      }
      scroller.scrollBy({ left: dir * w, behavior: 'smooth' });
    }

    if (nextBtn) nextBtn.addEventListener('click', () => scrollByCard(1));
    if (prevBtn) prevBtn.addEventListener('click', () => scrollByCard(-1));

    if (scroller) {
      scroller.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          scroller.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }
  } catch (err) {
    console.error('Services scroller error:', err);
  }

  /* ---------------------------
     Reveal on scroll (IntersectionObserver)
     --------------------------- */
  try {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
    } else {
      document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('reveal-in'));
    }
  } catch (err) {
    console.error('Reveal observer error:', err);
  }

  /* ---------------------------
     Contact form submit (Formspree / static hosting)
     --------------------------- */
  try {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const data = new FormData(form);
        try {
          const response = await fetch(form.action, {
            method: form.method || 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
          });
          if (response.ok) {
            if (status) {
              status.style.display = 'inline-block';
              status.innerText = '✅ Thanks! We’ll contact you soon.';
            }
            form.reset();
          } else {
            if (status) {
              status.style.display = 'inline-block';
              status.innerText = '⚠️ Oops! Something went wrong.';
            }
            console.warn('Form submit error:', response.status, await response.text());
          }
        } catch (err) {
          if (status) {
            status.style.display = 'inline-block';
            status.innerText = '⚠️ Network error, please try again.';
          }
          console.error('Form submit network error:', err);
        }
      });
    }
  } catch (err) {
    console.error('Contact form error:', err);
  }

  /* ---------------------------
     Footer year
     --------------------------- */
  try {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  } catch (err) {
    console.error('Footer year error:', err);
  }

  /* ---------------------------
     Portfolio carousel (GSAP 3D)
     --------------------------- */
  try {
    const portfolioCarousel = document.getElementById("portfolioCarousel");
    if (portfolioCarousel && typeof gsap !== "undefined") {
      const portfolioSlides = portfolioCarousel.querySelectorAll(".portfolio-slide");
      const totalPortfolioSlides = portfolioSlides.length;

      if (totalPortfolioSlides > 0) {
        let currentPortfolio = 0;
        const portfolioAngle = 360 / totalPortfolioSlides;
        const radius = 500;

        // Arrange slides evenly
        portfolioSlides.forEach((slide, i) => {
          gsap.set(slide, {
            rotationY: i * portfolioAngle,
            transformOrigin: `center center -${radius}px`,
            backfaceVisibility: "hidden"
          });
        });

        function rotatePortfolio() {
          gsap.to(portfolioCarousel, {
            rotationY: -currentPortfolio * portfolioAngle,
            duration: 1,
            ease: "power2.inOut"
          });
        }

        const nextBtn = document.querySelector(".portfolio-btn.next");
        const prevBtn = document.querySelector(".portfolio-btn.prev");

        if (nextBtn) {
          nextBtn.addEventListener("click", () => {
            currentPortfolio = (currentPortfolio + 1) % totalPortfolioSlides;
            rotatePortfolio();
          });
        }
        if (prevBtn) {
          prevBtn.addEventListener("click", () => {
            currentPortfolio = (currentPortfolio - 1 + totalPortfolioSlides) % totalPortfolioSlides;
            rotatePortfolio();
          });
        }

        // Init
        rotatePortfolio();
      }
    } else {
      console.info("Portfolio carousel not found or GSAP missing — skipped.");
    }
  } catch (err) {
    console.error('Portfolio carousel error:', err);
  }
})();
