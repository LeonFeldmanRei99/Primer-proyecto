/**
 * STUDIO CMS — CONTROLADOR DEL PANEL DE ADMINISTRACIÓN
 * Estilo Adobe Portfolio / Gestión Integral de Obras, Textos & Estilos
 */

let token = localStorage.getItem('admin_token') || '';
let portfolioData = null;
let currentPhotos = [];

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

    currentPhotos.forEach((photo, idx) => {
        const card = document.createElement('div');
        const isCover = (photo.url || photo.src) === coverPhoto;
        card.className = `photo-card ${isCover ? 'is-cover' : ''}`;
        card.draggable = true;
        card.dataset.index = idx;
        card.dataset.id = photo.id;

        card.innerHTML = `
            ${isCover ? '<div class="cover-badge">★ Portada Actual</div>' : ''}
            <div class="drag-handle">⠿ Arrastrar para reordenar</div>
            <img src="/${photo.url || photo.src}" alt="${photo.title || 'Foto'}">
            
            <div class="form-group" style="margin-bottom: 0.6rem;">
                <label>Título de la Obra</label>
                <input type="text" id="title-${photo.id}" value="${escapeHtml(photo.title || '')}" placeholder="Sin título">
            </div>

            <div class="form-group" style="margin-bottom: 0.6rem;">
                <label>Género / Categoría</label>
                <select id="category-${photo.id}">
                    <option value="analogicas" ${photo.category === 'analogicas' || photo.category === 'Analógicas' ? 'selected' : ''}>Analógicas</option>
                    <option value="retratos" ${photo.category === 'retratos' || photo.category === 'Retratos' ? 'selected' : ''}>Retratos</option>
                    <option value="moda" ${photo.category === 'moda' || photo.category === 'Moda' ? 'selected' : ''}>Moda & Editorial</option>
                    <option value="calle" ${photo.category === 'calle' || photo.category === 'Calle' ? 'selected' : ''}>Calle / Urbana</option>
                    <option value="natura" ${photo.category === 'natura' || photo.category === 'Natura' ? 'selected' : ''}>Natura & Paisaje</option>
                    <option value="shows" ${photo.category === 'shows' || photo.category === 'Shows' ? 'selected' : ''}>Shows & Música</option>
                </select>
            </div>

            <div class="form-group" style="margin-bottom: 0.6rem;">
                <label>Película / Celuloide</label>
                <input type="text" id="film-${photo.id}" value="${escapeHtml(photo.film || '')}" placeholder="35mm Celuloide">
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
    const notes = document.getElementById(`notes-${id}`).value.trim();

    const photoObj = { id, seriesId, title, category, film, notes };

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

// Gestión de géneros visibles
function renderGenresForm() {
    const activeGenres = portfolioData.settings?.activeGenres || ['analogicas', 'retratos', 'moda', 'calle', 'natura', 'shows'];
    document.querySelectorAll('.genre-checkbox').forEach(cb => {
        cb.checked = activeGenres.includes(cb.value);
    });
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
    if (fontSelect && s.fontFamilyTitle) fontSelect.value = s.fontFamilyTitle;
    if (sizeSelect && s.fontSizeBase) sizeSelect.value = s.fontSizeBase;
}

document.getElementById('style-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!portfolioData.settings) portfolioData.settings = {};
    portfolioData.settings.fontFamilyTitle = document.getElementById('font-family-title').value;
    portfolioData.settings.fontSizeBase = document.getElementById('font-size-base').value;

    try {
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(portfolioData.settings)
        });
        showToast("Estilo visual y tipografía guardados ✦");
    } catch (err) {
        showToast("Error al guardar estilo");
    }
});

// Perfil de autor
function renderProfileForm() {
    const a = portfolioData.author || {};
    document.getElementById('prof-name').value = a.name || '';
    document.getElementById('prof-title').value = a.title || '';
    document.getElementById('prof-bio').value = a.bio || '';
    document.getElementById('prof-statement').value = a.statement || '';
    document.getElementById('prof-email').value = a.contact?.email || '';
    document.getElementById('prof-insta').value = a.contact?.instagram || '';
    document.getElementById('prof-loc').value = a.contact?.location || '';
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedAuthor = {
        name: document.getElementById('prof-name').value.trim(),
        title: document.getElementById('prof-title').value.trim(),
        bio: document.getElementById('prof-bio').value.trim(),
        statement: document.getElementById('prof-statement').value.trim(),
        contact: {
            email: document.getElementById('prof-email').value.trim(),
            instagram: document.getElementById('prof-insta').value.trim(),
            location: document.getElementById('prof-loc').value.trim()
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
            showToast("Perfil de autor actualizado ✦");
            await loadData();
        }
    } catch (err) {
        showToast("Error al guardar perfil");
    }
});

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
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

init();
