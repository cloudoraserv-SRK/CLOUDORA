// script.js — Clean & Modular
document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------------
     Mobile menu toggle
     --------------------------- */
  const burger = document.querySelector('.hamburger');
  const mobile = document.getElementById('mobileMenu');
  if (burger && mobile) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      mobile.classList.toggle('open'); // use CSS class instead of inline style
    });
  }

  /* ---------------------------
     Services scroller
     --------------------------- */
  const scroller = document.getElementById('serviceScroller');
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');

  function scrollByCard(dir = 1) {
    if (!scroller) return;
    const card = scroller.querySelector('.card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const gap = 18;
    scroller.scrollBy({ left: dir * (rect.width + gap), behavior: 'smooth' });
  }

  if (nextBtn) nextBtn.addEventListener('click', () => scrollByCard(1));
  if (prevBtn) prevBtn.addEventListener('click', () => scrollByCard(-1));

  /* ---------------------------
     Reveal on scroll
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
  }

  /* ---------------------------
     Contact form (Formspree-friendly)
     --------------------------- */
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
        const res = await fetch(form.action, {
          method: form.method || 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (status) {
          status.textContent = res.ok
            ? "✅ Thanks! We’ll contact you soon."
            : "⚠️ Oops! Something went wrong.";
        }
        if (res.ok) form.reset();
      } catch (err) {
        if (status) status.textContent = "⚠️ Network error, please try again.";
      }
    });
  }

  /* ---------------------------
     Portfolio carousel (GSAP 3D)
     --------------------------- */
  const portfolioCarousel = document.getElementById("portfolioCarousel");
  if (portfolioCarousel && typeof gsap !== "undefined") {
    const slides = portfolioCarousel.querySelectorAll(".portfolio-slide");
    const total = slides.length;
    if (total > 0) {
      let current = 0;
      const angle = 360 / total;
      const radius = 500;

      slides.forEach((slide, i) => {
        gsap.set(slide, {
          rotationY: i * angle,
          transformOrigin: `center center -${radius}px`,
          backfaceVisibility: "hidden"
        });
      });

      function rotate() {
        gsap.to(portfolioCarousel, {
          rotationY: -current * angle,
          duration: 1,
          ease: "power2.inOut"
        });
      }

      const next = document.querySelector(".portfolio-btn.next");
      const prev = document.querySelector(".portfolio-btn.prev");

      if (next) next.addEventListener("click", () => {
        current = (current + 1) % total;
        rotate();
      });
      if (prev) prev.addEventListener("click", () => {
        current = (current - 1 + total) % total;
        rotate();
      });

      rotate();
    }
  }

  /* ---------------------------
     Footer year
     --------------------------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

});
