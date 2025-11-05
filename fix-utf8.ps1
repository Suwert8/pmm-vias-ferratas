# Convertir a UTF-8 con BOM para asegurar que GitHub Pages lo sirva correctamente
$content = [System.IO.File]::ReadAllText("$PSScriptRoot\ferrata-app.html", [System.Text.Encoding]::UTF8)

# Verificar caracteres problemáticos
$problemas = @{
    'VÃ­as' = 'Vías'
    'VÃƒÂ­as' = 'Vías'
    'AÃ±adir' = 'Añadir'
    'AÃƒÂ±adir' = 'Añadir'
    'descripciÃ³n' = 'descripción'
    'ubicaciÃ³n' = 'ubicación'
    'informaciÃ³n' = 'información'
    'Ã­' = 'í'
    'Ã³' = 'ó'
    'Ã±' = 'ñ'
    'Ã¡' = 'á'
    'Ã©' = 'é'
    'Ãº' = 'ú'
}

$reemplazos = 0
foreach ($mal in $problemas.Keys) {
    if ($content -match [regex]::Escape($mal)) {
        $content = $content -replace [regex]::Escape($mal), $problemas[$mal]
        $reemplazos++
        Write-Host "Corregido: $mal -> $($problemas[$mal])" -ForegroundColor Yellow
    }
}

if ($reemplazos -eq 0) {
    Write-Host "No se encontraron caracteres corruptos" -ForegroundColor Green
} else {
    Write-Host "$reemplazos reemplazos realizados" -ForegroundColor Green
}

# Guardar con UTF-8 con BOM
$utf8Bom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText("$PSScriptRoot\ferrata-app.html", $content, $utf8Bom)

Write-Host "Archivo guardado con UTF-8 BOM" -ForegroundColor Cyan

# Verificar
$verify = [System.IO.File]::ReadAllText("$PSScriptRoot\ferrata-app.html", [System.Text.Encoding]::UTF8)
if ($verify -match '<title>Vías Ferratas') {
    Write-Host "Verificacion OK: Titulo correcto" -ForegroundColor Green
} else {
    Write-Host "ERROR: Titulo aun incorrecto" -ForegroundColor Red
    $verify | Select-String -Pattern "<title>" | Select-Object -First 1
}
