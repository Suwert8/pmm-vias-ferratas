// Gestión de ferratas - v1.5.1

// ===== GESTIÓN DE FERRATAS =====
async function loadFerratas(forceReload = false) {
    try {
        if (forceReload || ferratas.length === 0) {
            // Solo recargar desde GitHub si es forzado o no hay datos en memoria
            const loadedFerratas = await loadFromGitHub();
            ferratas = loadedFerratas || []; // Actualizar variable global
        } else {
            // Usar datos en memoria
            console.log(`📋 Usando ferratas en memoria: ${ferratas.length} ferratas`);
        }
        
        renderFerratas(ferratas);
    } catch (error) {
        console.error('❌ Error al cargar ferratas:', error.message);
        const container = document.getElementById('ferratas-list');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar datos</h3>
                    <p>No se pudieron cargar las vías ferratas desde GitHub</p>
                    <button class="btn btn-primary" onclick="loadFerratas(true)">Reintentar</button>
                </div>
            `;
        }
    }
}

function renderFerratas(ferratasList) {
    const container = document.getElementById('ferratas-list');
    if (!container) {
        console.error('❌ Contenedor ferratas-list no encontrado');
        return;
    }
    
    if (!ferratasList || ferratasList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mountain"></i>
                <h3>No hay vías ferratas</h3>
                <p>Añade tu primera vía ferrata usando el botón +</p>
            </div>
        `;
        return;
    }
    
    // Filtrar según selección actual
    let filteredFerratas = ferratasList;
    if (currentFilter !== 'todas') {
        filteredFerratas = ferratasList.filter(f => f.nivel === currentFilter);
    }
    
    if (filteredFerratas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <h3>No hay ferratas con este filtro</h3>
                <p>Prueba con otro nivel de dificultad</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredFerratas.map(ferrata => `
        <div class="ferrata-card" onclick="showFerrataDetail('${ferrata.id}')">
            <div class="ferrata-header">
                ${ferrata.coverImage ? 
                    `<img src="${ferrata.coverImage}" alt="${ferrata.nombre}" onerror="this.parentElement.innerHTML='<div class=\\"no-image\\">🏔️</div>'">` :
                    '<div class="no-image">🏔️</div>'
                }
                <div class="ferrata-level level-${ferrata.nivel}">${getNivelText(ferrata.nivel)}</div>
            </div>
            <div class="ferrata-body">
                <h3 class="ferrata-title">${ferrata.nombre}</h3>
                <div class="ferrata-info">
                    ${ferrata.duracion ? `<span><i class="fas fa-clock"></i> ${formatDuration(ferrata.duracion)}</span>` : ''}
                    ${ferrata.distancia ? `<span><i class="fas fa-route"></i> ${formatDistance(ferrata.distancia)}</span>` : ''}
                    ${ferrata.ubicacion ? `<span><i class="fas fa-map-marker-alt"></i> ${ferrata.ubicacion}</span>` : ''}
                </div>
                <div class="ferrata-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-small btn-secondary" onclick="editFerrata('${ferrata.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-small btn-accent" onclick="confirmDelete('${ferrata.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function saveFerrataToStorage(ferrata) {
    try {
        if (editingFerrataId) {
            // Modo edición: actualizar ferrata existente
            console.log(`📝 Actualizando ferrata ID ${editingFerrataId}...`);
            ferrata.id = editingFerrataId; // Mantener el ID original
            
            // USAR DATOS EN MEMORIA PARA EVITAR RECURSIÓN
            console.log(`🔄 Usando datos en memoria para actualización: ${ferratas.length} ferratas existentes`);
            const currentFerratas = [...ferratas]; // Copia de los datos en memoria
            const index = currentFerratas.findIndex(f => f.id === editingFerrataId);
            
            if (index === -1) {
                throw new Error('No se encontró la ferrata a actualizar');
            }
            
            currentFerratas[index] = ferrata;
            const result = await saveToGitHub(currentFerratas, 'sync');
            
            if (result) {
                console.log('✅ Ferrata actualizada correctamente');
                editingFerrataId = null; // Salir del modo edición
                
                // Restaurar texto del botón
                const submitBtn = document.querySelector('#ferrata-form button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Vía Ferrata';
                }
                
                // Ocultar botón cancelar
                const cancelBtn = document.getElementById('cancel-edit-btn');
                if (cancelBtn) {
                    cancelBtn.style.display = 'none';
                }
                
                // Restaurar título del formulario
                const formTitle = document.querySelector('#view-add h2');
                if (formTitle) {
                    formTitle.textContent = 'Añadir Nueva Vía Ferrata';
                }
            }
        } else {
            // Modo creación: añadir nueva ferrata
            console.log('📝 Creando nueva ferrata...');
            const result = await saveToGitHub([ferrata], 'add');
            
            if (result) {
                console.log('✅ Nueva ferrata creada correctamente');
            }
        }
    } catch (error) {
        console.error('❌ Error al guardar ferrata:', error.message);
        if (typeof showError === 'function') {
            showError(`❌ Error al guardar la ferrata: ${error.message}`);
        }
        throw error;
    }
}

async function showFerrataDetail(id) {
    try {
        // USAR DATOS EN MEMORIA PARA EVITAR RECURSIÓN
        console.log(`🔍 Buscando ferrata ID ${id} en datos en memoria`);
        const ferrata = ferratas.find(f => f.id === id);
        if (!ferrata) {
            if (typeof showError === 'function') {
                showError(`No se encontró la ferrata con ID ${id}`);
            }
            return;
        }

        const modal = document.getElementById('detail-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        if (!modal || !title || !body) {
            console.error('❌ Elementos del modal no encontrados');
            return;
        }

        title.textContent = ferrata.nombre;
        body.innerHTML = `
            <div class="ferrata-level level-${ferrata.nivel}" style="display: inline-block; margin-bottom: 15px;">
                ${getNivelText(ferrata.nivel)}
            </div>
            
            ${ferrata.coverImage ? `
                <div style="margin-bottom: 20px;">
                    <img src="${ferrata.coverImage}" alt="${ferrata.nombre}" style="width: 100%; border-radius: 8px;">
                </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                ${ferrata.duracion ? `<div><strong><i class="fas fa-clock"></i> Duración:</strong><br>${formatDuration(ferrata.duracion)}</div>` : ''}
                ${ferrata.distancia ? `<div><strong><i class="fas fa-route"></i> Distancia:</strong><br>${formatDistance(ferrata.distancia)}</div>` : ''}
                ${ferrata.ubicacion ? `<div><strong><i class="fas fa-map-marker-alt"></i> Ubicación:</strong><br>${ferrata.ubicacion}</div>` : ''}
                ${ferrata.nivel ? `<div><strong><i class="fas fa-chart-line"></i> Nivel:</strong><br>${getNivelText(ferrata.nivel)}</div>` : ''}
            </div>
            
            ${ferrata.descripcion ? `
                <div style="margin-bottom: 20px;">
                    <strong><i class="fas fa-align-left"></i> Descripción:</strong>
                    <p style="margin-top: 10px; line-height: 1.6;">${ferrata.descripcion}</p>
                </div>
            ` : ''}
            
            ${ferrata.equipamiento ? `
                <div style="margin-bottom: 20px;">
                    <strong><i class="fas fa-tools"></i> Equipamiento:</strong>
                    <p style="margin-top: 10px; line-height: 1.6;">${ferrata.equipamiento}</p>
                </div>
            ` : ''}
            
            ${ferrata.acceso ? `
                <div style="margin-bottom: 20px;">
                    <strong><i class="fas fa-car"></i> Acceso:</strong>
                    <p style="margin-top: 10px; line-height: 1.6;">${ferrata.acceso}</p>
                </div>
            ` : ''}
            
            ${ferrata.observaciones ? `
                <div style="margin-bottom: 20px;">
                    <strong><i class="fas fa-exclamation-triangle"></i> Observaciones:</strong>
                    <p style="margin-top: 10px; line-height: 1.6; color: #ff6b35;">${ferrata.observaciones}</p>
                </div>
            ` : ''}
            
            ${ferrata.mediaFiles && ferrata.mediaFiles.length > 0 ? `
                <div>
                    <strong><i class="fas fa-images"></i> Galería:</strong>
                    <div class="media-gallery">
                        ${ferrata.mediaFiles.map(media => `
                            <div class="media-item" onclick="window.open('${media}', '_blank')">
                                ${media.includes('.mp4') || media.includes('.webm') || media.includes('.mov') ? 
                                    `<video src="${media}" preload="metadata"></video>` :
                                    `<img src="${media}" alt="Foto de ${ferrata.nombre}">`
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ Error al mostrar detalle:', error.message);
        if (typeof showError === 'function') {
            showError(`Error al cargar los detalles: ${error.message}`);
        }
    }
}

async function editFerrata(id) {
    try {
        // USAR DATOS EN MEMORIA PARA EVITAR RECURSIÓN
        console.log(`📝 Editando ferrata ID ${id} desde datos en memoria`);
        const ferrata = ferratas.find(f => f.id === id);
        if (!ferrata) {
            if (typeof showError === 'function') {
                showError('❌ No se encontró la ferrata para editar');
            }
            return;
        }

        // Cambiar a vista de añadir
        const addView = document.querySelector('[data-view="add"]');
        if (addView) {
            addView.click();
        }
        
        // Establecer modo edición
        editingFerrataId = id;
        
        // Llenar formulario con datos existentes
        const form = document.getElementById('ferrata-form');
        if (!form) {
            console.error('❌ Formulario no encontrado');
            return;
        }
        
        const nombreInput = document.getElementById('nombre');
        const ubicacionInput = document.getElementById('ubicacion');
        const nivelSelect = document.getElementById('nivel');
        const distanciaInput = document.getElementById('distancia');
        const duracionInput = document.getElementById('duracion');
        const descripcionTextarea = document.getElementById('descripcion');
        const equipamientoTextarea = document.getElementById('equipamiento');
        const accesoTextarea = document.getElementById('acceso');
        const observacionesTextarea = document.getElementById('observaciones');
        
        if (nombreInput) nombreInput.value = ferrata.nombre || '';
        if (ubicacionInput) ubicacionInput.value = ferrata.ubicacion || '';
        if (nivelSelect) nivelSelect.value = ferrata.nivel || 'k1';
        if (distanciaInput) distanciaInput.value = ferrata.distancia || '';
        if (duracionInput) duracionInput.value = ferrata.duracion || '';
        if (descripcionTextarea) descripcionTextarea.value = ferrata.descripcion || '';
        if (equipamientoTextarea) equipamientoTextarea.value = ferrata.equipamiento || '';
        if (accesoTextarea) accesoTextarea.value = ferrata.acceso || '';
        if (observacionesTextarea) observacionesTextarea.value = ferrata.observaciones || '';
        
        // Establecer coordenadas
        if (ferrata.lat && ferrata.lng) {
            setSelectedCoords(ferrata.lat, ferrata.lng);
            if (map) {
                map.setView([ferrata.lat, ferrata.lng], 12);
            }
        }
        
        // Cambiar textos del formulario
        const submitBtn = document.querySelector('#ferrata-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Vía Ferrata';
        }
        
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-flex';
        }
        
        const formTitle = document.querySelector('#view-add h2');
        if (formTitle) {
            formTitle.textContent = 'Editar Vía Ferrata';
        }
        
        console.log('📝 Formulario llenado para edición');
        
    } catch (error) {
        console.error('❌ Error al editar ferrata:', error.message);
        if (typeof showError === 'function') {
            showError(`Error al editar: ${error.message}`);
        }
    }
}

async function confirmDelete(id) {
    // USAR DATOS EN MEMORIA PARA EVITAR RECURSIÓN
    console.log(`🗑️ Confirmando eliminación de ferrata ID ${id} desde datos en memoria`);
    const ferrata = ferratas.find(f => f.id === id);
    const ferrataName = ferrata ? ferrata.nombre : 'esta vía ferrata';
    
    if (typeof showConfirmation === 'function') {
        const confirmed = await showConfirmation(
            `¿Estás seguro de que quieres eliminar "${ferrataName}"?\\n\\nEsta acción no se puede deshacer.`,
            'Confirmar Eliminación',
            'Eliminar',
            'Cancelar'
        );
        
        if (confirmed) {
            deleteFromGitHub(id);
        }
    }
}

async function deleteFromGitHub(id) {
    try {
        console.log(`🗑️ Eliminando ferrata ID ${id}...`);
        const result = await saveToGitHub(id, 'delete');
        
        if (result) {
            if (typeof showSuccess === 'function') {
                showSuccess('✅ Vía ferrata eliminada correctamente', 'Eliminación Exitosa');
            }
            console.log('✅ Ferrata eliminada correctamente');
        }
    } catch (error) {
        console.error('❌ Error al eliminar ferrata:', error.message);
        if (typeof showError === 'function') {
            showError(`❌ Error al eliminar: ${error.message}`);
        }
    }
}

function cancelEdit() {
    editingFerrataId = null;
    
    const form = document.getElementById('ferrata-form');
    if (form) {
        form.reset();
    }
    
    // Restaurar textos
    const submitBtn = document.querySelector('#ferrata-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Vía Ferrata';
    }
    
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    const formTitle = document.querySelector('#view-add h2');
    if (formTitle) {
        formTitle.textContent = 'Añadir Nueva Vía Ferrata';
    }
    
    // Limpiar coordenadas
    selectedCoords = null;
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    
    const coordsDisplay = document.getElementById('coords-display');
    if (coordsDisplay) {
        coordsDisplay.style.display = 'none';
    }
    
    console.log('📝 Edición cancelada');
}

function applyFilter() {
    const filterSelect = document.getElementById('nivel-filter');
    if (filterSelect) {
        currentFilter = filterSelect.value;
        console.log('🔍 Aplicando filtro:', currentFilter);
        renderFerratas(ferratas);
    }
}

// Gestión de ferratas - v1.5.1