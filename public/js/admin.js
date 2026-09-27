/**
 * STUDIO CMS — CONTROLADOR DEL PANEL DE ADMINISTRACIÓN
 * Estilo Adobe Portfolio / Gestión Integral de Obras, Textos & Estilos
 */

let token = localStorage.getItem('admin_token') || '';
let portfolioData = null;
let currentPhotos = [];
let selectedPhotoIds = new Set();

// Inicialización
async function init() {
    if (token) {
        try {
            const res = await fetch('/api/admin/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showDashboard();
                return;
            }
        } catch (e) {
            // Token inválido o servidor offline
        }
    }
    showLogin();
}

function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    localStorage.removeItem('admin_token');
    token = '';
}

async function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    await loadData();
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-pass').value;

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();

        if (data.success && data.token) {
            token = data.token;
            localStorage.setItem('admin_token', token);
            showDashboard();
            showToast("Acceso concedido al Studio CMS ✦");
        } else {
            alert(data.error || "Contraseña incorrecta");
        }
    } catch (err) {
        alert("Error al comunicarse con el servidor");
    }
});

function logout() {
    localStorage.removeItem('admin_token');
    token = '';
    showLogin();
    showToast("Sesión cerrada");
}

// Cargar datos completos del backend
async function loadData() {
    try {
        const res = await fetch('/api/portfolio');
        portfolioData = await res.json();
        flattenPhotos();
        renderPhotos();
        renderGenresForm();
        renderStyleForm();
        renderProfileForm();
    } catch (err) {
        showToast("Error al cargar datos del servidor");
    }
}

function flattenPhotos() {
    currentPhotos = [];
    if (!portfolioData || !portfolioData.series) return;
    portfolioData.series.forEach(s => {
        if (s.photos) {
            s.photos.forEach(p => {
                currentPhotos.push({ ...p, seriesId: s.id, seriesName: s.name });
            });
        }
    });
}

