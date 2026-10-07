// Inicialización de la aplicación

document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Vías Ferratas';
    const versionLabel = document.getElementById('app-version');
    if (versionLabel) versionLabel.textContent = getFullVersionString();

    updateGitHubStatus();
    setupEventListeners();
    initMap();
    resetForm();

    // Mostrar al instante la última copia local y refrescar desde GitHub
    const cached = loadLocalCache();
    if (cached) setFerratas(cached);
    loadFerratas();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(error => {
            console.warn('No se pudo registrar el service worker:', error);
        });
    }
});
