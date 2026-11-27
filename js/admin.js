/**
 * BKFASI - Admin CMS & Content Management System
 * Cho phép Admin đăng nhập, chỉnh sửa nội dung đa ngôn ngữ, thay ảnh,
 * thêm/sửa tab, upload & kiểm soát hiển thị video, thêm Quotes.
 */

(function () {
    const STORAGE_KEY = 'bkfasi_cms_state_v1';
    const SESSION_KEY = 'bkfasi_admin_logged_in';
    const GITHUB_TOKEN_KEY = 'bkfasi_gh_pat';
    const DEFAULT_USER = 'admin';
    const DEFAULT_PASS = 'bkfasi2026';

    // ==========================================
    // 1. IndexedDB Storage for Uploaded Videos/Images
    // ==========================================
    const MediaDB = {
        dbName: 'bkfasi_cms_media',
        storeName: 'files',
        db: null,
        open() {
            return new Promise((resolve, reject) => {
                if (this.db) return resolve(this.db);
                const req = indexedDB.open(this.dbName, 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
                req.onsuccess = (e) => {
                    this.db = e.target.result;
                    resolve(this.db);
                };
                req.onerror = (e) => reject(e.target.error);
            });
        },
        async put(key, val) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                tx.objectStore(this.storeName).put(val, key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = (e) => reject(e.target.error);
            });
        },
        async get(key) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const req = tx.objectStore(this.storeName).get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = (e) => reject(e.target.error);
            });
        },
        async del(key) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                tx.objectStore(this.storeName).delete(key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = (e) => reject(e.target.error);
            });
        }
    };

    // Runtime Blob URL cache for IndexedDB videos
    const blobUrlCache = {};

    // ==========================================
    // 2. Default Tabs & Image Slots Definitions
    // ==========================================
    const DEFAULT_PROJECT_TABS = [
        { id: 'all', icon: 'fa-solid fa-layer-group', i18nKey: 'tab_all', labels: { vi: 'Tất Cả Dự Án', en: 'All Projects', zh: '全部项目', ja: 'すべての実績', ko: '전체 프로젝트' }, visible: true, isCore: true },
        { id: 'electronics', icon: 'fa-solid fa-microchip', i18nKey: 'tab_electronics', labels: { vi: 'Linh Kiện Điện Tử & Bán Dẫn', en: 'Electronics & Semiconductor', zh: '电子元件与半导体', ja: '電子部品・半導体', ko: '전자부품 및 반도체' }, visible: true, isDefault: true },
        { id: 'cnc', icon: 'fa-solid fa-gears', i18nKey: 'tab_cnc', labels: { vi: 'Dập & Gia Công CNC', en: 'Stamping & CNC Machining', zh: '冲压与CNC加工', ja: 'プレス・CNC加工', ko: '프레스 및 CNC 가공' }, visible: true, isDefault: true },
        { id: 'textile', icon: 'fa-solid fa-shirt', i18nKey: 'tab_textile', labels: { vi: 'Tự Động Hóa Dệt May', en: 'Textile & Garment Automation', zh: '纺织服装自动化', ja: '縫製・繊維自動化', ko: '섬유·봉제 자동화' }, visible: true, isDefault: true },
        { id: 'consumer', icon: 'fa-solid fa-bottle-water', i18nKey: 'tab_consumer', labels: { vi: 'Hàng Tiêu Dùng & Thủy Tinh', en: 'Consumer Goods & Glassware', zh: '日用消费品与玻璃', ja: '日用品・ガラス製品', ko: '생활용품 및 유리' }, visible: true, isDefault: true },
        { id: 'rnd', icon: 'fa-solid fa-flask-vial', i18nKey: 'tab_rnd', labels: { vi: 'Nghiên Cứu & Kiểm Định', en: 'R&D & Calibration Center', zh: '研发与测试中心', ja: '研究開発・試験', ko: 'R&D 및 성능 검증' }, visible: true, isDefault: true }
    ];

    const IMAGE_SLOTS = [
        { key: 'logo', label: 'Logo Công ty (Header)', defaultSrc: 'images/logo.png', selector: '.logo-img' },
        { key: 'hero_banner', label: 'Ảnh nền Banner chính (Hero)', defaultSrc: 'images/banner1.jpg', isBg: true, selector: '.hero-banner' },
        { key: 'plc_img', label: 'Ảnh Giải pháp PLC', defaultSrc: 'images/plc.jpg', selector: '.sol-card:nth-child(1) .sol-img-wrap img' },
        { key: 'motion_img', label: 'Ảnh Điều khiển chuyển động', defaultSrc: 'images/banner1.jpg', selector: '.sol-card:nth-child(2) .sol-img-wrap img' },
        { key: 'mes_img', label: 'Ảnh Hệ thống MES', defaultSrc: 'images/mes.jpg', selector: '.sol-card:nth-child(3) .sol-img-wrap img' },
        { key: 'robot_img', label: 'Ảnh Robot Công nghiệp', defaultSrc: 'images/robot.jpg', selector: '.sol-card:nth-child(4) .sol-img-wrap img' },
        { key: 'quote1_avatar', label: 'Ảnh Quote 1 (Nguyễn Chí Hưng)', defaultSrc: 'images/avatar1_2.jpg', selector: '.quote-section .quote-img' },
        { key: 'quote2_avatar', label: 'Ảnh Quote 2 (Shim In Bo)', defaultSrc: 'images/avatar2_5.jpg', selector: '.quote-section-alt .quote-img' }
    ];

    const EDITABLE_TEXT_FIELDS = [
        { group: 'Banner Chính (Hero)', items: [
            { key: 'hero_badge', label: 'Nhãn tiêu đề phụ', type: 'text' },
            { key: 'hero_title', label: 'Tiêu đề chính H1', type: 'text' },
            { key: 'hero_desc', label: 'Đoạn mô tả Hero', type: 'textarea' }
        ]},
        { group: 'Giới thiệu (About)', items: [
            { key: 'about_title', label: 'Tiêu đề Giới thiệu', type: 'text' },
            { key: 'about_lead', label: 'Đoạn dẫn nổi bật', type: 'textarea' },
            { key: 'about_p', label: 'Đoạn mô tả chi tiết', type: 'textarea' }
        ]},
        { group: 'Quotes Lãnh đạo (Mặc định)', items: [
            { key: 'quote1_text', label: 'Nội dung Quote 1', type: 'textarea' },
            { key: 'quote1_author', label: 'Tác giả Quote 1', type: 'text' },
            { key: 'quote1_role', label: 'Chức vụ Quote 1', type: 'text' },
            { key: 'quote2_text', label: 'Nội dung Quote 2', type: 'textarea' },
            { key: 'quote2_author', label: 'Tác giả Quote 2', type: 'text' },
            { key: 'quote2_role', label: 'Chức vụ Quote 2', type: 'text' }
        ]},
        { group: 'Mục Video Dự án & Liên hệ', items: [
            { key: 'prj_tag', label: 'Tag mục Dự án', type: 'text' },
            { key: 'prj_title', label: 'Tiêu đề mục Dự án', type: 'text' },
            { key: 'prj_desc', label: 'Mô tả mục Dự án', type: 'textarea' },
            { key: 'contact_title', label: 'Tiêu đề Liên hệ', type: 'text' },
            { key: 'c_hq_val', label: 'Địa chỉ trụ sở', type: 'text' }
        ]}
    ];

    // ==========================================
    // 3. State Management
    // ==========================================
    function createEmptyState() {
        return {
            adminPass: DEFAULT_PASS,
            textOverrides: { vi: {}, en: {}, zh: {}, ja: {}, ko: {} },
            imageOverrides: {},
            customQuotes: [],
            projectTabs: JSON.parse(JSON.stringify(DEFAULT_PROJECT_TABS)),
            navTabs: [],
            videoOverrides: {},
            customVideos: []
        };
    }

    function loadState() {
        let base = createEmptyState();
        if (window.BKFASI_CMS_PUBLISHED && typeof window.BKFASI_CMS_PUBLISHED === 'object') {
            base = { ...base, ...window.BKFASI_CMS_PUBLISHED };
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                base = {
                    ...base,
                    ...parsed,
                    textOverrides: { ...base.textOverrides, ...(parsed.textOverrides || {}) },
                    imageOverrides: { ...base.imageOverrides, ...(parsed.imageOverrides || {}) },
                    videoOverrides: { ...base.videoOverrides, ...(parsed.videoOverrides || {}) }
                };
            }
        } catch (e) {
            console.warn('CMS state load error:', e);
        }
        if (!Array.isArray(base.projectTabs) || base.projectTabs.length === 0) {
            base.projectTabs = JSON.parse(JSON.stringify(DEFAULT_PROJECT_TABS));
        }
        if (!Array.isArray(base.customQuotes)) base.customQuotes = [];
        if (!Array.isArray(base.navTabs)) base.navTabs = [];
        if (!Array.isArray(base.customVideos)) base.customVideos = [];
        return base;
    }

    let cmsState = loadState();
    let activeProjectFilter = 'all';
    let editingLang = 'vi';
    let editingVideoId = null;

    function saveState(silent = false) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cmsState));
            if (!silent) showToast('Đã lưu thay đổi vào trình duyệt!', 'success');
        } catch (e) {
            showToast('Lỗi lưu trữ (dung lượng localStorage đầy). Hãy xóa bớt ảnh/dùng GitHub Sync.', 'error');
        }
    }

    function isLoggedIn() {
        return sessionStorage.getItem(SESSION_KEY) === 'true' || localStorage.getItem(SESSION_KEY) === 'true';
    }

    function setLoggedIn(val) {
        if (val) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            localStorage.setItem(SESSION_KEY, 'true');
        } else {
            sessionStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(SESSION_KEY);
        }
        updateAuthUI();
    }

    // ==========================================
    // 4. Utilities (Toast, Image Compress, Video Thumb)
    // ==========================================
    function showToast(msg, type = 'info') {
        let toast = document.getElementById('cmsToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cmsToast';
            toast.className = 'cms-toast';
            document.body.appendChild(toast);
        }
        const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
        toast.className = `cms-toast ${type} show`;
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${msg}</span>`;
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3200);
    }

    function compressImageFile(file, maxW = 1200, quality = 0.82) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;
                    if (w > maxW) {
                        h = Math.round((h * maxW) / w);
                        w = maxW;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const mime = file.type === 'image/png' && w <= 500 ? 'image/png' : 'image/jpeg';
                    resolve(canvas.toDataURL(mime, quality));
                };
                img.onerror = reject;
                img.src = ev.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function extractVideoMetaAndThumb(file) {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.muted = true;
            vid.playsInline = true;
            vid.src = url;
            vid.onloadeddata = () => {
                vid.currentTime = Math.min(1.5, (vid.duration || 2) / 3);
            };
            vid.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 360;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                const thumb = canvas.toDataURL('image/jpeg', 0.8);
                const durSec = Math.round(vid.duration || 0);
                const mm = String(Math.floor(durSec / 60)).padStart(2, '0');
                const ss = String(durSec % 60).padStart(2, '0');
                const quality = (vid.videoHeight >= 1080) ? 'FHD 1080p' : 'HD 720p';
                URL.revokeObjectURL(url);
                resolve({ thumb, duration: `${mm}:${ss}`, quality });
            };
            vid.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({ thumb: 'images/banner1.jpg', duration: '00:30', quality: 'HD 720p' });
            };
        });
    }

    // ==========================================
    // 5. Merge & Apply CMS Data to Live Website
    // ==========================================
    function getAllEffectiveProjects() {
        const baseList = Array.isArray(window.projectData) ? window.projectData : [];
        const merged = baseList.map(p => {
            const ov = cmsState.videoOverrides[p.id] || {};
            return {
                ...p,
                ...ov,
                visible: ov.visible !== undefined ? ov.visible : true,
                isCustom: false
            };
        });
        const customs = cmsState.customVideos.map(cv => ({
            ...cv,
            visible: cv.visible !== undefined ? cv.visible : true,
            isCustom: true
        }));
        return [...customs, ...merged];
    }

    async function resolveVideoSrc(project) {
        if (project.dbKey) {
            if (blobUrlCache[project.dbKey]) return blobUrlCache[project.dbKey];
            try {
                const blob = await MediaDB.get(project.dbKey);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    blobUrlCache[project.dbKey] = url;
                    return url;
                }
            } catch (e) {
                console.warn('MediaDB get error:', e);
            }
        }
        return project.file;
    }

    function getEffectiveText(lang, key, fallback = '') {
        if (cmsState.textOverrides[lang] && cmsState.textOverrides[lang][key] !== undefined && cmsState.textOverrides[lang][key] !== '') {
            return cmsState.textOverrides[lang][key];
        }
        if (window.translations && window.translations[lang] && window.translations[lang][key] !== undefined) {
            return window.translations[lang][key];
        }
        if (window.translations && window.translations['vi'] && window.translations['vi'][key] !== undefined) {
            return window.translations['vi'][key];
        }
        return fallback;
    }

    function applyTextOverridesToDom(lang) {
        const currentLang = lang || document.documentElement.lang || 'vi';
        const ov = cmsState.textOverrides[currentLang] || {};
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (ov[key] !== undefined && ov[key] !== '') {
                if (el.tagName === 'OPTION') el.textContent = ov[key];
                else el.innerHTML = ov[key];
            }
        });
    }

    function applyImageOverridesToDom() {
        IMAGE_SLOTS.forEach(slot => {
            const customSrc = cmsState.imageOverrides[slot.key];
            const el = document.querySelector(slot.selector);
            if (!el) return;
            if (slot.isBg) {
                el.style.backgroundImage = customSrc
                    ? `url('${customSrc}')`
                    : '';
            } else {
                el.src = customSrc || slot.defaultSrc;
            }
        });
    }

    function renderCustomQuotesToDom() {
        let container = document.getElementById('customQuotesContainer');
        if (!container) {
            const quote2Section = document.querySelector('.quote-section-alt');
            if (!quote2Section) return;
            container = document.createElement('div');
            container.id = 'customQuotesContainer';
            quote2Section.insertAdjacentElement('afterend', container);
        }
        if (!cmsState.customQuotes.length) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = cmsState.customQuotes.map((q, idx) => {
            const isDark = q.style === 'dark';
            const secClass = isDark ? 'section quote-section bg-dark text-white' : 'section quote-section-alt';
            const wrapClass = idx % 2 === 1 ? 'quote-wrapper reverse' : 'quote-wrapper';
            const iconClass = isDark ? 'fa-solid fa-quote-left quote-icon' : 'fa-solid fa-quote-left quote-icon text-primary';
            const avatarHtml = `
                <div class="quote-avatar">
                    <img src="${q.avatar || 'images/avatar1_2.jpg'}" alt="${q.author}" class="quote-img">
                </div>`;
            const contentHtml = `
                <div class="quote-content">
                    <i class="${iconClass}"></i>
                    <blockquote class="quote-text">${q.text}</blockquote>
                    <div class="quote-author">
                        <h4>${q.author}</h4>
                        <p>${q.role}</p>
                        <span class="company-sub">BKFASI - Factory Automation Systems Intergrator</span>
                    </div>
                </div>`;
            return `
            <section class="${secClass}">
                <div class="container">
                    <div class="${wrapClass}">
                        ${idx % 2 === 1 ? contentHtml + avatarHtml : avatarHtml + contentHtml}
                    </div>
                </div>
            </section>`;
        }).join('');
    }

    function renderCustomNavTabsToDom() {
        const navList = document.querySelector('.nav-list');
        if (!navList) return;
        navList.querySelectorAll('.cms-custom-nav-item').forEach(el => el.remove());

        let secContainer = document.getElementById('customSectionsContainer');
        if (!secContainer) {
            const contactSec = document.getElementById('contact');
            if (contactSec) {
                secContainer = document.createElement('div');
                secContainer.id = 'customSectionsContainer';
                contactSec.insertAdjacentElement('beforebegin', secContainer);
            }
        }
        if (secContainer) secContainer.innerHTML = '';

        cmsState.navTabs.forEach(tab => {
            if (tab.visible === false) return;
            const li = document.createElement('li');
            li.className = 'cms-custom-nav-item';
            const targetHref = tab.href && tab.href.trim() ? tab.href.trim() : `#custom_sec_${tab.id}`;
            li.innerHTML = `<a href="${targetHref}" class="nav-link">${tab.label}</a>`;
            navList.appendChild(li);

            if (!tab.href && secContainer) {
                const sec = document.createElement('section');
                sec.className = 'section bg-light';
                sec.id = `custom_sec_${tab.id}`;
                sec.innerHTML = `
                    <div class="container">
                        <div class="section-header text-center">
                            <div class="section-tag">BKFASI</div>
                            <h2 class="section-title">${tab.sectionTitle || tab.label}</h2>
                        </div>
                        <div style="max-width:860px;margin:0 auto;font-size:1.02rem;line-height:1.75;color:#334155;background:#fff;padding:28px;border-radius:14px;border:1px solid #e2e8f0;">
                            ${(tab.sectionContent || '').replace(/\n/g, '<br>')}
                        </div>
                    </div>`;
                secContainer.appendChild(sec);
            }
        });
    }

    function renderProjectsSectionToDom() {
        const lang = document.documentElement.lang || 'vi';
        const filterBar = document.querySelector('.projects-filter-bar');
        const grid = document.querySelector('.video-projects-grid');
        if (!filterBar || !grid) return;

        const allProjects = getAllEffectiveProjects();
        const visibleProjects = allProjects.filter(p => p.visible !== false);

        // Render Filter Tabs
        filterBar.innerHTML = cmsState.projectTabs
            .filter(t => t.visible !== false)
            .map(tab => {
                const count = tab.id === 'all'
                    ? visibleProjects.length
                    : visibleProjects.filter(p => p.category === tab.id).length;
                const label = (tab.labels && tab.labels[lang]) || (tab.i18nKey ? getEffectiveText(lang, tab.i18nKey, tab.id) : tab.id);
                const isActive = activeProjectFilter === tab.id ? 'active' : '';
                return `
                    <button class="pfilter-btn ${isActive}" data-filter="${tab.id}">
                        <i class="${tab.icon || 'fa-solid fa-folder'}"></i>
                        <span>${label}</span>
                        <span class="filter-count">(${count})</span>
                    </button>`;
            }).join('');

        // Render Video Cards
        const watchText = getEffectiveText(lang, 'btn_watch_video', 'Xem Video Chi Tiết');
        grid.innerHTML = visibleProjects.map(p => {
            const title = (p.titles && (p.titles[lang] || p.titles['vi'])) || getEffectiveText(lang, p.id + '_t', p.id);
            const desc = (p.descs && (p.descs[lang] || p.descs['vi'])) || getEffectiveText(lang, p.id + '_d', '');
            const hiddenClass = (activeProjectFilter !== 'all' && p.category !== activeProjectFilter) ? 'pcard-hidden' : '';
            const techHtml = (p.tech || []).map(t => `<span class="vcard-tech-tag">${t}</span>`).join('');
            return `
                <div class="video-project-card ${hiddenClass}" data-category="${p.category}" data-id="${p.id}">
                    <div class="vcard-media" onclick="openVideoModal('${p.id}')">
                        <img src="${p.thumb || 'images/banner1.jpg'}" alt="${title}" class="vcard-thumb" loading="lazy">
                        <div class="vcard-overlay">
                            <button class="vcard-play-btn" aria-label="Play Video">
                                <i class="fa-solid fa-play"></i>
                            </button>
                        </div>
                        <div class="vcard-badges">
                            <span class="badge-dur"><i class="fa-regular fa-clock"></i> ${p.duration || '01:00'}</span>
                            <span class="badge-res">${p.quality || 'HD 720p'}</span>
                        </div>
                    </div>
                    <div class="vcard-body">
                        <div class="vcard-meta">
                            <span class="vcard-partner"><i class="fa-solid fa-building-circle-check"></i> ${p.partner || 'BKFASI'}</span>
                        </div>
                        <h3 class="vcard-title">${title}</h3>
                        <p class="vcard-desc">${desc}</p>
                        <div class="vcard-tech-wrap">${techHtml}</div>
                        <button class="vcard-action-btn" onclick="openVideoModal('${p.id}')">
                            <i class="fa-solid fa-circle-play"></i> <span>${watchText}</span>
                        </button>
                    </div>
                </div>`;
        }).join('');
    }

    function applyAllToDOM() {
        const lang = document.documentElement.lang || 'vi';
        applyTextOverridesToDom(lang);
        applyImageOverridesToDom();
        renderCustomQuotesToDom();
        renderCustomNavTabsToDom();
        renderProjectsSectionToDom();
    }

    // Override global openVideoModal to support edited & uploaded IndexedDB videos
    const origOpenVideoModal = window.openVideoModal;
    window.openVideoModal = async function (projectId) {
        const all = getAllEffectiveProjects();
        const project = all.find(p => p.id === projectId);
        if (!project) {
            if (origOpenVideoModal) origOpenVideoModal(projectId);
            return;
        }
        const videoModal = document.getElementById('videoModal');
        const modalVideoPlayer = document.getElementById('modalVideoPlayer');
        const modalPartnerSpan = document.querySelector('#modalPartner .partner-name');
        const modalQuality = document.getElementById('modalQuality');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const modalTech = document.getElementById('modalTech');
        if (!videoModal || !modalVideoPlayer) return;

        const lang = document.documentElement.lang || 'vi';
        const title = (project.titles && (project.titles[lang] || project.titles['vi'])) || getEffectiveText(lang, project.id + '_t', '');
        const desc = (project.descs && (project.descs[lang] || project.descs['vi'])) || getEffectiveText(lang, project.id + '_d', '');

        const src = await resolveVideoSrc(project);
        modalVideoPlayer.pause();
        modalVideoPlayer.src = src;
        modalVideoPlayer.poster = project.thumb || '';
        modalVideoPlayer.load();

        if (modalPartnerSpan) modalPartnerSpan.textContent = project.partner || 'BKFASI';
        if (modalQuality) modalQuality.textContent = project.quality || 'HD 720p';
        if (modalTitle) modalTitle.innerHTML = title;
        if (modalDesc) modalDesc.innerHTML = desc;
        if (modalTech) {
            modalTech.innerHTML = (project.tech || []).map(t => `<span class="vcard-tech-tag">${t}</span>`).join('');
        }

        videoModal.classList.add('active');
        videoModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const p = modalVideoPlayer.play();
        if (p) p.catch(() => {});
    };

    // ==========================================
    // 6. Build Admin UI (Button, Login Modal, Dashboard)
    // ==========================================
    function injectAdminUI() {
        // 1. Topbar Admin Button
        const topbarRight = document.querySelector('.topbar-right');
        if (topbarRight && !document.getElementById('adminTriggerBtn')) {
            const btn = document.createElement('button');
            btn.id = 'adminTriggerBtn';
            btn.className = 'admin-trigger-btn';
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Admin</span>';
            btn.onclick = () => {
                if (isLoggedIn()) openDashboard();
                else openLoginModal();
            };
            topbarRight.appendChild(btn);
        }

        // 2. Floating Bar when logged in
        if (!document.getElementById('adminFloatingBar')) {
            const bar = document.createElement('div');
            bar.id = 'adminFloatingBar';
            bar.className = 'admin-floating-bar';
            bar.innerHTML = `
                <span class="afb-status"><span class="afb-dot"></span> Chế độ Admin</span>
                <button class="afb-btn" id="afbOpenDash"><i class="fa-solid fa-sliders"></i> Quản trị Web</button>
                <button class="afb-btn afb-logout" id="afbLogout"><i class="fa-solid fa-right-from-bracket"></i> Thoát</button>
            `;
            document.body.appendChild(bar);
            document.getElementById('afbOpenDash').onclick = openDashboard;
            document.getElementById('afbLogout').onclick = () => {
                setLoggedIn(false);
                closeDashboard();
                showToast('Đã đăng xuất tài khoản Admin', 'info');
            };
        }

        // 3. Login Modal
        if (!document.getElementById('cmsLoginModal')) {
            const lm = document.createElement('div');
            lm.id = 'cmsLoginModal';
            lm.className = 'cms-modal';
            lm.innerHTML = `
                <div class="cms-modal-backdrop" id="cmsLoginBackdrop"></div>
                <div class="cms-login-dialog">
                    <div class="cms-login-header">
                        <h3><i class="fa-solid fa-user-shield"></i> Đăng Nhập Quản Trị (Admin)</h3>
                        <p>Chỉnh sửa nội dung, hình ảnh, tab, quotes và video dự án</p>
                        <button class="cms-close-x" id="cmsLoginClose"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form class="cms-login-body" id="cmsLoginForm">
                        <div class="cms-login-hint">
                            <strong>Tài khoản mặc định:</strong> <code>admin</code> / Mật khẩu: <code>bkfasi2026</code><br>
                            <small>(Bạn có thể đổi mật khẩu sau khi đăng nhập)</small>
                        </div>
                        <div class="cms-login-error" id="cmsLoginError">Sai tên đăng nhập hoặc mật khẩu!</div>
                        <div class="cms-field">
                            <label>Tên đăng nhập</label>
                            <input type="text" id="cmsUser" value="admin" required autocomplete="username">
                        </div>
                        <div class="cms-field">
                            <label>Mật khẩu</label>
                            <input type="password" id="cmsPass" placeholder="Nhập mật khẩu..." required autocomplete="current-password">
                        </div>
                        <button type="submit" class="cms-btn cms-btn-primary" style="width:100%;">
                            <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập vào CMS
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(lm);
            document.getElementById('cmsLoginBackdrop').onclick = closeLoginModal;
            document.getElementById('cmsLoginClose').onclick = closeLoginModal;
            document.getElementById('cmsLoginForm').onsubmit = (e) => {
                e.preventDefault();
                const u = document.getElementById('cmsUser').value.trim();
                const p = document.getElementById('cmsPass').value;
                if (u === DEFAULT_USER && p === (cmsState.adminPass || DEFAULT_PASS)) {
                    document.getElementById('cmsLoginError').style.display = 'none';
                    setLoggedIn(true);
                    closeLoginModal();
                    openDashboard();
                    showToast('Đăng nhập Admin thành công!', 'success');
                } else {
                    document.getElementById('cmsLoginError').style.display = 'block';
                }
            };
        }

        // 4. Dashboard Modal
        if (!document.getElementById('cmsDashboardModal')) {
            const dm = document.createElement('div');
            dm.id = 'cmsDashboardModal';
            dm.className = 'cms-modal';
            dm.innerHTML = `
                <div class="cms-modal-backdrop" id="cmsDashBackdrop"></div>
                <div class="cms-dashboard-dialog">
                    <div class="cms-dash-header">
                        <div class="cms-dash-title">
                            <i class="fa-solid fa-screwdriver-wrench" style="color:#f77f00;font-size:1.25rem;"></i>
                            <h2>BKFASI CMS QUẢN TRỊ WEBSITE</h2>
                            <span class="cms-dash-badge">Admin Mode</span>
                        </div>
                        <div class="cms-dash-actions">
                            <button class="cms-btn cms-btn-success cms-btn-sm" id="cmsQuickSaveBtn"><i class="fa-solid fa-floppy-disk"></i> Lưu & Áp dụng</button>
                            <button class="cms-btn cms-btn-outline cms-btn-sm" id="cmsDashCloseBtn" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2);"><i class="fa-solid fa-xmark"></i> Đóng</button>
                        </div>
                    </div>
                    <div class="cms-dash-body">
                        <aside class="cms-sidebar">
                            <button class="cms-nav-btn active" data-tab="tabContent"><i class="fa-solid fa-pen-to-square"></i> Nội dung & Quotes</button>
                            <button class="cms-nav-btn" data-tab="tabImages"><i class="fa-solid fa-images"></i> Hình ảnh Web</button>
                            <button class="cms-nav-btn" data-tab="tabTabs"><i class="fa-solid fa-folder-plus"></i> Tab & Menu</button>
                            <button class="cms-nav-btn" data-tab="tabVideos"><i class="fa-solid fa-film"></i> Video Dự án</button>
                            <button class="cms-nav-btn" data-tab="tabPublish"><i class="fa-solid fa-cloud-arrow-up"></i> Xuất bản & Bảo mật</button>
                            <div class="cms-sidebar-footer">
                                <strong>Mẹo sử dụng:</strong><br>
                                Mọi thay đổi được lưu tức thì trên trình duyệt của bạn. Để cập nhật cho toàn bộ khách truy cập GitHub Pages, hãy vào mục <em>Xuất bản</em>.
                            </div>
                        </aside>
                        <main class="cms-content">
                            <div id="tabContent" class="cms-tab-pane active"></div>
                            <div id="tabImages" class="cms-tab-pane"></div>
                            <div id="tabTabs" class="cms-tab-pane"></div>
                            <div id="tabVideos" class="cms-tab-pane"></div>
                            <div id="tabPublish" class="cms-tab-pane"></div>
                        </main>
                    </div>
                </div>
            `;
            document.body.appendChild(dm);
            document.getElementById('cmsDashBackdrop').onclick = closeDashboard;
            document.getElementById('cmsDashCloseBtn').onclick = closeDashboard;
            document.getElementById('cmsQuickSaveBtn').onclick = () => {
                saveState();
                applyAllToDOM();
            };

            dm.querySelectorAll('.cms-nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    dm.querySelectorAll('.cms-nav-btn').forEach(b => b.classList.remove('active'));
                    dm.querySelectorAll('.cms-tab-pane').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    const tabId = btn.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');
                    renderDashboardTab(tabId);
                });
            });
        }

        // Delegate filter bar clicks so dynamic tabs always work
        const filterBar = document.querySelector('.projects-filter-bar');
        if (filterBar && !filterBar.dataset.cmsBound) {
            filterBar.dataset.cmsBound = '1';
            filterBar.addEventListener('click', (e) => {
                const btn = e.target.closest('.pfilter-btn');
                if (!btn) return;
                activeProjectFilter = btn.getAttribute('data-filter') || 'all';
                renderProjectsSectionToDom();
            });
        }

        updateAuthUI();
    }

    function updateAuthUI() {
        const logged = isLoggedIn();
        const trigger = document.getElementById('adminTriggerBtn');
        const bar = document.getElementById('adminFloatingBar');
        if (trigger) {
            if (logged) {
                trigger.classList.add('logged-in');
                trigger.innerHTML = '<i class="fa-solid fa-sliders"></i> <span>Admin CMS</span>';
            } else {
                trigger.classList.remove('logged-in');
                trigger.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Admin</span>';
            }
        }
        if (bar) {
            bar.classList.toggle('active', logged);
        }
    }

    function openLoginModal() {
        const lm = document.getElementById('cmsLoginModal');
        if (lm) {
            lm.classList.add('active');
            document.getElementById('cmsPass').value = '';
            document.getElementById('cmsPass').focus();
        }
    }

    function closeLoginModal() {
        const lm = document.getElementById('cmsLoginModal');
        if (lm) lm.classList.remove('active');
    }

    function openDashboard() {
        const dm = document.getElementById('cmsDashboardModal');
        if (!dm) return;
        dm.classList.add('active');
        document.body.style.overflow = 'hidden';
        const activeBtn = dm.querySelector('.cms-nav-btn.active');
        renderDashboardTab(activeBtn ? activeBtn.getAttribute('data-tab') : 'tabContent');
    }

    function closeDashboard() {
        const dm = document.getElementById('cmsDashboardModal');
        if (dm) dm.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ==========================================
    // 7. Render Individual Dashboard Tabs
    // ==========================================
    function renderDashboardTab(tabId) {
        if (tabId === 'tabContent') renderContentTab();
        else if (tabId === 'tabImages') renderImagesTab();
        else if (tabId === 'tabTabs') renderTabsManager();
        else if (tabId === 'tabVideos') renderVideosManager();
        else if (tabId === 'tabPublish') renderPublishTab();
    }

    // --- TAB 1: Nội dung & Quotes ---
    function renderContentTab() {
        const pane = document.getElementById('tabContent');
        const langOptions = [
            { code: 'vi', name: '🇻🇳 Tiếng Việt' },
            { code: 'en', name: '🇬🇧 English' },
            { code: 'zh', name: '🇨🇳 中文' },
            { code: 'ja', name: '🇯🇵 日本語' },
            { code: 'ko', name: '🇰🇷 한국어' }
        ].map(l => `<option value="${l.code}" ${editingLang === l.code ? 'selected' : ''}>${l.name}</option>`).join('');

        const groupsHtml = EDITABLE_TEXT_FIELDS.map(grp => {
            const fieldsHtml = grp.items.map(item => {
                const val = getEffectiveText(editingLang, item.key, '').replace(/"/g, '&quot;');
                if (item.type === 'textarea') {
                    return `
                        <div class="cms-field">
                            <label>${item.label} <small style="color:#94a3b8">(${item.key})</small></label>
                            <textarea rows="3" data-cms-text-key="${item.key}">${getEffectiveText(editingLang, item.key, '')}</textarea>
                        </div>`;
                }
                return `
                    <div class="cms-field">
                        <label>${item.label} <small style="color:#94a3b8">(${item.key})</small></label>
                        <input type="text" value="${val}" data-cms-text-key="${item.key}">
                    </div>`;
            }).join('');
            return `
                <div class="cms-card">
                    <div class="cms-card-title"><span>${grp.group}</span></div>
                    ${fieldsHtml}
                </div>`;
        }).join('');

        const customQuotesHtml = cmsState.customQuotes.map((q, idx) => `
            <div class="cms-quote-item">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong>Quote #${idx + 1}: ${q.author}</strong>
                    <button class="cms-btn cms-btn-danger cms-btn-sm" onclick="window._cmsDelQuote('${q.id}')"><i class="fa-solid fa-trash"></i> Xóa</button>
                </div>
                <div class="cms-grid-2">
                    <div class="cms-field"><label>Tác giả</label><input type="text" value="${q.author}" onchange="window._cmsUpdateQuote('${q.id}','author',this.value)"></div>
                    <div class="cms-field"><label>Chức vụ</label><input type="text" value="${q.role}" onchange="window._cmsUpdateQuote('${q.id}','role',this.value)"></div>
                </div>
                <div class="cms-field"><label>Nội dung trích dẫn</label><textarea rows="2" onchange="window._cmsUpdateQuote('${q.id}','text',this.value)">${q.text}</textarea></div>
            </div>`).join('');

        pane.innerHTML = `
            <div class="cms-section-head">
                <h3>Chỉnh sửa Nội dung Web & Quotes</h3>
                <div style="display:flex;align-items:center;gap:10px;">
                    <label style="font-size:0.85rem;font-weight:700;">Ngôn ngữ đang sửa:</label>
                    <select id="cmsEditLangSelect" style="padding:7px 12px;border-radius:8px;border:1.5px solid #cbd5e1;font-weight:600;">
                        ${langOptions}
                    </select>
                </div>
            </div>
            ${groupsHtml}
            <div class="cms-card">
                <div class="cms-card-title">
                    <span><i class="fa-solid fa-quote-left"></i> Thêm Quote mới (Hiển thị thêm trên trang chủ)</span>
                </div>
                ${customQuotesHtml || '<p style="font-size:0.85rem;color:#64748b;margin-bottom:14px;">Chưa có Quote bổ sung nào.</p>'}
                <div style="border-top:1px dashed #cbd5e1;padding-top:14px;margin-top:10px;">
                    <div class="cms-grid-2">
                        <div class="cms-field"><label>Tên tác giả *</label><input type="text" id="newQAuthor" placeholder="VD: Trần Văn B"></div>
                        <div class="cms-field"><label>Chức vụ / Công ty</label><input type="text" id="newQRole" placeholder="VD: Giám đốc Dự án - BKFASI"></div>
                    </div>
                    <div class="cms-field"><label>Nội dung Quote *</label><textarea id="newQText" rows="2" placeholder="Nhập thông điệp trích dẫn..."></textarea></div>
                    <div class="cms-grid-2">
                        <div class="cms-field"><label>Ảnh đại diện (Upload từ máy)</label><input type="file" id="newQAvatarFile" accept="image/*"></div>
                        <div class="cms-field"><label>Kiểu nền</label>
                            <select id="newQStyle"><option value="dark">Nền tối (Dark Navy)</option><option value="light">Nền sáng (White)</option></select>
                        </div>
                    </div>
                    <button class="cms-btn cms-btn-accent" id="btnAddQuote"><i class="fa-solid fa-plus"></i> Tải lên & Thêm Quote</button>
                </div>
            </div>
        `;

        document.getElementById('cmsEditLangSelect').onchange = (e) => {
            editingLang = e.target.value;
            renderContentTab();
        };

        pane.querySelectorAll('[data-cms-text-key]').forEach(el => {
            el.addEventListener('input', () => {
                const key = el.getAttribute('data-cms-text-key');
                if (!cmsState.textOverrides[editingLang]) cmsState.textOverrides[editingLang] = {};
                cmsState.textOverrides[editingLang][key] = el.value;
                saveState(true);
                applyTextOverridesToDom(document.documentElement.lang || 'vi');
            });
        });

        document.getElementById('btnAddQuote').onclick = async () => {
            const author = document.getElementById('newQAuthor').value.trim();
            const role = document.getElementById('newQRole').value.trim();
            const text = document.getElementById('newQText').value.trim();
            const style = document.getElementById('newQStyle').value;
            const fileInput = document.getElementById('newQAvatarFile');
            if (!author || !text) {
                showToast('Vui lòng nhập Tên tác giả và Nội dung Quote!', 'error');
                return;
            }
            let avatar = 'images/avatar1_2.jpg';
            if (fileInput.files && fileInput.files[0]) {
                avatar = await compressImageFile(fileInput.files[0], 600, 0.85);
            }
            cmsState.customQuotes.push({
                id: 'q_' + Date.now(),
                author,
                role: role || 'BKFASI Leadership',
                text: `“${text.replace(/^“|”$/g, '')}”`,
                avatar,
                style
            });
            saveState();
            renderCustomQuotesToDom();
            renderContentTab();
        };
    }

    window._cmsDelQuote = (id) => {
        cmsState.customQuotes = cmsState.customQuotes.filter(q => q.id !== id);
        saveState();
        renderCustomQuotesToDom();
        renderContentTab();
    };
    window._cmsUpdateQuote = (id, field, val) => {
        const q = cmsState.customQuotes.find(x => x.id === id);
        if (q) {
            q[field] = val;
            saveState();
            renderCustomQuotesToDom();
        }
    };

    // --- TAB 2: Hình ảnh Web ---
    function renderImagesTab() {
        const pane = document.getElementById('tabImages');
        const cards = IMAGE_SLOTS.map(slot => {
            const cur = cmsState.imageOverrides[slot.key] || slot.defaultSrc;
            return `
                <div class="cms-img-item">
                    <div class="cms-img-preview">
                        <img src="${cur}" alt="${slot.label}">
                    </div>
                    <div class="cms-img-body">
                        <div class="cms-img-label">${slot.label}</div>
                        <div class="cms-img-actions">
                            <label class="cms-btn cms-btn-primary cms-btn-sm" style="cursor:pointer;">
                                <i class="fa-solid fa-upload"></i> Thay ảnh
                                <input type="file" accept="image/*" style="display:none;" data-img-upload="${slot.key}">
                            </label>
                            ${cmsState.imageOverrides[slot.key] ? `<button class="cms-btn cms-btn-outline cms-btn-sm" data-img-reset="${slot.key}"><i class="fa-solid fa-rotate-left"></i> Gốc</button>` : ''}
                        </div>
                    </div>
                </div>`;
        }).join('');

        pane.innerHTML = `
            <div class="cms-section-head">
                <h3>Thay đổi Hình ảnh Website</h3>
                <span style="font-size:0.84rem;color:#64748b;">Ảnh tải lên tự động được tối ưu kích thước</span>
            </div>
            <div class="cms-grid-3">${cards}</div>
        `;

        pane.querySelectorAll('[data-img-upload]').forEach(inp => {
            inp.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const key = inp.getAttribute('data-img-upload');
                const dataUrl = await compressImageFile(file, 1400, 0.85);
                cmsState.imageOverrides[key] = dataUrl;
                saveState();
                applyImageOverridesToDom();
                renderImagesTab();
            };
        });

        pane.querySelectorAll('[data-img-reset]').forEach(btn => {
            btn.onclick = () => {
                const key = btn.getAttribute('data-img-reset');
                delete cmsState.imageOverrides[key];
                saveState();
                applyImageOverridesToDom();
                renderImagesTab();
            };
        });
    }

    // --- TAB 3: Tab & Menu ---
    function renderTabsManager() {
        const pane = document.getElementById('tabTabs');
        const pTabsHtml = cmsState.projectTabs.map((t, idx) => `
            <div class="cms-tab-row">
                <div style="text-align:center;font-size:1.1rem;color:#004b93;"><i class="${t.icon || 'fa-solid fa-folder'}"></i></div>
                <input type="text" value="${(t.labels && t.labels.vi) || ''}" placeholder="Tên tiếng Việt" onchange="window._cmsUpdateProjTab(${idx},'vi',this.value)">
                <input type="text" value="${(t.labels && t.labels.en) || ''}" placeholder="English name" onchange="window._cmsUpdateProjTab(${idx},'en',this.value)">
                <label class="cms-switch">
                    <input type="checkbox" ${t.visible !== false ? 'checked' : ''} ${t.isCore ? 'disabled' : ''} onchange="window._cmsToggleProjTab(${idx},this.checked)">
                    <span class="cms-switch-slider"></span>
                    <span>${t.visible !== false ? 'Hiện' : 'Ẩn'}</span>
                </label>
                ${!t.isCore && !t.isDefault ? `<button class="cms-btn cms-btn-danger cms-btn-sm" onclick="window._cmsDelProjTab(${idx})"><i class="fa-solid fa-trash"></i></button>` : '<span style="font-size:0.75rem;color:#94a3b8;">Mặc định</span>'}
            </div>`).join('');

        const navTabsHtml = cmsState.navTabs.map((nt, idx) => `
            <div class="cms-tab-row" style="grid-template-columns:1fr 1fr auto;">
                <div><strong>${nt.label}</strong> <small style="color:#64748b;">(${nt.href || '#custom_sec_' + nt.id})</small></div>
                <div style="font-size:0.82rem;color:#475569;">${nt.sectionTitle || 'Liên kết ngoài / Neo'}</div>
                <button class="cms-btn cms-btn-danger cms-btn-sm" onclick="window._cmsDelNavTab(${idx})"><i class="fa-solid fa-trash"></i> Xóa</button>
            </div>`).join('');

        pane.innerHTML = `
            <div class="cms-section-head"><h3>Quản lý Tab Danh mục & Menu</h3></div>
            <div class="cms-card">
                <div class="cms-card-title"><span>1. Tab Lọc Video Dự án</span></div>
                ${pTabsHtml}
                <div style="border-top:1px dashed #cbd5e1;padding-top:14px;margin-top:14px;">
                    <div class="cms-grid-3">
                        <div class="cms-field"><label>Tên Tab (Tiếng Việt) *</label><input type="text" id="newPTabVi" placeholder="VD: Robot Dịch Vụ"></div>
                        <div class="cms-field"><label>Tên Tab (English)</label><input type="text" id="newPTabEn" placeholder="VD: Service Robots"></div>
                        <div class="cms-field"><label>Icon FontAwesome</label><input type="text" id="newPTabIcon" value="fa-solid fa-robot"></div>
                    </div>
                    <button class="cms-btn cms-btn-primary" id="btnAddPTab"><i class="fa-solid fa-plus"></i> Thêm Tab Dự Án</button>
                </div>
            </div>

            <div class="cms-card">
                <div class="cms-card-title"><span>2. Thêm Tab Menu Mới trên Thanh Điều Hướng</span></div>
                ${navTabsHtml || '<p style="font-size:0.85rem;color:#64748b;margin-bottom:12px;">Chưa có tab menu bổ sung nào.</p>'}
                <div style="border-top:1px dashed #cbd5e1;padding-top:14px;margin-top:10px;">
                    <div class="cms-grid-2">
                        <div class="cms-field"><label>Tên Tab trên Menu *</label><input type="text" id="newNavLabel" placeholder="VD: Tuyển Dụng / Tài Liệu"></div>
                        <div class="cms-field"><label>Link đích (Để trống nếu muốn tự tạo mục nội dung mới)</label><input type="text" id="newNavHref" placeholder="VD: https://... hoặc để trống"></div>
                    </div>
                    <div class="cms-field"><label>Tiêu đề mục nội dung mới (nếu tạo mục trên trang)</label><input type="text" id="newNavSecTitle" placeholder="VD: Cơ Hội Nghề Nghiệp Tại BKFASI"></div>
                    <div class="cms-field"><label>Nội dung mục mới</label><textarea id="newNavSecContent" rows="3" placeholder="Nhập nội dung bài viết cho tab này..."></textarea></div>
                    <button class="cms-btn cms-btn-accent" id="btnAddNavTab"><i class="fa-solid fa-plus"></i> Thêm Tab Menu</button>
                </div>
            </div>
        `;

        document.getElementById('btnAddPTab').onclick = () => {
            const vi = document.getElementById('newPTabVi').value.trim();
            const en = document.getElementById('newPTabEn').value.trim() || vi;
            const icon = document.getElementById('newPTabIcon').value.trim() || 'fa-solid fa-folder';
            if (!vi) return showToast('Vui lòng nhập tên Tab!', 'error');
            const id = 'tab_' + Date.now();
            cmsState.projectTabs.push({
                id, icon, visible: true, isDefault: false,
                labels: { vi, en, zh: en, ja: en, ko: en }
            });
            saveState();
            renderProjectsSectionToDom();
            renderTabsManager();
        };

        document.getElementById('btnAddNavTab').onclick = () => {
            const label = document.getElementById('newNavLabel').value.trim();
            const href = document.getElementById('newNavHref').value.trim();
            const sectionTitle = document.getElementById('newNavSecTitle').value.trim();
            const sectionContent = document.getElementById('newNavSecContent').value.trim();
            if (!label) return showToast('Vui lòng nhập tên Tab Menu!', 'error');
            cmsState.navTabs.push({ id: Date.now(), label, href, sectionTitle, sectionContent, visible: true });
            saveState();
            renderCustomNavTabsToDom();
            renderTabsManager();
        };
    }

    window._cmsUpdateProjTab = (idx, lang, val) => {
        if (!cmsState.projectTabs[idx].labels) cmsState.projectTabs[idx].labels = {};
        cmsState.projectTabs[idx].labels[lang] = val;
        saveState();
        renderProjectsSectionToDom();
    };
    window._cmsToggleProjTab = (idx, checked) => {
        cmsState.projectTabs[idx].visible = checked;
        saveState();
        renderProjectsSectionToDom();
        renderTabsManager();
    };
    window._cmsDelProjTab = (idx) => {
        cmsState.projectTabs.splice(idx, 1);
        saveState();
        renderProjectsSectionToDom();
        renderTabsManager();
    };
    window._cmsDelNavTab = (idx) => {
        cmsState.navTabs.splice(idx, 1);
        saveState();
        renderCustomNavTabsToDom();
        renderTabsManager();
    };

    // --- TAB 4: Video Dự án (Upload, Ẩn/Hiện, Sửa mô tả) ---
    function renderVideosManager() {
        const pane = document.getElementById('tabVideos');
        const all = getAllEffectiveProjects();
        const catOptions = cmsState.projectTabs.filter(t => t.id !== 'all').map(t =>
            `<option value="${t.id}">${(t.labels && t.labels.vi) || t.id}</option>`
        ).join('');

        let editBoxHtml = '';
        if (editingVideoId) {
            const p = all.find(x => x.id === editingVideoId);
            if (p) {
                const tVi = (p.titles && p.titles.vi) || getEffectiveText('vi', p.id + '_t', '');
                const dVi = (p.descs && p.descs.vi) || getEffectiveText('vi', p.id + '_d', '');
                const tEn = (p.titles && p.titles.en) || getEffectiveText('en', p.id + '_t', '');
                const dEn = (p.descs && p.descs.en) || getEffectiveText('en', p.id + '_d', '');
                const editCatOpts = cmsState.projectTabs.filter(t => t.id !== 'all').map(t =>
                    `<option value="${t.id}" ${p.category === t.id ? 'selected' : ''}>${(t.labels && t.labels.vi) || t.id}</option>`
                ).join('');
                editBoxHtml = `
                    <div class="cms-card" style="border:2px solid #004b93;background:#eff6ff;">
                        <div class="cms-card-title">
                            <span><i class="fa-solid fa-pen"></i> Đang sửa video: ${p.id}</span>
                            <button class="cms-btn cms-btn-outline cms-btn-sm" onclick="window._cmsCancelEditVideo()">Đóng</button>
                        </div>
                        <div class="cms-grid-3">
                            <div class="cms-field"><label>Danh mục (Tab)</label><select id="evCat">${editCatOpts}</select></div>
                            <div class="cms-field"><label>Đối tác / Khách hàng</label><input type="text" id="evPartner" value="${p.partner || ''}"></div>
                            <div class="cms-field"><label>Thời lượng / Chất lượng</label><input type="text" id="evDur" value="${p.duration || '01:00'}"></div>
                        </div>
                        <div class="cms-grid-2">
                            <div class="cms-field"><label>Tiêu đề (Tiếng Việt)</label><input type="text" id="evTitleVi" value="${tVi.replace(/"/g, '&quot;')}"></div>
                            <div class="cms-field"><label>Title (English)</label><input type="text" id="evTitleEn" value="${tEn.replace(/"/g, '&quot;')}"></div>
                        </div>
                        <div class="cms-grid-2">
                            <div class="cms-field"><label>Mô tả chi tiết (Tiếng Việt)</label><textarea id="evDescVi" rows="3">${dVi}</textarea></div>
                            <div class="cms-field"><label>Description (English)</label><textarea id="evDescEn" rows="3">${dEn}</textarea></div>
                        </div>
                        <div class="cms-grid-2">
                            <div class="cms-field"><label>Tags công nghệ (cách nhau dấu phẩy)</label><input type="text" id="evTech" value="${(p.tech || []).join(', ')}"></div>
                            <div class="cms-field"><label>Đổi ảnh Thumbnail (tùy chọn)</label><input type="file" id="evThumbFile" accept="image/*"></div>
                        </div>
                        <button class="cms-btn cms-btn-primary" onclick="window._cmsSaveEditVideo('${p.id}', ${!!p.isCustom})"><i class="fa-solid fa-check"></i> Lưu thông tin Video</button>
                    </div>`;
            }
        }

        const rowsHtml = all.map(p => {
            const title = (p.titles && p.titles.vi) || getEffectiveText('vi', p.id + '_t', p.id);
            const desc = (p.descs && p.descs.vi) || getEffectiveText('vi', p.id + '_d', '');
            return `
                <div class="cms-video-row ${p.visible ? '' : 'is-hidden'}">
                    <img src="${p.thumb || 'images/banner1.jpg'}" class="cms-vrow-thumb" alt="${title}">
                    <div class="cms-vrow-info">
                        <h4>${title} ${p.isCustom ? '<span style="background:#f77f00;color:#fff;font-size:0.7rem;padding:2px 6px;border-radius:4px;margin-left:6px;">Mới Upload</span>' : ''}</h4>
                        <div class="cms-vrow-meta">
                            <span><i class="fa-solid fa-building"></i> ${p.partner || 'BKFASI'}</span>
                            <span><i class="fa-solid fa-tag"></i> ${p.category}</span>
                            <span><i class="fa-regular fa-clock"></i> ${p.duration || '01:00'}</span>
                        </div>
                        <div class="cms-vrow-desc">${desc}</div>
                    </div>
                    <div class="cms-vrow-controls">
                        <label class="cms-switch" title="Bật/Tắt hiển thị video trên web">
                            <input type="checkbox" ${p.visible ? 'checked' : ''} onchange="window._cmsToggleVideo('${p.id}', ${!!p.isCustom}, this.checked)">
                            <span class="cms-switch-slider"></span>
                            <span>${p.visible ? 'Hiện' : 'Ẩn'}</span>
                        </label>
                        <button class="cms-btn cms-btn-outline cms-btn-sm" onclick="window._cmsStartEditVideo('${p.id}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                        ${p.isCustom ? `<button class="cms-btn cms-btn-danger cms-btn-sm" onclick="window._cmsDeleteVideo('${p.id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                </div>`;
        }).join('');

        pane.innerHTML = `
            <div class="cms-section-head">
                <h3>Quản lý & Upload Video Dự Án (${all.filter(x => x.visible).length}/${all.length} đang hiển thị)</h3>
            </div>

            ${editBoxHtml}

            <div class="cms-card">
                <div class="cms-card-title"><span><i class="fa-solid fa-cloud-arrow-up"></i> Upload Video Dự Án Mới</span></div>
                <div class="cms-grid-2">
                    <div class="cms-field"><label>Chọn file Video (.mp4, .webm) *</label><input type="file" id="upVidFile" accept="video/mp4,video/webm,video/*"></div>
                    <div class="cms-field"><label>Ảnh Thumbnail (Để trống để tự chụp từ video)</label><input type="file" id="upVidThumb" accept="image/*"></div>
                </div>
                <div class="cms-grid-3">
                    <div class="cms-field"><label>Danh mục (Tab)</label><select id="upVidCat">${catOptions}</select></div>
                    <div class="cms-field"><label>Đối tác / Nhà máy</label><input type="text" id="upVidPartner" placeholder="VD: Samsung / Dreamtech"></div>
                    <div class="cms-field"><label>Tags công nghệ (cách nhau dấu phẩy)</label><input type="text" id="upVidTech" placeholder="VD: Cobot, PLC Siemens, Vision"></div>
                </div>
                <div class="cms-grid-2">
                    <div class="cms-field"><label>Tên dự án (Tiếng Việt) *</label><input type="text" id="upVidTitleVi" placeholder="Nhập tên dự án..."></div>
                    <div class="cms-field"><label>Project Title (English)</label><input type="text" id="upVidTitleEn" placeholder="English title..."></div>
                </div>
                <div class="cms-field"><label>Mô tả kỹ thuật chi tiết</label><textarea id="upVidDescVi" rows="2" placeholder="Mô tả giải pháp tự động hóa đã triển khai..."></textarea></div>
                <button class="cms-btn cms-btn-accent" id="btnUploadNewVideo"><i class="fa-solid fa-upload"></i> Tải Video Lên Website</button>
            </div>

            <div class="cms-video-list">${rowsHtml}</div>
        `;

        document.getElementById('btnUploadNewVideo').onclick = async () => {
            const file = document.getElementById('upVidFile').files[0];
            const titleVi = document.getElementById('upVidTitleVi').value.trim();
            if (!file) return showToast('Vui lòng chọn file video!', 'error');
            if (!titleVi) return showToast('Vui lòng nhập Tên dự án!', 'error');

            showToast('Đang xử lý video & tạo thumbnail...', 'info');
            const meta = await extractVideoMetaAndThumb(file);
            let thumb = meta.thumb;
            const customThumbFile = document.getElementById('upVidThumb').files[0];
            if (customThumbFile) {
                thumb = await compressImageFile(customThumbFile, 800, 0.82);
            }

            const id = 'prj_custom_' + Date.now();
            const dbKey = 'vid_' + id;
            await MediaDB.put(dbKey, file);

            const titleEn = document.getElementById('upVidTitleEn').value.trim() || titleVi;
            const descVi = document.getElementById('upVidDescVi').value.trim() || 'Giải pháp tự động hóa công nghiệp triển khai bởi BKFASI.';
            const techRaw = document.getElementById('upVidTech').value.trim();
            const tech = techRaw ? techRaw.split(',').map(s => s.trim()).filter(Boolean) : ['BKFASI Automation'];

            cmsState.customVideos.unshift({
                id,
                dbKey,
                file: '',
                thumb,
                category: document.getElementById('upVidCat').value || 'electronics',
                partner: document.getElementById('upVidPartner').value.trim() || 'BKFASI Partner',
                duration: meta.duration,
                quality: meta.quality,
                tech,
                visible: true,
                titles: { vi: titleVi, en: titleEn, zh: titleEn, ja: titleEn, ko: titleEn },
                descs: { vi: descVi, en: descVi, zh: descVi, ja: descVi, ko: descVi }
            });
            saveState();
            renderProjectsSectionToDom();
            renderVideosManager();
            showToast('Đã upload video mới lên mục Dự án!', 'success');
        };
    }

    window._cmsToggleVideo = (id, isCustom, checked) => {
        if (isCustom) {
            const cv = cmsState.customVideos.find(v => v.id === id);
            if (cv) cv.visible = checked;
        } else {
            if (!cmsState.videoOverrides[id]) cmsState.videoOverrides[id] = {};
            cmsState.videoOverrides[id].visible = checked;
        }
        saveState();
        renderProjectsSectionToDom();
        renderVideosManager();
    };

    window._cmsStartEditVideo = (id) => {
        editingVideoId = id;
        renderVideosManager();
        document.querySelector('.cms-content').scrollTo({ top: 0, behavior: 'smooth' });
    };

    window._cmsCancelEditVideo = () => {
        editingVideoId = null;
        renderVideosManager();
    };

    window._cmsSaveEditVideo = async (id, isCustom) => {
        const category = document.getElementById('evCat').value;
        const partner = document.getElementById('evPartner').value.trim();
        const duration = document.getElementById('evDur').value.trim();
        const tVi = document.getElementById('evTitleVi').value.trim();
        const tEn = document.getElementById('evTitleEn').value.trim();
        const dVi = document.getElementById('evDescVi').value.trim();
        const dEn = document.getElementById('evDescEn').value.trim();
        const tech = document.getElementById('evTech').value.split(',').map(s => s.trim()).filter(Boolean);
        const thumbFile = document.getElementById('evThumbFile').files[0];

        let newThumb = null;
        if (thumbFile) newThumb = await compressImageFile(thumbFile, 800, 0.82);

        if (isCustom) {
            const cv = cmsState.customVideos.find(v => v.id === id);
            if (cv) {
                cv.category = category;
                cv.partner = partner;
                cv.duration = duration;
                cv.tech = tech;
                cv.titles = { ...(cv.titles || {}), vi: tVi, en: tEn };
                cv.descs = { ...(cv.descs || {}), vi: dVi, en: dEn };
                if (newThumb) cv.thumb = newThumb;
            }
        } else {
            const prev = cmsState.videoOverrides[id] || {};
            cmsState.videoOverrides[id] = {
                ...prev,
                category, partner, duration, tech,
                titles: { ...(prev.titles || {}), vi: tVi, en: tEn },
                descs: { ...(prev.descs || {}), vi: dVi, en: dEn }
            };
            if (newThumb) cmsState.videoOverrides[id].thumb = newThumb;
        }

        editingVideoId = null;
        saveState();
        renderProjectsSectionToDom();
        renderVideosManager();
    };

    window._cmsDeleteVideo = async (id) => {
        const cv = cmsState.customVideos.find(v => v.id === id);
        if (cv && cv.dbKey) await MediaDB.del(cv.dbKey).catch(() => {});
        cmsState.customVideos = cmsState.customVideos.filter(v => v.id !== id);
        saveState();
        renderProjectsSectionToDom();
        renderVideosManager();
    };

    // --- TAB 5: Xuất bản & Bảo mật ---
    function renderPublishTab() {
        const pane = document.getElementById('tabPublish');
        const savedToken = localStorage.getItem(GITHUB_TOKEN_KEY) || '';
        pane.innerHTML = `
            <div class="cms-section-head"><h3>Xuất bản lên GitHub Pages & Bảo mật</h3></div>

            <div class="cms-card">
                <div class="cms-card-title"><span><i class="fa-brands fa-github"></i> Đồng bộ trực tiếp lên GitHub Pages (bkfasidata/bkfasiweb)</span></div>
                <p style="font-size:0.86rem;color:#475569;margin-bottom:14px;line-height:1.55;">
                    Khi chỉnh sửa trên trình duyệt, dữ liệu mới chỉ lưu cục bộ để bạn xem trước. Để <strong>mọi khách truy cập trên Internet</strong> đều thấy nội dung, ảnh, tab, quotes và trạng thái ẩn/hiện video mới, hãy kết nối GitHub Personal Access Token (chỉ lưu trên trình duyệt của bạn) để đẩy file <code>js/cms-overrides.js</code> lên GitHub.
                </p>
                <div class="cms-field">
                    <label>GitHub Personal Access Token (quyền repo)</label>
                    <input type="password" id="ghPatInput" value="${savedToken}" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="cms-btn cms-btn-primary" id="btnPushGitHub"><i class="fa-solid fa-cloud-arrow-up"></i> Xuất bản lên GitHub Ngay</button>
                    <button class="cms-btn cms-btn-outline" id="btnDownloadOverrides"><i class="fa-solid fa-download"></i> Tải file cms-overrides.js</button>
                </div>
            </div>

            <div class="cms-card">
                <div class="cms-card-title"><span><i class="fa-solid fa-key"></i> Đổi mật khẩu Admin & Sao lưu</span></div>
                <div class="cms-grid-2">
                    <div class="cms-field">
                        <label>Mật khẩu Admin mới</label>
                        <input type="password" id="newAdminPass" placeholder="Nhập mật khẩu mới...">
                    </div>
                    <div style="display:flex;align-items:flex-end;padding-bottom:16px;">
                        <button class="cms-btn cms-btn-success" id="btnSavePass"><i class="fa-solid fa-check"></i> Cập nhật mật khẩu</button>
                    </div>
                </div>
                <div style="border-top:1px solid #e2e8f0;padding-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="cms-btn cms-btn-outline" id="btnExportJson"><i class="fa-solid fa-file-export"></i> Sao lưu JSON</button>
                    <button class="cms-btn cms-btn-danger" id="btnResetCms"><i class="fa-solid fa-triangle-exclamation"></i> Khôi phục toàn bộ về mặc định gốc</button>
                </div>
            </div>
        `;

        document.getElementById('btnSavePass').onclick = () => {
            const np = document.getElementById('newAdminPass').value.trim();
            if (np.length < 4) return showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'error');
            cmsState.adminPass = np;
            saveState();
            document.getElementById('newAdminPass').value = '';
            showToast('Đã đổi mật khẩu Admin thành công!', 'success');
        };

        document.getElementById('btnDownloadOverrides').onclick = () => {
            const exportObj = { ...cmsState };
            delete exportObj.adminPass;
            const content = `/** BKFASI CMS Published Overrides */\nwindow.BKFASI_CMS_PUBLISHED = ${JSON.stringify(exportObj, null, 2)};\n`;
            const blob = new Blob([content], { type: 'application/javascript' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'cms-overrides.js';
            a.click();
        };

        document.getElementById('btnExportJson').onclick = () => {
            const blob = new Blob([JSON.stringify(cmsState, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `bkfasi-cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
        };

        document.getElementById('btnResetCms').onclick = () => {
            if (!confirm('Bạn có chắc muốn xóa toàn bộ chỉnh sửa cục bộ và khôi phục giao diện gốc?')) return;
            localStorage.removeItem(STORAGE_KEY);
            cmsState = createEmptyState();
            applyAllToDOM();
            renderPublishTab();
            showToast('Đã khôi phục về mặc định gốc!', 'info');
        };

        document.getElementById('btnPushGitHub').onclick = async () => {
            const token = document.getElementById('ghPatInput').value.trim();
            if (!token) return showToast('Vui lòng nhập GitHub Personal Access Token!', 'error');
            localStorage.setItem(GITHUB_TOKEN_KEY, token);

            showToast('Đang đẩy thay đổi lên GitHub...', 'info');
            try {
                const apiUrl = 'https://api.github.com/repos/bkfasidata/bkfasiweb/contents/js/cms-overrides.js';
                const getRes = await fetch(apiUrl, { headers: { Authorization: `token ${token}` } });
                let sha = null;
                if (getRes.ok) {
                    const meta = await getRes.json();
                    sha = meta.sha;
                }
                const exportObj = { ...cmsState };
                delete exportObj.adminPass;
                const fileStr = `/** BKFASI CMS Published Overrides */\nwindow.BKFASI_CMS_PUBLISHED = ${JSON.stringify(exportObj, null, 2)};\n`;
                const b64 = btoa(unescape(encodeURIComponent(fileStr)));

                const putRes = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        Authorization: `token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: 'Update website content via BKFASI Admin CMS',
                        content: b64,
                        sha: sha || undefined
                    })
                });
                if (!putRes.ok) {
                    const err = await putRes.json();
                    throw new Error(err.message || 'GitHub API error');
                }
                showToast('Đã xuất bản lên GitHub thành công! Web sẽ cập nhật sau 1-2 phút.', 'success');
            } catch (err) {
                showToast('Lỗi đẩy GitHub: ' + err.message, 'error');
            }
        };
    }

    // ==========================================
    // 8. Initialize CMS on DOM Ready
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        injectAdminUI();
        applyAllToDOM();

        // Hook into language selector changes so CMS overrides re-apply immediately
        const langSelect = document.getElementById('langSelect');
        const mobileLangSelect = document.getElementById('mobileLangSelect');
        [langSelect, mobileLangSelect].forEach(sel => {
            if (sel) {
                sel.addEventListener('change', () => {
                    setTimeout(() => applyAllToDOM(), 20);
                });
            }
        });
    });
})();