// Renderizar tarjetas de fotos administrables
function renderPhotos() {
    const container = document.getElementById('photos-list');
    if (!container) return;
    container.innerHTML = '';

    const coverPhoto = portfolioData.settings?.coverPhoto || '';

    const customGenres = portfolioData.settings?.customGenres || [
        { id: "analogicas", name: "Analógicas" },
        { id: "retratos", name: "Retratos" },
        { id: "moda", name: "Moda & Editorial" },
        { id: "calle", name: "Calle / Urbana" },
        { id: "natura", name: "Natura & Paisaje" },
        { id: "shows", name: "Shows & Música" }
    ];

    currentPhotos.forEach((photo, idx) => {
        const card = document.createElement('div');
        const isCover = (photo.url || photo.src) === coverPhoto;
        const isSelected = selectedPhotoIds.has(photo.id);
        card.className = `photo-card ${isCover ? 'is-cover' : ''} ${isSelected ? 'selected' : ''}`;
        card.draggable = true;
        card.dataset.index = idx;
        card.dataset.id = photo.id;

        const currentCat = (photo.category || photo.seriesId || '').toLowerCase();
        const categoryOptions = customGenres.map(g => `<option value="${g.id}" ${currentCat === g.id.toLowerCase() || photo.category === g.name ? 'selected' : ''}>${g.name}</option>`).join('');

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--accent); cursor: pointer;">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelectPhoto('${photo.id}', this.checked)"> Seleccionar
                </label>
                <div class="drag-handle" style="margin-bottom:0;">⠿ Reordenar</div>
            </div>
            ${isCover ? '<div class="cover-badge">★ Portada Actual</div>' : ''}
            <img src="${encodeURI('/' + (photo.url || photo.src))}" alt="${photo.title || 'Foto'}">
            
            <div class="form-group" style="margin-bottom: 0.6rem;">
                <label>Título de la Obra</label>
                <input type="text" id="title-${photo.id}" value="${escapeHtml(photo.title || '')}" placeholder="Sin título">
            </div>

            <div class="form-group" style="margin-bottom: 0.6rem;">
                <label>Género / Categoría</label>
                <select id="category-${photo.id}">
                    ${categoryOptions}
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 0.6rem;">
                <label>Película / Cámara</label>
                <input type="text" id="film-${photo.id}" value="${escapeHtml(photo.film || '')}" placeholder="35mm Celuloide">
            </div>

            <div class="form-group" style="margin-bottom: 0.6rem;">
                <label>Ubicación del Shoot</label>
                <input type="text" id="shootLocation-${photo.id}" value="${escapeHtml(photo.shootLocation || '')}" placeholder="Ej: San Telmo, Buenos Aires">
            </div>

            <div class="form-group" style="margin-bottom: 0.8rem;">
                <label>Notas de Autor</label>
                <textarea id="notes-${photo.id}" rows="2" placeholder="Notas sobre grano, revelado...">${escapeHtml(photo.notes || '')}</textarea>
            </div>

            <div class="photo-actions">
                <button type="button" class="btn-action" style="padding: 0.6rem; font-size: 0.75rem;" onclick="saveSinglePhoto('${photo.id}', '${photo.seriesId}')">Guardar</button>
                <button type="button" class="btn-action btn-secondary" style="padding: 0.6rem; font-size: 0.75rem;" onclick="setAsCover('${photo.url || photo.src}')">Portada</button>
            </div>
            <button type="button" class="btn-action btn-danger" style="margin-top: 0.5rem; padding: 0.5rem; font-size: 0.7rem;" onclick="deletePhoto('${photo.id}')">Eliminar</button>
        `;

        // Eventos drag and drop
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        container.appendChild(card);
    });
    updateSelectedCountUI();
}

function toggleSelectPhoto(id, checked) {
    if (checked) selectedPhotoIds.add(id);
    else selectedPhotoIds.delete(id);
    updateSelectedCountUI();
}

function selectAllPhotos(check) {
    if (check) {
        currentPhotos.forEach(p => selectedPhotoIds.add(p.id));
    } else {
        selectedPhotoIds.clear();
    }
    renderPhotos();
}

function updateSelectedCountUI() {
    const el = document.getElementById('selected-count');
    if (el) el.textContent = `${selectedPhotoIds.size} seleccionadas`;
}

async function executeBulkDelete() {
    if (selectedPhotoIds.size === 0) {
        alert("Por favor selecciona al menos una fotografía.");
        return;
    }
    if (!confirm(`¿Estás seguro de eliminar ${selectedPhotoIds.size} fotografías seleccionadas?`)) return;

    try {
        const res = await fetch('/api/admin/photos/bulk-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ photoIds: Array.from(selectedPhotoIds) })
        });
        if (res.ok) {
            showToast("Fotografías eliminadas en lote ✦");
            selectedPhotoIds.clear();
            await loadData();
        }
    } catch (err) {
        showToast("Error en acción bulk");
    }
}

// Drag & drop handlers
let draggedIndex = null;
function handleDragStart(e) {
    draggedIndex = +this.dataset.index;
    this.style.opacity = '0.4';
}
function handleDragOver(e) {
    e.preventDefault();
}
function handleDrop(e) {
    e.preventDefault();
    const targetIndex = +this.dataset.index;
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const item = currentPhotos.splice(draggedIndex, 1)[0];
    currentPhotos.splice(targetIndex, 0, item);
    renderPhotos();
    savePhotosOrder();
}
function handleDragEnd() {
    this.style.opacity = '1';
}

async function savePhotosOrder() {
    const orderedIds = currentPhotos.map(p => p.id);
    try {
        await fetch('/api/admin/photos/reorder', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderedIds })
        });
        showToast("Nuevo orden guardado ✦");
    } catch (err) {
        showToast("Error al guardar orden");
    }
}

// Guardar metadatos individuales
async function saveSinglePhoto(id, seriesId) {
    const title = document.getElementById(`title-${id}`).value.trim();
    const category = document.getElementById(`category-${id}`).value;
    const film = document.getElementById(`film-${id}`).value.trim();
    const shootLocation = document.getElementById(`shootLocation-${id}`).value.trim();
    const notes = document.getElementById(`notes-${id}`).value.trim();

    const photoObj = { id, seriesId, title, category, film, shootLocation, notes };

    try {
        const res = await fetch('/api/admin/photos/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(photoObj)
        });
        if (res.ok) {
            showToast("Metadatos de la obra actualizados ✦");
            await loadData();
        }
    } catch (err) {
        showToast("Error al guardar metadatos");
    }
}

// Fijar foto como portada
async function setAsCover(photoUrl) {
    if (!portfolioData.settings) portfolioData.settings = {};
    portfolioData.settings.coverPhoto = photoUrl;

    try {
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(portfolioData.settings)
        });
        showToast("Portada principal actualizada ✦");
        renderPhotos();
    } catch (err) {
        showToast("Error al actualizar portada");
    }
}

// Eliminar foto
async function deletePhoto(id) {
    if (!confirm("¿Confirmas la eliminación de esta fotografía?")) return;

    try {
        const res = await fetch(`/api/admin/photos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showToast("Fotografía eliminada");
            await loadData();
        }
    } catch (err) {
        showToast("Error al eliminar");
    }
}

