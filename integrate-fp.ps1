$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Integrando Browser Fingerprinting..." -ForegroundColor Cyan

# Leer archivos
$html = [System.IO.File]::ReadAllText("$PSScriptRoot\ferrata-app.html", [System.Text.Encoding]::UTF8)
$fp = [System.IO.File]::ReadAllText("$PSScriptRoot\fingerprint-code.js", [System.Text.Encoding]::UTF8)

# 1. Insertar fingerprint code después de isMobileDevice
$pattern1 = 'function isMobileDevice\(\) \{\r?\n\s+return /android.*test\(navigator\.userAgent\.toLowerCase\(\)\);\r?\n\s+\}'
if ($html -match $pattern1) {
    $html = $html -replace "($pattern1)", "`$1`n`n$fp"
    Write-Host "1. Codigo fingerprint insertado" -ForegroundColor Green
} else {
    Write-Host "ERROR: No se encontro isMobileDevice" -ForegroundColor Red
    exit 1
}

# 2. Agregar variable global
$html = $html -replace "(let currentFilter = 'todas';)", "`$1`n        let isDeviceAuthorized = false;"
Write-Host "2. Variable global agregada" -ForegroundColor Green

# 3. Cambiar DOMContentLoaded a async
$html = $html -replace "document\.addEventListener\('DOMContentLoaded', function\(\)", "document.addEventListener('DOMContentLoaded', async function()"
Write-Host "3. DOMContentLoaded cambiado a async" -ForegroundColor Green

# 4. Insertar código de verificación después de setupEventListeners();
$checkCode = @"

            
            // Verificar autorizacion del dispositivo
            isDeviceAuthorized = await isAuthorizedDevice();
            
            if (!isDeviceAuthorized) {
                const addTab = document.querySelector('[data-tab="add"]');
                if (addTab) addTab.style.display = 'none';
                console.log('Dispositivo no autorizado');
            } else {
                console.log('Dispositivo autorizado');
            }
            
            // Atajos de teclado
            document.addEventListener('keydown', async (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                    await authorizeCurrentDevice();
                    location.reload();
                }
                if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                    await showCurrentFingerprint();
                }
            });
"@

$html = $html -replace "(setupEventListeners\(\);)", "`$1$checkCode"
Write-Host "4. Codigo de verificacion insertado" -ForegroundColor Green

# 5. Reemplazar isMobileDevice() por isDeviceAuthorized
$html = $html -replace '\$\{isMobileDevice\(\)', '${isDeviceAuthorized'
Write-Host "5. Reemplazadas llamadas a isMobileDevice" -ForegroundColor Green

# Guardar
[System.IO.File]::WriteAllText("$PSScriptRoot\ferrata-app.html", $html, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "Fingerprinting integrado correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Para autorizar tu movil:" -ForegroundColor Yellow
Write-Host "  1. Abre la app en tu movil" -ForegroundColor White
Write-Host "  2. Presiona Ctrl+Shift+A" -ForegroundColor White
Write-Host "  3. Recarga la pagina" -ForegroundColor White
Write-Host ""
Write-Host "Para ver fingerprint: Ctrl+Shift+F" -ForegroundColor Yellow
