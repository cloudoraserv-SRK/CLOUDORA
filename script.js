// Mobile menu toggle
const burger = document.querySelector('.hamburger');
const mobile = document.getElementById('mobileMenu');
if (burger) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    const open = burger.classList.contains('active');
    burger.setAttribute('aria-expanded', open);
    if (mobile) mobile.style.display = open ? 'block' : 'none';
  });
}

// Close mobile on link click
mobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger?.classList.remove('active');
  burger?.setAttribute('aria-expanded', false);
  if (mobile) mobile.style.display = 'none';
}));

// Services scroller controls
const scroller = document.getElementById('serviceScroller');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
function scrollByCard(dir = 1){
  const card = scroller?.querySelector('.card');
  const w = card ? card.getBoundingClientRect().width + 18 : 320;
  scroller?.scrollBy({ left: dir * w, behavior: 'smooth' });
}
nextBtn?.addEventListener('click', () => scrollByCard(1));
prevBtn?.addEventListener('click', () => scrollByCard(-1));

// Horizontal wheel support
scroller?.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)){
    e.preventDefault();
    scroller.scrollLeft += e.deltaY;
  }
}, { passive:false });

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('reveal-in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: .2 });

document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

// Fake contact submit (static hosting friendly)
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
document.getElementById('send')?.addEventListener('click', () => {
  if(!form?.checkValidity()){ form?.reportValidity(); return; }
  if (status){
    status.textContent = "Thanks! We'll reach out within 24h.";
    status.style.display = 'inline-block';
  }
  form?.reset();
});

// Footer year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

const portfolioCarousel = document.getElementById("portfolioCarousel");
const portfolioSlides = portfolioCarousel.querySelectorAll(".portfolio-slide");
const totalPortfolioSlides = portfolioSlides.length;

let currentPortfolio = 0;
const portfolioAngle = 360 / totalPortfolioSlides;

// Arrange slides in circle
portfolioSlides.forEach((slide, i) => {
  gsap.set(slide, {
    rotationY: portfolioAngle * i,
    transformOrigin: "center center -600px"
  });
});

function rotatePortfolio() {
  gsap.to(portfolioCarousel, {
    rotationY: -currentPortfolio * portfolioAngle,
    duration: 1,
    ease: "power2.inOut"
  });
}

document.querySelector(".portfolio-btn.next").addEventListener("click", () => {
  currentPortfolio = (currentPortfolio + 1) % totalPortfolioSlides;
  rotatePortfolio();
});

document.querySelector(".portfolio-btn.prev").addEventListener("click", () => {
  currentPortfolio = (currentPortfolio - 1 + totalPortfolioSlides) % totalPortfolioSlides;
  rotatePortfolio();
});

// Initialize
rotatePortfolio();
