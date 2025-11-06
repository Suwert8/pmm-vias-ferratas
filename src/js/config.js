// Configuración y constantes globales - v1.5.0
// ===== CONFIGURACIÓN GITHUB =====
const githubRepo = 'Suwert8/pmm-vias-ferratas';
const githubFilePath = 'data/ferratas.json';
const githubBranch = 'main';

// ===== VARIABLES GLOBALES =====
let map;
let marker;
let selectedCoords = null;
let coverImageData = null;
let mediaFiles = [];
let selectingOnMap = false;
let currentFilter = 'todas';
let ferratas = []; // Variable global para almacenar las ferratas cargadas
let editingFerrataId = null;
let isSubmitting = false; // Para prevenir doble envío

// ===== TOKEN GITHUB =====
let githubToken = localStorage.getItem('github-token') || '';

// ===== UTILIDADES =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getNivelText(nivel) {
    const niveles = {
        'k1': 'K1 - Fácil',
        'k2': 'K2 - Poco Difícil',
        'k3': 'K3 - Algo Difícil',
        'k4': 'K4 - Difícil',
        'k5': 'K5 - Muy Difícil',
        'k6': 'K6 - Extremadamente Difícil'
    };
    return niveles[nivel] || nivel;
}

function formatDistance(meters) {
    if (meters >= 1000) {
        return (meters / 1000).toFixed(1) + ' km';
    }
    return meters + ' m';
}

function formatDuration(minutes) {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return minutes + ' min';
}

// ===== CONFIGURACIÓN INICIAL =====
console.log('🔧 CONFIG CARGADO - Versión 1.5.0');
console.log('🔗 Repositorio:', githubRepo);
console.log('📁 Archivo:', githubFilePath);
console.log('🌿 Rama:', githubBranch);