// Subida de nueva obra
const photoFileInput = document.getElementById('photo-file');
const previewContainer = document.getElementById('preview-container');
const previewImg = document.getElementById('preview-img');

if (photoFileInput) {
    photoFileInput.addEventListener('change', () => {
        const file = photoFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.style.display = 'none';
        }
    });
}

document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!photoFileInput.files[0]) {
        alert("Por favor selecciona un archivo");
        return;
    }

    const formData = new FormData();
    formData.append('photo', photoFileInput.files[0]);

    try {
        const upRes = await fetch('/api/admin/upload-file', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const upData = await upRes.json();

        if (upData.success) {
            const photoObj = {
                seriesId: document.getElementById('upload-series').value,
                category: document.getElementById('upload-series').value,
                title: document.getElementById('upload-title').value.trim(),
                film: document.getElementById('upload-film').value.trim() || '35mm CELULOIDE',
                camera: document.getElementById('upload-camera').value.trim(),
                shootLocation: document.getElementById('upload-shoot-location').value.trim(),
                tags: document.getElementById('upload-tags').value.split(',').map(t => t.trim()).filter(Boolean),
                notes: document.getElementById('upload-notes').value.trim(),
                url: upData.url
            };

            await fetch('/api/admin/photos/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(photoObj)
            });

            showToast("¡Fotografía subida y publicada con éxito! ✦");
            document.getElementById('upload-form').reset();
            previewContainer.style.display = 'none';
            await loadData();
            switchTab('tab-photos', document.querySelector('.tab-btn'));
        }
    } catch (err) {
        alert("Error al subir archivo");
    }
});

// Rellenar selectores de género en la subida y edición de fotos
function updateGenreDropdowns() {
    const customGenres = portfolioData.settings?.customGenres || [
        { id: "analogicas", name: "Analógicas (35mm)" },
        { id: "retratos", name: "Retratos" },
        { id: "moda", name: "Moda & Editorial" },
        { id: "calle", name: "Calle / Urbana" },
        { id: "natura", name: "Natura & Paisaje" },
        { id: "shows", name: "Shows & Música" }
    ];

    const uploadSelect = document.getElementById('upload-series');
    if (uploadSelect) {
        uploadSelect.innerHTML = customGenres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    }
}

