/**
 * LEÓN FELDMAN REINOSO — MOTOR DEL SITIO PÚBLICO
 * Consume la API REST del backend Node.js en tiempo real
 */

const STATE = {
    portfolio: null,
    activeFilter: 'all',
    layoutMode: localStorage.getItem('leon_layout_mode') || 'contact-sheet',
    lang: localStorage.getItem('leon_lang') || 'es',
    darkroom: localStorage.getItem('leon_darkroom') === 'true',
    activeLightboxIndex: 0,
    audioCtx: null
};

// Traducciones de la UI
const TRANSLATIONS = {
    es: {
        all: "Todas",
        view: "Vista:",
        contactSheet: "🎞️ Hoja de Contactos 35mm",
        editorial: "🖼️ Editorial",
        enterProjects: "✦ Desplegar Película 35mm — Entrar a Proyectos ✦",
        explore: "Explorar Obras ✦",
        contactDirect: "Contacto Directo",
        aboutEyebrow: "AUTOR & DECLARACIÓN",
        contactEyebrow: "CONTACTO DIRECTO",
        contactHeading: "Conversemos sobre tu visión",
        nameLabel: "Nombre Completo *",
        emailLabel: "Correo Electrónico *",
        msgLabel: "Detalles de la Consulta *",
        sendMsg: "Enviar Mensaje ✦",
        safeLightOn: "Luz Normal",
        safeLightOff: "Cuarto Oscuro"
    },
    en: {
        all: "All",
        view: "View:",
        contactSheet: "🎞️ 35mm Contact Sheet",
        editorial: "🖼️ Editorial",
        enterProjects: "✦ Pull Film Strip — Enter Projects ✦",
        explore: "Explore Works ✦",
        contactDirect: "Direct Contact",
        aboutEyebrow: "AUTHOR & STATEMENT",
        contactEyebrow: "DIRECT INQUIRIES",
        contactHeading: "Let's discuss your visual project",
        nameLabel: "Full Name *",
        emailLabel: "Email Address *",
        msgLabel: "Project Details *",
        sendMsg: "Send Message ✦",
        safeLightOn: "Normal Light",
        safeLightOff: "Darkroom Safe-Light"
    }
};

