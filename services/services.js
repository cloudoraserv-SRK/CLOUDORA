// Navbar toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if(toggle){
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Navbar color change on scroll
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if(window.scrollY > 50){
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});
