// Archivo principal de inicialización - v1.4.0

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 JAVASCRIPT INICIADO - Versión 1.5.0');
    console.log('🆕 NUEVA VERSIÓN 1.5.0: Aplicación modularizada');
    console.log('📋 Cambios principales:');
    console.log('   ✅ Estructura modular con archivos separados');
    console.log('   ✅ CSS extraído a archivos independientes');
    console.log('   ✅ JavaScript dividido en módulos lógicos');
    console.log('   ✅ Meta tags PWA actualizadas');
    console.log('   ✅ Mejor mantenibilidad y escalabilidad');
    console.log('   ✅ Prevención de errores de recursión mejorada');
    console.log('🌐 URL actual:', window.location.href);
    console.log('📱 User Agent:', navigator.userAgent);
    
    // Verificar que el body contiene elementos
    console.log('📋 Verificando estructura HTML...');
    console.log('📊 Elementos en body:', document.body.children.length);
    console.log('🎯 Container principal:', document.getElementById('container') ? '✅ Encontrado' : '❌ No encontrado');
    console.log('🗺️ Div del mapa:', document.getElementById('map') ? '✅ Encontrado' : '❌ No encontrado');
    console.log('📝 Formulario:', document.getElementById('ferrata-form') ? '✅ Encontrado' : '❌ No encontrado');
    
    if (document.body.children.length === 0) {
        console.error('❌ ERROR CRÍTICO: El body está vacío!');
        return;
    }
    
    console.log('⌨️ Atajos de teclado disponibles:');
    console.log('  Ctrl+Shift+T: Configurar token de GitHub');
    console.log('  Ctrl+Shift+S: Recarga completa desde GitHub');
    console.log('  Ctrl+Shift+R: Recargar datos desde GitHub');
    console.log('');
    console.log('📄 MODO: Solo GitHub (sin localStorage)');
    console.log('🔗 Repositorio:', githubRepo);
    console.log('📁 Archivo:', githubFilePath);
    console.log('🌿 Rama:', githubBranch);
    
    try {
        console.log('🔄 Actualizando estado GitHub...');
        updateGitHubStatus(); // Actualizar estado de GitHub
        
        console.log('🗺️ Inicializando mapa...');
        await initMap();
        
        console.log('📥 Cargando ferratas...');
        await loadFerratas(); // Cargar datos desde GitHub
        
        console.log('🎛️ Configurando event listeners...');
        setupEventListeners();
        
        console.log('📱 Configurando navegación móvil...');
        setupMobileNavigation();
        
        console.log('✅ APLICACIÓN INICIALIZADA CORRECTAMENTE');
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
// Estas funciones deben estar disponibles globalmente para onclick handlers en HTML

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

console.log('🎯 MAIN MODULE CARGADO - v1.5.0');
console.log('🌍 Funciones globales exportadas para compatibilidad HTML');
console.log('📦 Variables globales accesibles desde window');