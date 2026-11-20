/**
 * BKFASI - Factory Automation Systems Intergrator
 * Main JavaScript Interactions & Dynamic Multi-Language Switcher
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Dynamic Multi-Language Switcher (i18n)
    // ==========================================
    const langSelect = document.getElementById('langSelect');
    const mobileLangSelect = document.getElementById('mobileLangSelect');

    function setLanguage(lang) {
        if (!translations || !translations[lang]) {
            lang = 'vi'; // Fallback to Vietnamese
        }

        const dict = translations[lang];

        // Update document language attribute
        document.documentElement.lang = lang;

        // 1. Update text content or innerHTML for elements with [data-i18n]
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                // If it's an option or input element
                if (el.tagName === 'OPTION') {
                    el.textContent = dict[key];
                } else {
                    el.innerHTML = dict[key];
                }
            }
        });

        // 2. Update placeholder for elements with [data-i18n-placeholder]
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key] !== undefined) {
                el.placeholder = dict[key];
            }
        });

        // 3. Synchronize select dropdown values
        if (langSelect) langSelect.value = lang;
        if (mobileLangSelect) mobileLangSelect.value = lang;

        // 4. Persist user selection
        try {
            localStorage.setItem('bkfasi_selected_lang', lang);
        } catch (e) {
            console.warn('LocalStorage unavailable:', e);
        }
    }

    // Initialize Language from localStorage or default to 'vi'
    let currentLang = 'vi';
    try {
        const saved = localStorage.getItem('bkfasi_selected_lang');
        if (saved && translations[saved]) {
            currentLang = saved;
        }
    } catch (e) {}

    // Apply initial language
    setLanguage(currentLang);

    // Event listeners on dropdown changes
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }

    if (mobileLangSelect) {
        mobileLangSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }

    // ==========================================
    // 2. Sticky Navigation Bar & Shadow
    // ==========================================
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

    // ==========================================
    // 3. Smooth Scroll to Top
    // ==========================================
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==========================================
    // 4. Mobile Menu Toggle
    // ==========================================
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

    // ==========================================
    // 5. ScrollSpy for Active Nav Link
    // ==========================================
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
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
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
