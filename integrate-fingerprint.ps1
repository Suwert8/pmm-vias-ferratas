# Script para integrar Browser Fingerprinting en ferrata-app.html
# Preservando codificación UTF-8

# Leer archivo original
$content = Get-Content "ferrata-app.html" -Encoding UTF8 -Raw

# Código de fingerprinting a insertar
$fingerprintCode = @'

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
            
            // Device Memory
            components.push(navigator.deviceMemory || 'unknown');
            
            // Touch support
            components.push(navigator.maxTouchPoints || 0);
            
            // Canvas fingerprint
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('ViaFerrata Auth', 2, 15);
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
            
            // Generar hash
            const fingerprint = await hashString(components.join('|||'));
            return fingerprint;
        }

        // Hash SHA-256
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
            
            console.log('🔍 Fingerprint del dispositivo:', currentFingerprint);
            
            return authorizedFingerprints.includes(currentFingerprint);
        }

        // Obtener dispositivos autorizados
        function getAuthorizedFingerprints() {
            const stored = localStorage.getItem('authorizedDevices');
            if (stored) {
                return JSON.parse(stored);
            }
            return [];
        }

        // Autorizar dispositivo actual
        async function authorizeCurrentDevice() {
            const currentFingerprint = await generateDeviceFingerprint();
            const authorized = getAuthorizedFingerprints();
            
            if (!authorized.includes(currentFingerprint)) {
                authorized.push(currentFingerprint);
                localStorage.setItem('authorizedDevices', JSON.stringify(authorized));
                alert('✅ Dispositivo autorizado correctamente!\n\nFingerprint: ' + currentFingerprint.substring(0, 16) + '...');
                return true;
            } else {
                alert('ℹ️ Este dispositivo ya estaba autorizado');
                return false;
            }
        }

        // Mostrar fingerprint (para debug)
        async function showCurrentFingerprint() {
            const fingerprint = await generateDeviceFingerprint();
            const authorized = getAuthorizedFingerprints();
            const isAuth = authorized.includes(fingerprint);
            
            alert(`Fingerprint: ${fingerprint.substring(0, 32)}...\n\nAutorizado: ${isAuth ? 'SÍ ✅' : 'NO ❌'}\n\nDispositivos autorizados: ${authorized.length}`);
            console.log('Fingerprint completo:', fingerprint);
            console.log('Autorizado:', isAuth);
            console.log('Lista de autorizados:', authorized);
        }

'@

# Buscar la línea donde insertar (después de la función isMobileDevice)
$pattern = "        // ===== DETECCIÓN DE DISPOSITIVO MÓVIL =====[^}]+\}"
if ($content -match $pattern) {
    # Insertar después de isMobileDevice
    $content = $content -replace "($pattern)", "`$1$fingerprintCode"
    
    Write-Host "✅ Código de fingerprinting insertado" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró la sección de detección móvil" -ForegroundColor Red
    exit 1
}

# Actualizar DOMContentLoaded para usar fingerprinting
$oldDOMContent = @'
        // ===== INICIALIZACIÓN =====
        document.addEventListener('DOMContentLoaded', function() {
            initMap();
            loadFerratas();
            setupEventListeners();
            
            // Ocultar tab "Añadir" y botones "Editar" si no es móvil
            if (!isMobileDevice()) {
                const addTab = document.querySelector('[data-tab="add"]');
                if (addTab) {
                    addTab.style.display = 'none';
                }
            }
        });
'@

$newDOMContent = @'
        // ===== INICIALIZACIÓN =====
        document.addEventListener('DOMContentLoaded', async function() {
            initMap();
            loadFerratas();
            setupEventListeners();
            
            // Verificar autorización del dispositivo
            const isAuthorized = await isAuthorizedDevice();
            
            // Ocultar tab "Añadir" si no está autorizado
            if (!isAuthorized) {
                const addTab = document.querySelector('[data-tab="add"]');
                if (addTab) {
                    addTab.style.display = 'none';
                }
                console.log('❌ Dispositivo no autorizado - Funciones de edición deshabilitadas');
            } else {
                console.log('✅ Dispositivo autorizado - Todas las funciones disponibles');
            }
            
            // Atajo: Ctrl+Shift+A para autorizar dispositivo
            document.addEventListener('keydown', async function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                    await authorizeCurrentDevice();
                    location.reload();
                }
                // Ctrl+Shift+F para ver fingerprint
                if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                    await showCurrentFingerprint();
                }
            });
        });
'@

$content = $content -replace [regex]::Escape($oldDOMContent), $newDOMContent

# Actualizar la función loadFerratas para condicionar botones de edición
$oldLoadFerratas = "                        `${isMobileDevice() ? ``"
$newLoadFerratas = "                        `${isAuthorizedDevice() ? ``"

# Como isAuthorizedDevice es async, necesitamos una variable global
$globalVarInsert = @'
        let currentFilter = 'todas';
        let isDeviceAuthorized = false; // Se actualiza en DOMContentLoaded

'@

$content = $content -replace "        let currentFilter = 'todas';", $globalVarInsert

# Actualizar la condición en loadFerratas
$content = $content -replace "\`\$\{isMobileDevice\(\)", "`${isDeviceAuthorized"

# Guardar con UTF-8 sin BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("$PWD\ferrata-app.html", $content, $utf8NoBom)

Write-Host "✅ Archivo actualizado con Browser Fingerprinting" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Para autorizar tu móvil:" -ForegroundColor Cyan
Write-Host "   1. Abre la app en tu móvil" -ForegroundColor White
Write-Host "   2. Presiona Ctrl+Shift+A (o ejecuta authorizeCurrentDevice() en consola)" -ForegroundColor White
Write-Host "   3. Recarga la página" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Para ver el fingerprint:" -ForegroundColor Cyan
Write-Host "   Presiona Ctrl+Shift+F (o ejecuta showCurrentFingerprint() en consola)" -ForegroundColor White
