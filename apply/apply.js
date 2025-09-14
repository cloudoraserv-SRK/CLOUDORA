// Navbar toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
toggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Animate on scroll
const elements = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.2 });
elements.forEach(el => observer.observe(el));

// Form submit (demo only)
document.getElementById('applyForm').addEventListener('submit', e => {
  e.preventDefault();
  alert("✅ Application submitted! Our team will reach out soon.");
});
