# Script maestro para integrar todas las funcionalidades
$ErrorActionPreference = "Stop"

Write-Host "=== INTEGRANDO TODAS LAS FUNCIONALIDADES ===" -ForegroundColor Cyan
Write-Host ""

# Partir del archivo con combobox
Copy-Item ferrata-with-combo.html ferrata-app.html -Force
Write-Host "1. Base con combobox cargada" -ForegroundColor Green

# Leer archivos necesarios
$current = [System.IO.File]::ReadAllText("ferrata-app.html", [System.Text.Encoding]::UTF8)
$githubSync = [System.IO.File]::ReadAllText("temp-github-sync.html", [System.Text.Encoding]::UTF8)
$material = [System.IO.File]::ReadAllText("temp-material.html", [System.Text.Encoding]::UTF8)
$fingerprint = [System.IO.File]::ReadAllText("fingerprint-code.js", [System.Text.Encoding]::UTF8)

# ===== PASO 1: AGREGAR VARIABLES GLOBALES =====
$current = $current -replace "(let currentFilter = 'todas';)", "`$1`nlet isDeviceAuthorized = false;"
Write-Host "2. Variable isDeviceAuthorized agregada" -ForegroundColor Green

# ===== PASO 2: EXTRAER Y AGREGAR FUNCIONES DE GITHUB SYNC =====
if ($githubSync -match '(?s)// GitHub Configuration.*?function loadFromGitHub\(\) \{[^\}]+\}\s+\}') {
    $githubFunctions = $matches[0]
    $insertPoint = $current.IndexOf("let currentFilter")
    if ($insertPoint -gt 0) {
        $before = $current.Substring(0, $insertPoint)
        $after = $current.Substring($insertPoint)
        $current = $before + $githubFunctions + "`n`n        " + $after
        Write-Host "3. Funciones de GitHub sync extraidas e integradas" -ForegroundColor Green
    }
} else {
    Write-Host "3. AVISO: No se encontraron funciones de GitHub sync completas" -ForegroundColor Yellow
}

# ===== PASO 3: AGREGAR FINGERPRINTING =====
$current = $current -replace "(let isDeviceAuthorized = false;)", "`$1`n`n$fingerprint"
Write-Host "4. Fingerprinting integrado" -ForegroundColor Green

# ===== PASO 4: ACTUALIZAR DOMContentLoaded =====
$current = $current -replace "document\.addEventListener\('DOMContentLoaded', function\(\)", "document.addEventListener('DOMContentLoaded', async function()"
$domCode = "isDeviceAuthorized = await isAuthorizedDevice(); if (!isDeviceAuthorized) { const addTab = document.querySelector('[data-tab=\""add\""]'); if (addTab) addTab.style.display = 'none'; } document.addEventListener('keydown', async (e) => { if (e.ctrlKey && e.shiftKey && e.key === 'A') { await authorizeCurrentDevice(); location.reload(); } if (e.ctrlKey && e.shiftKey && e.key === 'F') { await showCurrentFingerprint(); } }); await loadFromGitHub();"
$current = $current -replace "(setupEventListeners\(\);)", "`$1`n            $domCode"
Write-Host "5. DOMContentLoaded actualizado (fingerprint + GitHub sync)" -ForegroundColor Green

# ===== PASO 5: REEMPLAZAR isMobileDevice por isDeviceAuthorized =====
$current = $current -replace '\$\{isMobileDevice\(\)', '${isDeviceAuthorized'
Write-Host "6. isMobileDevice reemplazado por isDeviceAuthorized" -ForegroundColor Green

# ===== PASO 6: EXTRAER HTML DEL MATERIAL =====
if ($material -match '(?s)<div class="form-section">.*?<h3><i class="fas fa-toolbox"></i> Material Necesario</h3>.*?</div>\s+</div>\s+<!-- Botones -->') {
    $materialHTML = $matches[0]
    # Buscar donde insertar (antes de los botones del formulario)
    $current = $current -replace '(\s+<!-- Botones -->)', "`n`n$materialHTML`n`$1"
    Write-Host "7. Seccion de Material Necesario agregada al formulario" -ForegroundColor Green
} else {
    Write-Host "7. AVISO: No se encontro HTML de material" -ForegroundColor Yellow
}

# ===== PASO 7: ACTUALIZAR saveFerratahandleFormSubmit PARA INCLUIR MATERIAL =====
if ($material -match '(?s)// Recopilar material seleccionado.*?otrosMateriales: document\.getElementById\(.*?\)\.value') {
    $materialJS = $matches[0]
    # Insertar antes de const ferrata = {
    $current = $current -replace "(const ferrata = \{)", "$materialJS`n`n            `$1"
    Write-Host "8. Logica de recopilacion de material agregada" -ForegroundColor Green
} else {
    Write-Host "8. AVISO: No se encontro JS de material" -ForegroundColor Yellow
}

# ===== PASO 8: AGREGAR MATERIAL AL OBJETO FERRATA =====
if ($material -match '(?s)lat: selectedCoords\.lat,.*?material: materialData,') {
    $current = $current -replace "(descripcion: descripcion,)", "`$1`n                material: materialData,"
    Write-Host "9. Campo material agregado al objeto ferrata" -ForegroundColor Green
}

# ===== PASO 9: ACTUALIZAR saveFerratas PARA SINCRONIZAR CON GITHUB =====
$current = $current -replace "(localStorage\.setItem\('ferratas', JSON\.stringify\(ferratas\)\);)", "`$1`n            await syncToGitHub(ferratas);"
Write-Host "10. Sincronizacion con GitHub agregada a saveFerratas" -ForegroundColor Green

# ===== PASO 10: ACTUALIZAR MODAL DE DETALLES PARA MOSTRAR MATERIAL =====
if ($material -match '(?s)<!-- Material Necesario -->.*?</div>') {
    $materialModal = $matches[0]
    $current = $current -replace "(<div style=\"margin-top: 20px;\">.*?</div>\s+</div>)", "$materialModal`n`$1"
    Write-Host "11. Visualizacion de material en modal agregada" -ForegroundColor Green
}

# Guardar con UTF-8 BOM
$utf8Bom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText("ferrata-app.html", $current, $utf8Bom)

Write-Host ""
Write-Host "=== INTEGRACION COMPLETA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Funcionalidades incluidas:" -ForegroundColor Cyan
Write-Host "  - Filtrado por combobox (K1-K6)" -ForegroundColor White
Write-Host "  - Browser Fingerprinting" -ForegroundColor White
Write-Host "  - Sincronizacion automatica con GitHub" -ForegroundColor White
Write-Host "  - Gestion de material necesario" -ForegroundColor White
Write-Host "  - Codificacion UTF-8 correcta" -ForegroundColor White
