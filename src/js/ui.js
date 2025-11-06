// Interfaz de usuario y formularios - v1.4.0

// ===== GESTIÓN DE FORMULARIOS =====
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Prevenir doble envío
    if (isSubmitting) {
        console.log('⚠️ Ya hay un envío en progreso...');
        return;
    }
    
    isSubmitting = true;
    console.log('📝 Iniciando envío de formulario...');
    
    try {
        const formData = new FormData(event.target);
        
        // Validar campos requeridos
        const nombre = formData.get('nombre')?.trim();
        const nivel = formData.get('nivel');
        
        if (!nombre) {
            throw new Error('El nombre es obligatorio');
        }
        
        if (!selectedCoords) {
            throw new Error('Debes seleccionar una ubicación en el mapa');
        }
        
        // Crear objeto ferrata
        const ferrata = {
            id: editingFerrataId || generateId(),
            nombre: nombre,
            ubicacion: formData.get('ubicacion')?.trim() || '',
            nivel: nivel || 'k1',
            distancia: parseInt(formData.get('distancia')) || null,
            duracion: parseInt(formData.get('duracion')) || null,
            descripcion: formData.get('descripcion')?.trim() || '',
            equipamiento: formData.get('equipamiento')?.trim() || '',
            acceso: formData.get('acceso')?.trim() || '',
            observaciones: formData.get('observaciones')?.trim() || '',
            lat: selectedCoords.lat,
            lng: selectedCoords.lng,
            coverImage: coverImageData || null,
            mediaFiles: [...mediaFiles],
            fechaCreacion: editingFerrataId ? undefined : new Date().toISOString(),
            fechaModificacion: new Date().toISOString()
        };
        
        console.log('📋 Datos del formulario:', ferrata);
        
        // Guardar ferrata
        await saveFerrataToStorage(ferrata);
        
        // Resetear formulario solo si es creación exitosa
        if (!editingFerrataId) {
            event.target.reset();
            selectedCoords = null;
            coverImageData = null;
            mediaFiles = [];
            
            // Limpiar vista previa de imágenes
            const previewContainer = document.getElementById('media-preview');
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
            
            // Ocultar coordenadas
            const coordsDisplay = document.getElementById('coords-display');
            if (coordsDisplay) {
                coordsDisplay.style.display = 'none';
            }
            
            // Remover marcador del mapa
            if (marker) {
                map.removeLayer(marker);
                marker = null;
            }
        }
        
        // Cambiar a vista de lista
        const listView = document.querySelector('[data-view="list"]');
        if (listView) {
            listView.click();
        }
        
        if (typeof showSuccess === 'function') {
            showSuccess(
                editingFerrataId ? 
                '✅ Vía ferrata actualizada correctamente' : 
                '✅ Vía ferrata creada correctamente',
                'Guardado Exitoso'
            );
        }
        
        console.log('✅ handleFormSubmit completado');
        
    } catch (error) {
        console.error('❌ Error en formulario:', error.message);
        if (typeof showError === 'function') {
            showError(`❌ Error al guardar: ${error.message}`);
        }
    } finally {
        isSubmitting = false;
    }
}

// ===== NAVEGACIÓN =====
function setupMobileNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            
            // Actualizar navegación activa
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Mostrar vista correspondiente
            views.forEach(view => view.classList.remove('active'));
            const targetElement = document.getElementById(`view-${targetView}`);
            if (targetElement) {
                targetElement.classList.add('active');
            }
            
            // Invalidar tamaño del mapa si se muestra la vista del mapa
            if (targetView === 'map' && map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
            
            console.log(`📱 Vista cambiada a: ${targetView}`);
        });
    });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    console.log('🎛️ Configurando event listeners...');
    
    // Formulario principal
    const form = document.getElementById('ferrata-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Event listener del formulario configurado');
    }
    
    // Botón de selección en mapa
    const selectMapBtn = document.getElementById('select-on-map');
    if (selectMapBtn) {
        selectMapBtn.addEventListener('click', enableMapSelection);
    }
    
    // Upload de archivos
    const mediaUpload = document.getElementById('media-files');
    if (mediaUpload) {
        mediaUpload.addEventListener('change', handleMediaUpload);
    }
    
    // Cerrar modal
    const closeModal = document.getElementById('close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', closeDetailModal);
    }
    
    // Cerrar modal clickeando fuera
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDetailModal();
            }
        });
    }
    
    // Filtro de nivel
    const filterSelect = document.getElementById('nivel-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', applyFilter);
    }
    
    // Generar descripción con IA
    const generateBtn = document.getElementById('generate-description');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateDescription);
    }
    
    // Botón flotante para añadir (si existe)
    const fab = document.querySelector('.fab');
    if (fab) {
        fab.addEventListener('click', () => {
            const addView = document.querySelector('[data-view="add"]');
            if (addView) {
                addView.click();
            }
        });
    }
    
    // Atajos de teclado
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    console.log('✅ Todos los event listeners configurados');
}

