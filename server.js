const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'leon1234';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_laboratorio_2026';

const BASE_DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(BASE_DATA_DIR, 'portfolio.json');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(BASE_DATA_DIR)) fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Copy initial seed data if running on new persistent disk
const SEED_FILE = path.join(__dirname, 'data', 'portfolio.json');
if (!fs.existsSync(DATA_FILE) && fs.existsSync(SEED_FILE)) {
    fs.copyFileSync(SEED_FILE, DATA_FILE);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files routing con decodificación de URI
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(['/Analógicas', '/Anal%C3%B3gicas'], express.static(path.join(__dirname, 'Analógicas')));
app.use('/Calle', express.static(path.join(__dirname, 'Calle')));
app.use('/Estudio', express.static(path.join(__dirname, 'Estudio')));
app.use('/Natura', express.static(path.join(__dirname, 'Natura')));
app.use('/Shows', express.static(path.join(__dirname, 'Shows')));

// Explicit route for admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

// Helper to read JSON data safely
function readData() {
    if (!fs.existsSync(DATA_FILE)) return {};
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error("Error leyendo portfolio.json", err);
        return {};
    }
}

// Helper to write JSON data atomically
function writeData(data) {
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
}

// Strict Auth Middleware for Admin routes
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso no autorizado. Token de autenticación requerido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado. Por favor inicia sesión nuevamente.' });
        }
        req.user = user;
        next();
    });
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// GET all portfolio data
app.get('/api/portfolio', (req, res) => {
    const data = readData();
    res.json(data);
});

// POST Admin Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ success: false, error: 'Se requiere contraseña.' });
    }

    if (password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token, message: 'Autenticación exitosa.' });
    }
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta.' });
});

// Verify token status
app.get('/api/admin/verify', authenticateToken, (req, res) => {
    res.json({ success: true, valid: true });
});

// ==========================================
// FULL CRUD ADMIN API
// ==========================================

// UPDATE Author Profile & Bio
app.put('/api/admin/author', authenticateToken, (req, res) => {
    const data = readData();
    data.author = { ...data.author, ...req.body };
    writeData(data);
    res.json({ success: true, author: data.author, message: 'Datos de autor actualizados.' });
});

// UPDATE Visual Style & Settings (Typography, Cover, Genres)
app.put('/api/admin/settings', authenticateToken, (req, res) => {
    const data = readData();
    data.settings = { ...data.settings, ...req.body };
    writeData(data);
    res.json({ success: true, settings: data.settings, message: 'Configuración visual guardada.' });
});

// REORDER Photos
app.put('/api/admin/photos/reorder', authenticateToken, (req, res) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds debe ser un array.' });
    }

    const data = readData();
    let allPhotos = [];
    (data.series || []).forEach(s => {
        if (s.photos) allPhotos.push(...s.photos);
    });

    const photoMap = new Map(allPhotos.map(p => [p.id, p]));
    const reordered = [];
    orderedIds.forEach(id => {
        if (photoMap.has(id)) {
            reordered.push(photoMap.get(id));
            photoMap.delete(id);
        }
    });
    // Add any leftovers
    photoMap.forEach(p => reordered.push(p));

    if (!data.series || data.series.length === 0) {
        data.series = [{ id: 'analogicas', name: 'Analógicas', photos: reordered }];
    } else {
        data.series[0].photos = reordered;
    }

    writeData(data);
    res.json({ success: true, message: 'Orden de fotografías actualizado.' });
});

// ADD or EDIT Photo
app.post('/api/admin/photos/save', authenticateToken, (req, res) => {
    const photoObj = req.body; // includes id, seriesId, title, film, frameNumber, notes, url, etc.
    const data = readData();
    if (!data.series) data.series = [];

    let seriesItem = data.series.find(s => s.id === (photoObj.seriesId || 'analogicas'));
    if (!seriesItem) {
        seriesItem = data.series[0] || { id: 'analogicas', name: 'Analógicas', photos: [] };
        if (!data.series.includes(seriesItem)) data.series.push(seriesItem);
    }
    if (!seriesItem.photos) seriesItem.photos = [];

    const existingIdx = seriesItem.photos.findIndex(p => p.id === photoObj.id);
    if (existingIdx !== -1) {
        seriesItem.photos[existingIdx] = { ...seriesItem.photos[existingIdx], ...photoObj };
    } else {
        photoObj.id = photoObj.id || 'photo-' + Date.now();
        seriesItem.photos.push(photoObj);
    }

    writeData(data);
    res.json({ success: true, photo: photoObj, message: 'Fotografía guardada con éxito.' });
});

