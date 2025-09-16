document.addEventListener('DOMContentLoaded', () => {

    // --- Hamburger Menu Logic ---
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile');
    const navLinks = document.querySelectorAll('.navlinks a, .mobile a');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.setAttribute('aria-modal', !isExpanded);
            document.body.style.overflow = isExpanded ? 'auto' : 'hidden';
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-modal', 'false');
                document.body.style.overflow = 'auto';
            });
        });
    }

    // --- Form Submission Logic ---
    const form = document.getElementById('jobForm');
    const formStatus = document.getElementById('formStatus');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            formStatus.style.display = 'block';
            formStatus.textContent = 'Submitting...';
            
            const formData = new FormData(form);

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    formStatus.textContent = 'Application Submitted!';
                    formStatus.style.backgroundColor = '#16a34a';
                    form.reset();
                } else {
                    formStatus.textContent = 'Submission Failed. Please try again.';
                    formStatus.style.backgroundColor = '#dc2626';
                }
            } catch (error) {
                formStatus.textContent = 'Error: ' + error.message;
                formStatus.style.backgroundColor = '#dc2626';
            }
        });
    }

    // --- Set current year in footer ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
