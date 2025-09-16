// script.js (drop-in replacement) — defensive + GSAP-safe
(() => {
  'use strict';

  /* ---------------------------
     Mobile menu toggle
     --------------------------- */
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

  /* ---------------------------
     Services scroller controls
     --------------------------- */
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

  /* ---------------------------
     Reveal on scroll (IntersectionObserver)
     --------------------------- */
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
    // fallback: reveal all
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('reveal-in'));
  }

  /* ---------------------------
     Contact submit (static-hosting friendly)
     --------------------------- */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // basic HTML5 validity check
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
          console.warn('Form submit returned non-OK:', response.status, await response.text());
        }
      } catch (err) {
        if (status) {
          status.style.display = 'inline-block';
          status.innerText = '⚠️ Network error, please try again.';
        }
        console.error('Form submit error', err);
      }
    });
  } else {
    console.info('contactForm not found in DOM — skipping form submit hookup');
  }

  /* ---------------------------
     Footer year
     --------------------------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------------------------
     Portfolio carousel (GSAP optional, fallback provided)
     --------------------------- */
  const portfolioCarousel = document.getElementById('portfolioCarousel');
  if (portfolioCarousel) {
    const slides = Array.from(portfolioCarousel.querySelectorAll('.portfolio-slide'));
    const total = Math.max(1, slides.length);
    let current = 0;
    const angle = 360 / total;

    // If GSAP is available, use 3D circular layout
    if (typeof gsap !== 'undefined') {
      slides.forEach((slide, i) => {
        gsap.set(slide, {
          rotationY: angle * i,
          transformOrigin: 'center center -600px'
        });
      });
      function rotatePortfolio() {
        gsap.to(portfolioCarousel, {
          rotationY: -current * angle,
          duration: 1,
          ease: 'power2.inOut'
        });
      }
      const nextP = document.querySelector('.portfolio-btn.next');
      const prevP = document.querySelector('.portfolio-btn.prev');
      if (nextP) nextP.addEventListener('click', () => { current = (current + 1) % total; rotatePortfolio(); });
      if (prevP) prevP.addEventListener('click', () => { current = (current - 1 + total) % total; rotatePortfolio(); });
      rotatePortfolio();
    } else {
      // fallback: simple horizontal slider (no external lib)
      portfolioCarousel.style.display = 'flex';
      portfolioCarousel.style.overflow = 'hidden';
      portfolioCarousel.style.scrollBehavior = 'smooth';
      // ensure slides don't overlap
      slides.forEach(s => s.style.minWidth = s.style.maxWidth = `${s.getBoundingClientRect().width || 320}px`);

      const nextP = document.querySelector('.portfolio-btn.next');
      const prevP = document.querySelector('.portfolio-btn.prev');

      function updateFallback() {
        const w = slides[0]?.getBoundingClientRect().width || 320;
        portfolioCarousel.scrollLeft = current * (w + 16); // 16 ~ gap
      }
      if (nextP) nextP.addEventListener('click', () => { current = Math.min(current + 1, total - 1); updateFallback(); });
      if (prevP) prevP.addEventListener('click', () => { current = Math.max(current - 1, 0); updateFallback(); });
      // recalc on resize
      window.addEventListener('resize', () => setTimeout(updateFallback, 120));
      updateFallback();
    }
  } // end portfolio

})(); // IIFE