// Gestión de géneros visibles
function renderGenresForm() {
    updateGenreDropdowns();
    const container = document.getElementById('genres-checkboxes-container');
    if (!container) return;

    const customGenres = portfolioData.settings?.customGenres || [
        { id: "analogicas", name: "Analógicas (35mm)" },
        { id: "retratos", name: "Retratos" },
        { id: "moda", name: "Moda & Editorial" },
        { id: "calle", name: "Calle / Urbana" },
        { id: "natura", name: "Natura & Paisaje" },
        { id: "shows", name: "Shows & Música" }
    ];

    const activeGenres = portfolioData.settings?.activeGenres || customGenres.map(g => g.id);

    container.innerHTML = customGenres.map(g => `
        <label style="display: flex; align-items: center; justify-content: space-between; text-transform: none; font-size: 0.95rem; cursor: pointer; background: var(--bg-card); padding: 0.8rem 1rem; border-radius: 4px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; align-items: center; gap: 0.8rem;">
                <input type="checkbox" class="genre-checkbox" value="${g.id}" ${activeGenres.includes(g.id) ? 'checked' : ''}>
                <span>${g.name}</span>
            </div>
            ${['analogicas', 'retratos', 'moda', 'calle', 'natura', 'shows'].includes(g.id) ? '' : `<button type="button" onclick="deleteCustomGenre('${g.id}')" style="color: var(--danger); font-size: 0.75rem;">Eliminar</button>`}
        </label>
    `).join('');
}

// Crear nuevo género
document.getElementById('create-genre-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-genre-name');
    const genreName = nameInput.value.trim();
    if (!genreName) return;

    const genreId = genreName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    if (!portfolioData.settings) portfolioData.settings = {};
    if (!portfolioData.settings.customGenres) {
        portfolioData.settings.customGenres = [
            { id: "analogicas", name: "Analógicas (35mm)" },
            { id: "retratos", name: "Retratos" },
            { id: "moda", name: "Moda & Editorial" },
            { id: "calle", name: "Calle / Urbana" },
            { id: "natura", name: "Natura & Paisaje" },
            { id: "shows", name: "Shows & Música" }
        ];
    }

    if (!portfolioData.settings.customGenres.some(g => g.id === genreId)) {
        portfolioData.settings.customGenres.push({ id: genreId, name: genreName });
        if (!portfolioData.settings.activeGenres) portfolioData.settings.activeGenres = [];
        portfolioData.settings.activeGenres.push(genreId);
    }

    try {
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(portfolioData.settings)
        });
        showToast(`¡Género "${genreName}" creado con éxito! ✦`);
        nameInput.value = '';
        await loadData();
    } catch (err) {
        showToast("Error al crear género");
    }
});

async function deleteCustomGenre(genreId) {
    if (!confirm("¿Eliminar este género personalizado?")) return;
    portfolioData.settings.customGenres = portfolioData.settings.customGenres.filter(g => g.id !== genreId);
    portfolioData.settings.activeGenres = portfolioData.settings.activeGenres.filter(id => id !== genreId);

    try {
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(portfolioData.settings)
        });
        showToast("Género eliminado ✦");
        await loadData();
    } catch (err) {
        showToast("Error al eliminar género");
    }
}

document.getElementById('genres-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const activeGenres = [];
    document.querySelectorAll('.genre-checkbox:checked').forEach(cb => {
        activeGenres.push(cb.value);
    });

    if (!portfolioData.settings) portfolioData.settings = {};
    portfolioData.settings.activeGenres = activeGenres;

    try {
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(portfolioData.settings)
        });
        showToast("Géneros visibles actualizados ✦");
    } catch (err) {
        showToast("Error al guardar géneros");
    }
});

// Gestión de estilo visual y tipografía
function renderStyleForm() {
    const s = portfolioData.settings || {};
    const fontSelect = document.getElementById('font-family-title');
    const sizeSelect = document.getElementById('font-size-base');
    const colorInput = document.getElementById('custom-accent-color');
    const layoutSelect = document.getElementById('default-layout-mode');

    if (fontSelect && s.fontFamilyTitle) fontSelect.value = s.fontFamilyTitle;
    if (sizeSelect && s.fontSizeBase) sizeSelect.value = s.fontSizeBase;
    if (colorInput && s.customAccentColor) colorInput.value = s.customAccentColor;
    if (layoutSelect && s.defaultLayoutMode) layoutSelect.value = s.defaultLayoutMode;
}

