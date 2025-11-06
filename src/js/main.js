// Archivo principal de inicialización

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', async function() {
    // console.log(`🚀 Vías Ferratas v${APP_VERSION} - Iniciando aplicación...`);
    
    // Actualizar título del documento con la versión
    document.title = `Vías Ferratas - v${APP_VERSION}`;
    
    // Verificar elementos críticos
    const container = document.getElementById('container');
    const mapDiv = document.getElementById('map');
    const form = document.getElementById('ferrata-form');
    
    if (!container) console.error('❌ Container principal no encontrado');
    if (!mapDiv) console.error('❌ Div del mapa no encontrado');
    if (!form) console.error('❌ Formulario no encontrado');
    
    if (document.body.children.length === 0) {
        console.error('❌ ERROR CRÍTICO: El body está vacío!');
        return;
    }
    
    try {
        updateGitHubStatus();
        await initMap();
        await loadFerratas();
        setupEventListeners();
        setupMobileNavigation();
        
        // console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ ERROR EN INICIALIZACIÓN:', error);
        if (typeof showError === 'function') {
            showError(`Error al inicializar la aplicación: ${error.message}`, 'Error Crítico');
        }
    }
    
    // Event listener para el indicador de GitHub
    const githubStatus = document.getElementById('github-status');
    if (githubStatus) {
        githubStatus.addEventListener('click', function() {
            if (typeof configureGitHubToken === 'function') {
                configureGitHubToken();
            }
        });
    }
});

// ===== FUNCIONES GLOBALES PARA COMPATIBILIDAD =====
// Exportar funciones necesarias para onclick handlers en HTML

window.showFerrataDetail = showFerrataDetail;
window.editFerrata = editFerrata;
window.confirmDelete = confirmDelete;
window.cancelEdit = cancelEdit;
window.removeMediaFile = removeMediaFile;
window.applyFilter = applyFilter;
window.enableMapSelection = enableMapSelection;
window.generateDescription = generateDescription;
window.loadFerratas = loadFerratas;
window.reloadGitHub = reloadGitHub;
window.configureGitHubToken = configureGitHubToken;

// Exponer variables globales necesarias
window.ferratas = ferratas;
window.editingFerrataId = editingFerrataId;
window.isSubmitting = isSubmitting;
window.map = map;
window.marker = marker;
window.selectedCoords = selectedCoords;
window.coverImageData = coverImageData;
window.mediaFiles = mediaFiles;
window.selectingOnMap = selectingOnMap;
window.currentFilter = currentFilter;