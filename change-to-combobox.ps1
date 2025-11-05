# Script para cambiar filtros de botones a combobox
$content = [System.IO.File]::ReadAllText("$PSScriptRoot\ferrata-app.html", [System.Text.Encoding]::UTF8)

Write-Host "Cambiando filtros a combobox..." -ForegroundColor Cyan

# 1. Reemplazar CSS de filter-btn por filter-select
$oldCSS = @'
        .filter-section {
            margin-bottom: 20px;
        }

        .filter-btn {
            padding: 8px 16px;
            margin: 5px;
            border: 2px solid var(--primary-color);
            background: white;
            color: var(--primary-color);
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .filter-btn:hover {
            background: var(--primary-color);
            color: white;
        }

        .filter-btn.active {
            background: var(--primary-color);
            color: white;
        }
'@

$newCSS = @'
        .filter-section {
            margin-bottom: 20px;
        }

        .filter-section label {
            display: block;
            margin-bottom: 8px;
            color: var(--text-dark);
            font-weight: 600;
            font-size: 0.95em;
        }

        .filter-select {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--primary-color);
            background: white;
            border-radius: 8px;
            color: var(--text-dark);
            cursor: pointer;
            transition: all 0.3s;
            font-size: 16px;
        }

        .filter-select:focus {
            outline: none;
            border-color: var(--secondary-color);
            box-shadow: 0 0 0 3px rgba(151, 201, 61, 0.1);
        }
'@

$content = $content -replace [regex]::Escape($oldCSS), $newCSS
Write-Host "1. CSS actualizado" -ForegroundColor Green

# 2. Reemplazar HTML de botones por select
$oldHTML = @'
                <div class="filter-section">
                    <button class="filter-btn active" data-filter="todas">Todas</button>
                    <button class="filter-btn" data-filter="facil">Fácil</button>
                    <button class="filter-btn" data-filter="moderado">Moderado</button>
                    <button class="filter-btn" data-filter="dificil">Difícil</button>
                    <button class="filter-btn" data-filter="muy-dificil">Muy Difícil</button>
                    <button class="filter-btn" data-filter="extremo">Extremo</button>
                </div>
'@

$newHTML = @'
                <div class="filter-section">
                    <label for="filter-select">
                        <i class="fas fa-filter"></i> Filtrar por nivel:
                    </label>
                    <select id="filter-select" class="filter-select">
                        <option value="todas">Todas</option>
                        <option value="k1">K1 - Muy Fácil</option>
                        <option value="k2">K2 - Fácil</option>
                        <option value="k3">K3 - Normal</option>
                        <option value="k4">K4 - Moderada</option>
                        <option value="k5">K5 - Difícil</option>
                        <option value="k6">K6 - Extrema</option>
                    </select>
                </div>
'@

$content = $content -replace [regex]::Escape($oldHTML), $newHTML
Write-Host "2. HTML del filtro actualizado" -ForegroundColor Green

# 3. Reemplazar JavaScript de event listeners
$oldJS = @'
            // Filtros
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentFilter = this.dataset.filter;
                    loadFerratas();
                });
            });
'@

$newJS = @'
            // Filtros
            document.getElementById('filter-select').addEventListener('change', function() {
                currentFilter = this.value;
                loadFerratas();
            });
'@

$content = $content -replace [regex]::Escape($oldJS), $newJS
Write-Host "3. JavaScript de filtros actualizado" -ForegroundColor Green

# 4. Actualizar la lógica de filtrado para usar k1-k6 en lugar de facil/moderado
$oldFilter = @'
            const filtered = ferratas.filter(f => {
                if (currentFilter === 'todas') return true;
                
                // Mapeo de filtros a niveles
                const filterMap = {
                    'facil': ['k1', 'k2'],
                    'moderado': ['k3'],
                    'dificil': ['k4'],
                    'muy-dificil': ['k5'],
                    'extremo': ['k6']
                };
                
                return filterMap[currentFilter]?.includes(f.nivel);
            });
'@

$newFilter = @'
            const filtered = ferratas.filter(f => {
                if (currentFilter === 'todas') return true;
                return f.nivel === currentFilter;
            });
'@

$content = $content -replace [regex]::Escape($oldFilter), $newFilter
Write-Host "4. Logica de filtrado simplificada" -ForegroundColor Green

# Guardar con UTF-8 BOM
$utf8Bom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText("$PSScriptRoot\ferrata-app.html", $content, $utf8Bom)

Write-Host ""
Write-Host "Filtros cambiados a combobox correctamente!" -ForegroundColor Green
