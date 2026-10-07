// Configuración, estado global y utilidades

// ===== VERSIÓN DE LA APLICACIÓN =====
const APP_VERSION = '2.0.0';

// ===== CONFIGURACIÓN GITHUB =====
const GITHUB = {
    owner: 'Suwert8',
    repo: 'pmm-vias-ferratas',
    branch: 'main',
    dataPath: 'data/ferratas.json',
    mediaDir: 'media'
};

// ===== LÍMITES DE ARCHIVOS =====
const MAX_IMAGE_DIMENSION = 1600;          // px del lado mayor tras comprimir
const IMAGE_QUALITY = 0.82;                // calidad JPEG
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;  // 30 MB

// ===== NIVELES (escala K1-K6) =====
const NIVELES = {
    k1: 'K1 - Fácil',
    k2: 'K2 - Poco difícil',
    k3: 'K3 - Algo difícil',
    k4: 'K4 - Difícil',
    k5: 'K5 - Muy difícil',
    k6: 'K6 - Extremadamente difícil'
};

// ===== ESTADO GLOBAL =====
const state = {
    ferratas: [],
    loaded: false,
    editingId: null,
    selectedCoords: null,
    formMedia: [],          // [{ path, type }] – path es ruta del repo o data URL (nuevo)
    selectingOnMap: false,
    filter: 'todas',
    search: '',
    submitting: false
};

let githubToken = safeStorageGet('github-token') || '';

// ===== UTILIDADES =====
function safeStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function safeStorageSet(key, value) {
    try {
        if (value === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
        return true;
    } catch (e) {
        return false;
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getNivelText(nivel) {
    return NIVELES[nivel] || nivel || '';
}

function formatDuration(minutes) {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return minutes + ' min';
}

// URL pública de un archivo multimedia (ruta del repo o data URL heredada)
function mediaUrl(path) {
    if (!path) return '';
    if (/^(data:|https?:|blob:)/.test(path)) return path;
    return `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${path}`;
}

function mediaTypeOf(path) {
    if (path.startsWith('data:')) {
        return path.startsWith('data:video') ? 'video' : 'image';
    }
    return /\.(mp4|webm|mov|m4v)$/i.test(path) ? 'video' : 'image';
}

function getCoverPath(ferrata) {
    const cover = (ferrata.media || []).find(m => m.type === 'image');
    return cover ? cover.path : null;
}

// Convierte el formato antiguo (coverImage + mediaFiles) al nuevo (media)
function normalizeFerrata(raw) {
    const ferrata = { ...raw };
    if (!Array.isArray(ferrata.media)) {
        const paths = [];
        if (ferrata.coverImage) paths.push(ferrata.coverImage);
        (ferrata.mediaFiles || []).forEach(p => {
            if (p && !paths.includes(p)) paths.push(p);
        });
        ferrata.media = paths.map(path => ({ path, type: mediaTypeOf(path) }));
    }
    delete ferrata.coverImage;
    delete ferrata.mediaFiles;
    return ferrata;
}

function getFullVersionString() {
    return `Vías Ferratas v${APP_VERSION}`;
}