// DELETE Photo
app.delete('/api/admin/photos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const data = readData();
    let deleted = false;

    (data.series || []).forEach(seriesItem => {
        if (seriesItem.photos) {
            const idx = seriesItem.photos.findIndex(p => p.id === id);
            if (idx !== -1) {
                seriesItem.photos.splice(idx, 1);
                deleted = true;
            }
        }
    });

    if (deleted) {
        writeData(data);
        return res.json({ success: true, message: 'Fotografía eliminada.' });
    }
    res.status(404).json({ error: 'Fotografía no encontrada.' });
});

// UPLOAD physical photo file
app.post('/api/admin/upload-file', authenticateToken, upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo.' });
    }
    const relativeUrl = 'uploads/' + req.file.filename;
    res.json({ success: true, url: relativeUrl, message: 'Archivo subido correctamente.' });
});

// ADD/EDIT Audiovisual project
app.post('/api/admin/audiovisual/save', authenticateToken, (req, res) => {
    const data = readData();
    if (!data.audiovisual) data.audiovisual = [];
    const av = req.body;

    const idx = data.audiovisual.findIndex(a => a.id === av.id);
    if (idx !== -1) {
        data.audiovisual[idx] = { ...data.audiovisual[idx], ...av };
    } else {
        av.id = av.id || 'av-' + Date.now();
        data.audiovisual.push(av);
    }

    writeData(data);
    res.json({ success: true, project: av, message: 'Proyecto audiovisual guardado.' });
});

// DELETE Audiovisual project
app.delete('/api/admin/audiovisual/:id', authenticateToken, (req, res) => {
    const data = readData();
    if (data.audiovisual) {
        data.audiovisual = data.audiovisual.filter(a => a.id !== req.params.id);
        writeData(data);
        return res.json({ success: true, message: 'Proyecto audiovisual eliminado.' });
    }
    res.status(404).json({ error: 'No encontrado.' });
});

// ADD/EDIT Essay (Texto + Imagen)
app.post('/api/admin/essays/save', authenticateToken, (req, res) => {
    const data = readData();
    if (!data.essays) data.essays = [];
    const essay = req.body;

    const idx = data.essays.findIndex(e => e.id === essay.id);
    if (idx !== -1) {
        data.essays[idx] = { ...data.essays[idx], ...essay };
    } else {
        essay.id = essay.id || 'ens-' + Date.now();
        data.essays.push(essay);
    }

    writeData(data);
    res.json({ success: true, essay, message: 'Ensayo visual guardado.' });
});

// DELETE Essay
app.delete('/api/admin/essays/:id', authenticateToken, (req, res) => {
    const data = readData();
    if (data.essays) {
        data.essays = data.essays.filter(e => e.id !== req.params.id);
        writeData(data);
        return res.json({ success: true, message: 'Ensayo eliminado.' });
    }
    res.status(404).json({ error: 'No encontrado.' });
});

// ADD/EDIT IA Lab Case (Experimentos IA)
app.post('/api/admin/ia-lab/save', authenticateToken, (req, res) => {
    const data = readData();
    if (!data.ia_lab) data.ia_lab = [];
    const iaCase = req.body;

    const idx = data.ia_lab.findIndex(i => i.id === iaCase.id);
    if (idx !== -1) {
        data.ia_lab[idx] = { ...data.ia_lab[idx], ...iaCase };
    } else {
        iaCase.id = iaCase.id || 'ia-' + Date.now();
        data.ia_lab.push(iaCase);
    }

    writeData(data);
    res.json({ success: true, iaCase, message: 'Caso de laboratorio IA guardado.' });
});

// DELETE IA Lab Case
app.delete('/api/admin/ia-lab/:id', authenticateToken, (req, res) => {
    const data = readData();
    if (data.ia_lab) {
        data.ia_lab = data.ia_lab.filter(i => i.id !== req.params.id);
        writeData(data);
        return res.json({ success: true, message: 'Experimento IA eliminado.' });
    }
    res.status(404).json({ error: 'No encontrado.' });
});

// Start Server if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n==================================================`);
        console.log(`  Servidor Node.js corriendo en http://localhost:${PORT}`);
        console.log(`  Portfolio: http://localhost:${PORT}/index.html`);
        console.log(`  API Portfolio: http://localhost:${PORT}/api/portfolio`);
        console.log(`==================================================\n`);
    });
}

module.exports = app;
