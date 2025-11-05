# Script de respaldo automático para Vías Ferratas PWA (PowerShell)

# Función para escribir con colores
function Write-ColoredOutput {
    param(
        [string]$Text,
        [ConsoleColor]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

Write-ColoredOutput "🔄 Iniciando respaldo automático..." -Color Green

# Verificar si estamos en un repositorio git
if (!(Test-Path ".git")) {
    Write-ColoredOutput "❌ Error: No se encontró repositorio git" -Color Red
    exit 1
}

# Obtener fecha y hora actual
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$branchName = "backup_$timestamp"

Write-ColoredOutput "📅 Timestamp: $timestamp" -Color Yellow

# Verificar si hay cambios
$diffOutput = git diff --quiet; $staged = git diff --staged --quiet
if ($LASTEXITCODE -eq 0 -and $staged -eq 0) {
    Write-ColoredOutput "✅ No hay cambios para respaldar" -Color Green
    exit 0
}

# Crear rama de respaldo
Write-ColoredOutput "🌿 Creando rama de respaldo: $branchName" -Color Yellow
git checkout -b $branchName

# Añadir todos los cambios
Write-ColoredOutput "📦 Añadiendo cambios..." -Color Yellow
git add .

# Hacer commit con mensaje descriptivo
$commitMsg = "Respaldo automático - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-ColoredOutput "💾 Creando commit: $commitMsg" -Color Yellow
git commit -m $commitMsg

# Subir rama al remoto
Write-ColoredOutput "☁️ Subiendo respaldo al repositorio remoto..." -Color Yellow
git push -u origin $branchName

# Volver a la rama principal
Write-ColoredOutput "🔙 Volviendo a rama principal..." -Color Yellow
git checkout main

Write-ColoredOutput "✅ Respaldo completado: $branchName" -Color Green
Write-ColoredOutput "📋 Para recuperar: git checkout $branchName" -Color Green

# Listar últimos respaldos
Write-ColoredOutput "📚 Últimos 5 respaldos:" -Color Yellow
git branch -r | Select-String "backup_" | Select-Object -Last 5