// Sonido sintético de obturador de cámara analógica
function playShutterSound() {
    try {
        if (!STATE.audioCtx) {
            STATE.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (STATE.audioCtx.state === 'suspended') {
            STATE.audioCtx.resume();
        }
        const ctx = STATE.audioCtx;
        const bufferSize = ctx.sampleRate * 0.04;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1400;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    } catch (e) {
        // Audio opcional
    }
}

// Cargar datos desde el Backend REST
async function loadPortfolioData() {
    try {
        const res = await fetch('/api/portfolio');
        if (!res.ok) throw new Error('Error al conectar con la API');
        STATE.portfolio = await res.json();
        
        applySettings();
        renderTexts();
        renderCategories();
        renderGallery();
    } catch (err) {
        console.error('Error cargando portfolio:', err);
    }
}

// Aplicar estilos personalizados del backend (tipografía, tamaño, portada)
function applySettings() {
    if (!STATE.portfolio || !STATE.portfolio.settings) return;
    const s = STATE.portfolio.settings;

    if (s.fontFamilyTitle) {
        document.documentElement.style.setProperty('--font-editorial', s.fontFamilyTitle);
    }
    if (s.fontSizeBase) {
        document.documentElement.style.setProperty('--font-size-root', s.fontSizeBase);
    }
    if (s.coverPhoto) {
        const heroImg = document.getElementById('hero-bg-img');
        if (heroImg) heroImg.src = s.coverPhoto;
    }
}

// Renderizar textos de autor en el Hero y Sobre Mí
function renderTexts() {
    if (!STATE.portfolio || !STATE.portfolio.author) return;
    const a = STATE.portfolio.author;
    const isEs = STATE.lang === 'es';

    const brandName = document.getElementById('nav-brand-name');
    if (brandName) brandName.textContent = a.name || 'LEÓN FELDMAN REINOSO';

    const heroTitle = document.getElementById('hero-title-display');
    if (heroTitle) heroTitle.textContent = a.name || 'LEÓN FELDMAN REINOSO';

    const heroTagline = document.getElementById('hero-tagline-display');
    if (heroTagline) {
        const tagline = isEs ? (a.tagline_es || a.statement) : (a.tagline_en || a.statement);
        if (tagline && tagline.trim()) {
            heroTagline.textContent = `"${tagline}"`;
            heroTagline.style.display = 'block';
        } else {
            heroTagline.style.display = 'none';
        }
    }

    const aboutTitle = document.getElementById('about-title-display');
    if (aboutTitle) aboutTitle.textContent = a.name || 'León Feldman Reinoso';

    const aboutBio = document.getElementById('about-bio-display');
    if (aboutBio) {
        aboutBio.textContent = a.bio || '';
    }

    // Datos de contacto
    if (a.contact) {
        const emailEl = document.getElementById('contact-email-display');
        const instaEl = document.getElementById('contact-insta-display');
        const locEl = document.getElementById('contact-loc-display');
        if (emailEl) emailEl.textContent = a.contact.email || 'leonfeldman.foto@gmail.com';
        if (instaEl) instaEl.textContent = a.contact.instagram || '@leonfeldman.ph';
        if (locEl) locEl.textContent = a.contact.location || 'Buenos Aires, Argentina';
    }
}

// Renderizar filtros de categorías activos
function renderCategories() {
    const container = document.getElementById('filter-container');
    if (!container || !STATE.portfolio) return;

    const allPhotos = getAllPhotos();
    const activeGenres = STATE.portfolio.settings?.activeGenres || ['analogicas', 'retratos', 'moda', 'calle', 'natura', 'shows'];

    const genreLabels = {
        all: STATE.lang === 'es' ? 'Todas' : 'All',
        analogicas: 'Analógicas',
        retratos: 'Retratos',
        moda: 'Moda & Editorial',
        calle: 'Calle / Urbana',
        natura: 'Natura & Paisaje',
        shows: 'Shows & Música'
    };

    let html = `<button type="button" class="btn-toggle ${STATE.activeFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">${genreLabels.all} (${allPhotos.length})</button>`;

    activeGenres.forEach(genre => {
        const count = allPhotos.filter(p => (p.category || '').toLowerCase() === genre.toLowerCase()).length;
        if (count > 0 || genre === 'analogicas') {
            html += `<button type="button" class="btn-toggle ${STATE.activeFilter === genre ? 'active' : ''}" onclick="setFilter('${genre}')">${genreLabels[genre] || genre}</button>`;
        }
    });

    container.innerHTML = html;
}

function getAllPhotos() {
    if (!STATE.portfolio || !STATE.portfolio.series) return [];
    const photos = [];
    STATE.portfolio.series.forEach(s => {
        if (s.photos) {
            s.photos.forEach(p => photos.push({ ...p, seriesName: s.name, seriesId: s.id }));
        }
    });
    return photos;
}

// Renderizar Galería (Hoja de Contactos vs Editorial)
function renderGallery() {
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    const allPhotos = getAllPhotos();
    const filtered = (STATE.activeFilter === 'all')
        ? allPhotos
        : allPhotos.filter(p => (p.category || p.seriesId || '').toLowerCase() === STATE.activeFilter.toLowerCase());

    grid.innerHTML = '';
    const isContact = STATE.layoutMode === 'contact-sheet';

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);" class="font-mono">No hay obras registradas en este género.</div>`;
        return;
    }

    filtered.forEach((photo, idx) => {
        const card = document.createElement('div');
        const frameNum = String(idx + 1).padStart(2, '0') + 'A';
        const filmInfo = photo.film || '35mm CELULOIDE';
        const displayTitle = (photo.title && !photo.title.toLowerCase().startsWith('obra analógica') && !photo.title.toLowerCase().startsWith('serie urbana')) ? photo.title : '';

        if (isContact) {
            card.className = 'contact-sheet-card';
            card.onclick = () => openLightbox(idx, filtered);
            card.innerHTML = `
                <span class="contact-frame-num">${frameNum}</span>
                <span class="contact-film-stock">${photo.category || '35MM'}</span>
                <div class="contact-img-wrap">
                    <img src="/${photo.url || photo.src}" alt="${displayTitle || 'Fotografía 35mm'}" loading="lazy">
                </div>
                <div class="contact-meta">
                    ${displayTitle ? `<span class="contact-title">${displayTitle}</span>` : ''}
                    <span style="color: var(--accent); font-size: 0.65rem;">${filmInfo}</span>
                </div>
            `;
        } else {
            card.className = `editorial-card ${photo.orientation === 'horizontal' ? 'horizontal' : ''}`;
            card.onclick = () => openLightbox(idx, filtered);
            card.innerHTML = `
                <img src="/${photo.url || photo.src}" alt="${displayTitle || 'Fotografía'}" class="editorial-img" loading="lazy">
                <div class="editorial-overlay">
                    <div class="editorial-tag">${photo.category || '35MM'} • ${filmInfo}</div>
                    ${displayTitle ? `<h3 class="editorial-title">${displayTitle}</h3>` : ''}
                </div>
            `;
        }
        grid.appendChild(card);
    });
}

function setFilter(cat) {
    STATE.activeFilter = cat;
    renderCategories();
    renderGallery();
    playShutterSound();
}

