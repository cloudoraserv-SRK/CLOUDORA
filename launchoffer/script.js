document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu Functionality
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-menu a').forEach(item => {
        item.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // GSAP 3D Slider Functionality
    const imageSlides = gsap.utils.toArray('.image-slide');
    const packageSlides = gsap.utils.toArray('.package-slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let currentIndex = 0;
    const totalSlides = imageSlides.length;

    // Set initial state using GSAP
    gsap.set(imageSlides, { autoAlpha: 0, scale: 0.8, rotationY: 90 });
    gsap.set(imageSlides[currentIndex], { autoAlpha: 1, scale: 1, rotationY: 0 });
    gsap.set(packageSlides, { autoAlpha: 0, y: 20 });
    gsap.set(packageSlides[currentIndex], { autoAlpha: 1, y: 0 });

    function animateSlide(oldIndex, newIndex, direction) {
        // Create a timeline for the transition
        const tl = gsap.timeline({ defaults: { duration: 0.7, ease: 'power2.inOut' } });

        // Animate the old image slide out
        tl.to(imageSlides[oldIndex], { autoAlpha: 0, scale: 0.8, rotationY: -90 * direction }, 0);
        
        // Animate the new image slide in
        tl.fromTo(imageSlides[newIndex], { autoAlpha: 0, scale: 0.8, rotationY: 90 * direction }, { autoAlpha: 1, scale: 1, rotationY: 0 }, 0);

        // Animate the old package slide out
        tl.to(packageSlides[oldIndex], { autoAlpha: 0, y: -20 * direction }, 0);

        // Animate the new package slide in
        tl.fromTo(packageSlides[newIndex], { autoAlpha: 0, y: 20 * direction }, { autoAlpha: 1, y: 0 }, 0);
    }

    function showSlide(newIndex, direction) {
        if (newIndex === currentIndex) return;

        const oldIndex = currentIndex;
        currentIndex = newIndex;

        animateSlide(oldIndex, currentIndex, direction);
    }

    nextBtn.addEventListener('click', () => {
        const newIndex = (currentIndex + 1) % totalSlides;
        showSlide(newIndex, 1);
    });

    prevBtn.addEventListener('click', () => {
        const newIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        showSlide(newIndex, -1);
    });
});
