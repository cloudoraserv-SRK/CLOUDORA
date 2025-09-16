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
  // GSAP Portfolio 3D Carousel
const portfolioCarousel = document.getElementById("portfolioCarousel");
const portfolioSlides = portfolioCarousel.querySelectorAll(".portfolio-slide");
const totalPortfolioSlides = portfolioSlides.length;

let currentPortfolio = 0;
const radius = 600; // how far back slides sit
const portfolioAngle = 360 / totalPortfolioSlides;

// Arrange slides in circle
portfolioSlides.forEach((slide, i) => {
  gsap.set(slide, {
    rotationY: portfolioAngle * i,
    transformOrigin: `center center -${radius}px`
  });
});

// Rotate function
function rotatePortfolio() {
  gsap.to(portfolioCarousel, {
    rotationY: -currentPortfolio * portfolioAngle,
    duration: 1.2,
    ease: "power2.inOut"
  });
}

// Buttons
document.querySelector(".portfolio-btn.next").addEventListener("click", () => {
  currentPortfolio = (currentPortfolio + 1) % totalPortfolioSlides;
  rotatePortfolio();
});

document.querySelector(".portfolio-btn.prev").addEventListener("click", () => {
  currentPortfolio = (currentPortfolio - 1 + totalPortfolioSlides) % totalPortfolioSlides;
  rotatePortfolio();
});

// Init
rotatePortfolio();