function setLayoutMode(mode) {
    STATE.layoutMode = mode;
    localStorage.setItem('leon_layout_mode', mode);

    const btnContact = document.getElementById('btn-view-contact');
    const btnEditorial = document.getElementById('btn-view-editorial');
    if (btnContact) btnContact.classList.toggle('active', mode === 'contact-sheet');
    if (btnEditorial) btnEditorial.classList.toggle('active', mode === 'editorial');

    const grid = document.getElementById('portfolio-grid');
    if (grid) {
        grid.className = 'gallery-grid ' + (mode === 'contact-sheet' ? 'mode-contact-sheet' : 'mode-editorial');
    }
    playShutterSound();
    renderGallery();
}

function setLanguage(lang) {
    STATE.lang = lang;
    localStorage.setItem('leon_lang', lang);

    document.getElementById('btn-lang-es')?.classList.toggle('active', lang === 'es');
    document.getElementById('btn-lang-en')?.classList.toggle('active', lang === 'en');

    renderTexts();
    renderCategories();
    applyUiLanguage();
}

function applyUiLanguage() {
    const t = TRANSLATIONS[STATE.lang];
    const ctaBtn = document.querySelector('.landing-cta-btn');
    if (ctaBtn) ctaBtn.textContent = t.enterProjects;

    const darkroomText = document.getElementById('darkroom-btn-text');
    if (darkroomText) darkroomText.textContent = STATE.darkroom ? t.safeLightOn : t.safeLightOff;
}

// Modo Cuarto Oscuro
function toggleDarkroomMode() {
    STATE.darkroom = !STATE.darkroom;
    localStorage.setItem('leon_darkroom', STATE.darkroom);
    applyDarkroomState();
    playShutterSound();
}

function applyDarkroomState() {
    document.body.classList.toggle('darkroom-mode', STATE.darkroom);
    const darkroomText = document.getElementById('darkroom-btn-text');
    const t = TRANSLATIONS[STATE.lang];
    if (darkroomText) darkroomText.textContent = STATE.darkroom ? t.safeLightOn : t.safeLightOff;
}

// Lightbox
let activeFilteredList = [];
function openLightbox(index, photosList) {
    activeFilteredList = photosList;
    STATE.activeLightboxIndex = index;
    const modal = document.getElementById('lightbox');
    if (!modal) return;

    modal.classList.add('open');
    updateLightboxContent();
}

function closeLightbox() {
    document.getElementById('lightbox')?.classList.remove('open');
}

function prevLightbox() {
    if (activeFilteredList.length === 0) return;
    STATE.activeLightboxIndex = (STATE.activeLightboxIndex - 1 + activeFilteredList.length) % activeFilteredList.length;
    updateLightboxContent();
}

function nextLightbox() {
    if (activeFilteredList.length === 0) return;
    STATE.activeLightboxIndex = (STATE.activeLightboxIndex + 1) % activeFilteredList.length;
    updateLightboxContent();
}

function updateLightboxContent() {
    const photo = activeFilteredList[STATE.activeLightboxIndex];
    if (!photo) return;

    const img = document.getElementById('lightbox-img');
    if (img) img.src = `/${photo.url || photo.src}`;

    const titleEl = document.getElementById('lightbox-title');
    if (titleEl) titleEl.textContent = photo.title || '';

    const filmEl = document.getElementById('lightbox-film');
    const film = photo.film || '35mm CELULOIDE';
    const num = String(STATE.activeLightboxIndex + 1).padStart(2, '0');
    const total = String(activeFilteredList.length).padStart(2, '0');
    if (filmEl) filmEl.textContent = `${film} • FOTOGRAMA ${num} / ${total}`;
}

// Listener de mouse para el spotlight del cuarto oscuro
document.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
});

// Teclado
document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (lb && lb.classList.contains('open')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevLightbox();
        if (e.key === 'ArrowRight') nextLightbox();
    }
});

// Formulario de contacto directo
function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const msg = document.getElementById('form-msg').value;

    const targetEmail = STATE.portfolio?.author?.contact?.email || 'leonfeldman.foto@gmail.com';
    window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent('Consulta de Portfolio - ' + name)}&body=${encodeURIComponent('Nombre: ' + name + '\nEmail: ' + email + '\n\nMensaje:\n' + msg)}`;
}

// Inicialización
window.addEventListener('DOMContentLoaded', async () => {
    await loadPortfolioData();
    applyDarkroomState();
    setLayoutMode(STATE.layoutMode);
    setLanguage(STATE.lang);

    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    setTimeout(() => {
        const p = document.getElementById('preloader');
        if (p) p.classList.add('loaded');
    }, 400);
});
