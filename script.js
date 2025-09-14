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

// Legal modals
const privacyModal = document.getElementById('privacyModal');
const termsModal = document.getElementById('termsModal');
const openPrivacy = document.getElementById('openPrivacy');
const openTerms = document.getElementById('openTerms');

openPrivacy?.addEventListener('click', (e) => { e.preventDefault(); privacyModal?.classList.add('show'); });
openTerms?.addEventListener('click', (e) => { e.preventDefault(); termsModal?.classList.add('show'); });

document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => {
  privacyModal?.classList.remove('show');
  termsModal?.classList.remove('show');
}));
const filterBtns = document.querySelectorAll(".filter-btn");
const jobCards = document.querySelectorAll(".job-card");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".filter-btn.active").classList.remove("active");
    btn.classList.add("active");

    const filter = btn.dataset.filter;

    jobCards.forEach(card => {
      if (filter === "all" || card.classList.contains(filter)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  });
});

// Close modal on backdrop click
[privacyModal, termsModal].forEach(modal => {
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
});
// Modal functionality
const modal = document.getElementById("portfolioModal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalLink = document.getElementById("modal-link");
const closeBtn = document.querySelector(".close-btn");

document.querySelectorAll(".view-more").forEach(btn => {
  btn.addEventListener("click", () => {
    modal.style.display = "block";
    modalTitle.textContent = btn.getAttribute("data-title");
    modalImg.src = btn.getAttribute("data-img");
    modalDesc.textContent = btn.getAttribute("data-desc");
    modalLink.href = btn.getAttribute("data-link");
  });
});

closeBtn.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target == modal) {
    modal.style.display = "none";
  }
};