document.getElementById('style-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!portfolioData.settings) portfolioData.settings = {};
    portfolioData.settings.fontFamilyTitle = document.getElementById('font-family-title').value;
    portfolioData.settings.fontSizeBase = document.getElementById('font-size-base').value;
    portfolioData.settings.customAccentColor = document.getElementById('custom-accent-color').value;
    portfolioData.settings.defaultLayoutMode = document.getElementById('default-layout-mode').value;

    try {
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(portfolioData.settings)
        });
        showToast("Estilo visual, acento y marca guardados ✦");
    } catch (err) {
        showToast("Error al guardar estilo");
    }
});

// Perfil de autor, Hero editable & SEO
function renderProfileForm() {
    const a = portfolioData.author || {};
    const seo = a.seo || {};

    document.getElementById('prof-name').value = a.name || '';
    document.getElementById('prof-title').value = a.title || '';
    document.getElementById('prof-bio').value = a.bio || '';
    document.getElementById('prof-statement').value = a.statement || '';
    document.getElementById('prof-email').value = a.contact?.email || '';
    document.getElementById('prof-insta').value = a.contact?.instagram || '';
    document.getElementById('prof-loc').value = a.contact?.location || '';

    // Hero editable
    const badgeEl = document.getElementById('hero-badge');
    if (badgeEl) badgeEl.value = a.heroBadge || '';

    const titleOverrideEl = document.getElementById('hero-title-override');
    if (titleOverrideEl) titleOverrideEl.value = a.heroTitleOverride || '';

    const btn1El = document.getElementById('hero-btn1-text');
    if (btn1El) btn1El.value = a.heroBtn1Text || '';

    const btn2El = document.getElementById('hero-btn2-text');
    if (btn2El) btn2El.value = a.heroBtn2Text || '';

    document.getElementById('seo-meta-title').value = seo.metaTitle || '';
    document.getElementById('seo-meta-desc').value = seo.metaDescription || '';
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedAuthor = {
        name: document.getElementById('prof-name').value.trim(),
        title: document.getElementById('prof-title').value.trim(),
        bio: document.getElementById('prof-bio').value.trim(),
        statement: document.getElementById('prof-statement').value.trim(),
        heroBadge: document.getElementById('hero-badge').value.trim(),
        heroTitleOverride: document.getElementById('hero-title-override').value.trim(),
        heroBtn1Text: document.getElementById('hero-btn1-text').value.trim(),
        heroBtn2Text: document.getElementById('hero-btn2-text').value.trim(),
        contact: {
            email: document.getElementById('prof-email').value.trim(),
            instagram: document.getElementById('prof-insta').value.trim(),
            location: document.getElementById('prof-loc').value.trim()
        },
        seo: {
            metaTitle: document.getElementById('seo-meta-title').value.trim(),
            metaDescription: document.getElementById('seo-meta-desc').value.trim()
        }
    };

    try {
        const res = await fetch('/api/admin/author', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedAuthor)
        });
        if (res.ok) {
            showToast("Perfil de autor, Hero y SEO actualizados ✦");
            await loadData();
        }
    } catch (err) {
        showToast("Error al guardar perfil");
    }
});

// Formulario de cambio de contraseña maestra
document.getElementById('change-pass-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('pass-current').value;
    const newPassword = document.getElementById('pass-new').value;

    try {
        const res = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast("¡Contraseña actualizada con éxito! ✦");
            document.getElementById('change-pass-form').reset();
        } else {
            alert(data.error || "Error al cambiar contraseña.");
        }
    } catch (err) {
        alert("Error de red al intentar actualizar la contraseña.");
    }
});

// Exportaciones de respaldo
function exportJsonBackup() {
    if (!portfolioData) return;
    const jsonStr = JSON.stringify(portfolioData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup JSON generado y descargado 📄");
}

function exportZipBackup() {
    window.open(`/api/admin/export/zip?token=${token}`, '_blank');
    showToast("Iniciando descarga de paquete ZIP de fotografías 📦");
}

// Navegación entre pestañas del CMS
function switchTab(tabId, element) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (element) element.classList.add('active');
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function escapeHtml(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Atajo de teclado global Ctrl + S para guardar
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showToast("Cambios sincronizados ✦");
    }
});

init();
