/**
 * BKFASI - Factory Automation Systems Intergrator
 * Main JavaScript Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navigation Bar & Shadow
    const header = document.getElementById('navbar');
    const backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Show/hide Back to Top button
        if (window.scrollY > 350) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    });

    // 2. Smooth Scroll to Top
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 3. Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu on nav link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // 4. ScrollSpy for Active Nav Link
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        sections.forEach(sec => {
            const secHeight = sec.offsetHeight;
            const secTop = sec.offsetTop - 120;
            const secId = sec.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href*="${secId}"]`);

            if (navLink) {
                if (scrollY > secTop && scrollY <= secTop + secHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
    });

    // 5. Language selector toggle alert simulation
    const langLinks = document.querySelectorAll('.lang-switch a');
    langLinks.forEach(lang => {
        lang.addEventListener('click', (e) => {
            e.preventDefault();
            langLinks.forEach(l => l.classList.remove('active'));
            lang.classList.add('active');
        });
    });
});

/**
 * Handle Contact Form Submission
 */
function handleContactSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('contactForm');
    const alertBox = document.getElementById('contactSuccessAlert');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi yêu cầu...';
    submitBtn.disabled = true;

    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Show success notification
        alertBox.classList.remove('d-none');
        form.reset();

        setTimeout(() => {
            alertBox.classList.add('d-none');
        }, 7000);
    }, 900);
}
