// ===== BROWSER FINGERPRINTING =====
// Genera una huella digital única del dispositivo
async function generateDeviceFingerprint() {
    const components = [];
    
    // User Agent
    components.push(navigator.userAgent);
    
    // Pantalla
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    components.push(screen.availWidth);
    components.push(screen.availHeight);
    
    // Zona horaria
    components.push(new Date().getTimezoneOffset());
    
    // Idioma
    components.push(navigator.language);
    components.push(navigator.languages.join(','));
    
    // Plataforma
    components.push(navigator.platform);
    
    // Hardware concurrency (núcleos CPU)
    components.push(navigator.hardwareConcurrency || 'unknown');
    
    // Device Memory (si está disponible)
    components.push(navigator.deviceMemory || 'unknown');
    
    // Touch support
    components.push(navigator.maxTouchPoints || 0);
    
    // Plugins (solo si están disponibles)
    if (navigator.plugins) {
        const plugins = Array.from(navigator.plugins).map(p => p.name).sort().join(',');
        components.push(plugins);
    }
    
    // Canvas fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    components.push(canvas.toDataURL());
    
    // WebGL fingerprint
    try {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
                components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
            }
        }
    } catch (e) {
        components.push('webgl-error');
    }
    
    // Generar hash de todos los componentes
    const fingerprint = await hashString(components.join('|||'));
    return fingerprint;
}

// Función simple de hash (SHA-256)
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Verificar si el dispositivo está autorizado
async function isAuthorizedDevice() {
    const currentFingerprint = await generateDeviceFingerprint();
    const authorizedFingerprints = getAuthorizedFingerprints();
    
    console.log('Fingerprint del dispositivo:', currentFingerprint);
    
    return authorizedFingerprints.includes(currentFingerprint);
}

// Obtener lista de dispositivos autorizados desde LocalStorage
function getAuthorizedFingerprints() {
    const stored = localStorage.getItem('authorizedDevices');
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

// Autorizar el dispositivo actual (solo para configuración inicial)
async function authorizeCurrentDevice() {
    const currentFingerprint = await generateDeviceFingerprint();
    const authorized = getAuthorizedFingerprints();
    
    if (!authorized.includes(currentFingerprint)) {
        authorized.push(currentFingerprint);
        localStorage.setItem('authorizedDevices', JSON.stringify(authorized));
        console.log('✅ Dispositivo autorizado:', currentFingerprint);
    } else {
        console.log('ℹ️ Dispositivo ya estaba autorizado');
    }
    
    return currentFingerprint;
}

// Mostrar fingerprint actual (para debugging)
async function showCurrentFingerprint() {
    const fingerprint = await generateDeviceFingerprint();
    alert(`Fingerprint de este dispositivo:\n${fingerprint}\n\nCopia este valor para autorizarlo.`);
    console.log('Fingerprint:', fingerprint);
    return fingerprint;
}