function handleKeyboardShortcuts(event) {
    // Solo procesar si Ctrl+Shift están presionados
    if (event.ctrlKey && event.shiftKey) {
        switch (event.key.toLowerCase()) {
            case 't':
                event.preventDefault();
                if (typeof configureGitHubToken === 'function') {
                    configureGitHubToken();
                }
                break;
            case 's':
                event.preventDefault();
                if (typeof reloadGitHub === 'function') {
                    reloadGitHub();
                }
                break;
            case 'r':
                event.preventDefault();
                loadFerratas(true);
                break;
        }
    }
}

// ===== MANEJO DE ARCHIVOS =====
function handleMediaUpload(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    console.log(`📁 Procesando ${files.length} archivos...`);
    
    const previewContainer = document.getElementById('media-preview');
    if (!previewContainer) return;
    
    files.forEach((file, index) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB límite
            if (typeof showWarning === 'function') {
                showWarning(`El archivo ${file.name} es demasiado grande (máximo 5MB)`);
            }
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            
            // Si es el primer archivo, usarlo como imagen de portada
            if (index === 0 && file.type.startsWith('image/')) {
                coverImageData = dataUrl;
            }
            
            // Añadir a la lista de archivos multimedia
            mediaFiles.push(dataUrl);
            
            // Crear preview
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-image';
            
            if (file.type.startsWith('image/')) {
                previewDiv.innerHTML = `
                    <img src="${dataUrl}" alt="Preview">
                    <button class="remove-btn" onclick="removeMediaFile(${mediaFiles.length - 1})">×</button>
                `;
            } else if (file.type.startsWith('video/')) {
                previewDiv.innerHTML = `
                    <video src="${dataUrl}" preload="metadata"></video>
                    <button class="remove-btn" onclick="removeMediaFile(${mediaFiles.length - 1})">×</button>
                `;
            }
            
            previewContainer.appendChild(previewDiv);
        };
        
        reader.readAsDataURL(file);
    });
}

function removeMediaFile(index) {
    if (index >= 0 && index < mediaFiles.length) {
        mediaFiles.splice(index, 1);
        
        // Si era la imagen de portada, limpiarla
        if (index === 0) {
            coverImageData = null;
        }
        
        // Regenerar preview
        const previewContainer = document.getElementById('media-preview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            
            mediaFiles.forEach((file, i) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'preview-image';
                
                if (file.includes('data:image')) {
                    previewDiv.innerHTML = `
                        <img src="${file}" alt="Preview">
                        <button class="remove-btn" onclick="removeMediaFile(${i})">×</button>
                    `;
                } else {
                    previewDiv.innerHTML = `
                        <video src="${file}" preload="metadata"></video>
                        <button class="remove-btn" onclick="removeMediaFile(${i})">×</button>
                    `;
                }
                
                previewContainer.appendChild(previewDiv);
            });
        }
        
        console.log(`🗑️ Archivo ${index} eliminado`);
    }
}

// ===== MODAL =====
function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===== GENERACIÓN DE DESCRIPCIÓN IA =====
function generateDescription() {
    const nombreInput = document.getElementById('nombre');
    const nivelSelect = document.getElementById('nivel');
    const ubicacionInput = document.getElementById('ubicacion');
    const descripcionTextarea = document.getElementById('descripcion');
    
    if (!nombreInput || !nivelSelect || !descripcionTextarea) {
        if (typeof showError === 'function') {
            showError('No se encontraron los campos necesarios para generar la descripción');
        }
        return;
    }
    
    const nombre = nombreInput.value.trim();
    const nivel = nivelSelect.value;
    const ubicacion = ubicacionInput.value.trim();
    
    if (!nombre) {
        if (typeof showWarning === 'function') {
            showWarning('Introduce un nombre para la vía ferrata antes de generar la descripción');
        }
        return;
    }
    
    // Generar descripción básica
    const nivelTexto = getNivelText(nivel);
    const ubicacionTexto = ubicacion ? ` en ${ubicacion}` : '';
    
    const descripcionGenerada = `La vía ferrata "${nombre}"${ubicacionTexto} es una ruta de nivel ${nivelTexto}. Esta ferrata ofrece una experiencia emocionante con vistas espectaculares y desafíos técnicos apropiados para su nivel de dificultad. Se recomienda llevar el equipamiento adecuado y verificar las condiciones meteorológicas antes de la ascensión.`;
    
    descripcionTextarea.value = descripcionGenerada;
    
    if (typeof showSuccess === 'function') {
        showSuccess('Descripción generada correctamente', 'IA');
    }
    
    console.log('🤖 Descripción generada automáticamente');
}

// ===== UTILIDADES UI =====
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleView(viewName) {
    const navItem = document.querySelector(`[data-view="${viewName}"]`);
    if (navItem) {
        navItem.click();
    }
}

console.log('🎨 UI MODULE CARGADO - v1.4.0');