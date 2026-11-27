/**
 * BKFASI - Factory Automation Systems Intergrator
 * Main JavaScript Interactions & Dynamic Multi-Language Switcher
 */

// Track currently active modal project ID for i18n sync
let currentModalProjectId = null;

// Global modal functions
function openVideoModal(projectId) {
    const videoModal = document.getElementById('videoModal');
    const modalVideoPlayer = document.getElementById('modalVideoPlayer');
    const modalPartnerSpan = document.querySelector('#modalPartner .partner-name');
    const modalQuality = document.getElementById('modalQuality');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalTech = document.getElementById('modalTech');

    if (!videoModal || !modalVideoPlayer || !window.projectData) return;

    const project = window.projectData.find(p => p.id === projectId);
    if (!project) return;

    currentModalProjectId = projectId;
    const currentLang = document.documentElement.lang || 'vi';
    const dict = (window.translations && window.translations[currentLang]) ? window.translations[currentLang] : (window.translations ? window.translations['vi'] : {});

    // Set video player properties
    modalVideoPlayer.pause();
    modalVideoPlayer.src = project.file;
    modalVideoPlayer.poster = project.thumb;
    modalVideoPlayer.load();

    // Update modal meta info
    if (modalPartnerSpan) modalPartnerSpan.textContent = project.partner;
    if (modalQuality) modalQuality.textContent = project.quality;
    if (modalTitle) modalTitle.innerHTML = dict[project.id + '_t'] || '';
    if (modalDesc) modalDesc.innerHTML = dict[project.id + '_d'] || '';

    // Render tech tags
    if (modalTech) {
        modalTech.innerHTML = project.tech.map(t => `<span class="vcard-tech-tag">${t}</span>`).join('');
    }

    // Open dialog
    videoModal.classList.add('active');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Attempt autoplay
    const playPromise = modalVideoPlayer.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.log('Video autoplay waiting for user interaction:', err);
        });
    }
}

function closeVideoModal() {
    const videoModal = document.getElementById('videoModal');
    const modalVideoPlayer = document.getElementById('modalVideoPlayer');

    if (!videoModal) return;

    videoModal.classList.remove('active');
    videoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (modalVideoPlayer) {
        modalVideoPlayer.pause();
        modalVideoPlayer.removeAttribute('src');
        modalVideoPlayer.load();
    }
    currentModalProjectId = null;
}

// Expose modal handlers to global window
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Dynamic Multi-Language Switcher (i18n)
    // ==========================================
    const langSelect = document.getElementById('langSelect');
    const mobileLangSelect = document.getElementById('mobileLangSelect');

    function setLanguage(lang) {
        if (!window.translations || !window.translations[lang]) {
            lang = 'vi'; // Fallback to Vietnamese
        }

        const dict = window.translations[lang];

        // Update document language attribute
        document.documentElement.lang = lang;

        // 1. Update text content or innerHTML for elements with [data-i18n]
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
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

        // 4. Update open modal if currently displayed
        if (currentModalProjectId && window.projectData) {
            const modalTitle = document.getElementById('modalTitle');
            const modalDesc = document.getElementById('modalDesc');
            if (modalTitle && dict[currentModalProjectId + '_t']) {
                modalTitle.innerHTML = dict[currentModalProjectId + '_t'];
            }
            if (modalDesc && dict[currentModalProjectId + '_d']) {
                modalDesc.innerHTML = dict[currentModalProjectId + '_d'];
            }
        }

        // 5. Persist user selection
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
        if (saved && window.translations && window.translations[saved]) {
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
            const secTop = sec.offsetTop - 130;
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

    // ==========================================
    // 6. Video Modal Event Listeners
    // ==========================================
    const videoModalClose = document.getElementById('videoModalClose');
    const videoModalBackdrop = document.getElementById('videoModalBackdrop');

    if (videoModalClose) {
        videoModalClose.addEventListener('click', closeVideoModal);
    }
    if (videoModalBackdrop) {
        videoModalBackdrop.addEventListener('click', closeVideoModal);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });

    // ==========================================
    // 7. Video Projects Category Filter Tabs
    // ==========================================
    const filterButtons = document.querySelectorAll('.pfilter-btn');
    const projectCards = document.querySelectorAll('.video-project-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            // Active button highlight
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter cards
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.classList.remove('pcard-hidden');
                } else {
                    card.classList.add('pcard-hidden');
                }
            });
        });
    });
});

let lastContactSubmitTs = 0;

/**
 * Handle Contact Form Submission (with Honeypot & Rate-Limit)
 */
function handleContactSubmit(event) {
    event.preventDefault();
    const hp = document.getElementById('c_website_hp');
    if (hp && hp.value.trim() !== '') {
        return; // Bot detected via honeypot
    }
    const now = Date.now();
    if (now - lastContactSubmitTs < 30000) {
        alert('Vui lòng đợi 30 giây trước khi gửi yêu cầu tiếp theo.');
        return;
    }
    lastContactSubmitTs = now;

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
