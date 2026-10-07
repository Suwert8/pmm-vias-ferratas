// Interfaz de usuario: formulario, multimedia, navegación y modales

let autoLocationRequested = false;

// ===== FORMULARIO =====
async function handleFormSubmit(event) {
    event.preventDefault();
    if (state.submitting) return;

    const form = event.target;
    const formData = new FormData(form);
    const nombre = (formData.get('nombre') || '').trim();
    const nivel = formData.get('nivel');

    document.getElementById('nombre').classList.toggle('invalid', !nombre);
    document.getElementById('nivel').classList.toggle('invalid', !NIVELES[nivel]);
    if (!nombre) {
        showWarning('El nombre es obligatorio.');
        document.getElementById('nombre').focus();
        return;
    }
    if (!NIVELES[nivel]) {
        showWarning('Selecciona un nivel de dificultad.');
        return;
    }
    if (!state.selectedCoords) {
        showWarning('Selecciona la ubicación: usa "Mi ubicación" o "Elegir en mapa".');
        return;
    }

    const isEdit = Boolean(state.editingId);
    const id = state.editingId || generateId();
    const duracion = parseInt(formData.get('duracion'), 10);
    const fields = {
        nombre,
        ubicacion: (formData.get('ubicacion') || '').trim(),
        nivel,
        duracion: duracion > 0 ? duracion : null,
        descripcion: (formData.get('descripcion') || '').trim(),
        equipamiento: (formData.get('equipamiento') || '').trim(),
        observaciones: (formData.get('observaciones') || '').trim(),
        lat: state.selectedCoords.lat,
        lng: state.selectedCoords.lng
    };
    const formMedia = state.formMedia.map(item => ({ ...item }));

    setSubmitting(true);
    const progress = showNotification('Preparando...', 'info', 'Guardando', 0);
    const setProgress = (text) => {
        const message = progress?.querySelector('.notification-message');
        if (message) message.textContent = text;
    };

    try {
        const updated = await commitChanges(remote => {
            const now = new Date().toISOString();
            const existing = remote.find(f => f.id === id);
            if (isEdit && !existing) {
                throw new Error('Esta vía ferrata se eliminó desde otro dispositivo.');
            }

            const ferrata = {
                id,
                ...fields,
                media: formMedia,
                ascensiones: existing?.ascensiones || [],
                fechaCreacion: existing?.fechaCreacion || now,
                fechaModificacion: now
            };
            const keptPaths = new Set(formMedia.map(m => m.path));
            const deletePaths = existing
                ? (existing.media || []).map(m => m.path).filter(p => !keptPaths.has(p))
                : [];

            return {
                ferratas: existing ? remote.map(f => (f.id === id ? ferrata : f)) : [...remote, ferrata],
                deletePaths
            };
        }, `${isEdit ? 'Actualizar' : 'Añadir'} ferrata "${nombre}"`, setProgress);

        setFerratas(updated);
        resetForm();
        showView('list');
        showSuccess(isEdit ? 'Vía ferrata actualizada correctamente.' : 'Vía ferrata guardada correctamente.');
    } catch (error) {
        console.error('Error al guardar:', error);
        showError(`No se pudo guardar. Tus datos siguen en el formulario.\n${error.message}`);
    } finally {
        progress?.remove();
        setSubmitting(false);
    }
}

function setSubmitting(submitting) {
    state.submitting = submitting;
    const submitBtn = document.getElementById('submit-btn');
    if (!submitBtn) return;
    submitBtn.disabled = submitting;
    if (submitting) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    } else {
        setFormMode(state.editingId ? 'edit' : 'create');
    }
}

function setFormMode(mode) {
    const isEdit = mode === 'edit';
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const formTitle = document.getElementById('form-title');

    if (submitBtn && !state.submitting) {
        submitBtn.innerHTML = `<i class="fas fa-save"></i> ${isEdit ? 'Guardar cambios' : 'Guardar'}`;
    }
    if (cancelBtn) cancelBtn.style.display = isEdit ? 'inline-flex' : 'none';
    if (formTitle) formTitle.textContent = isEdit ? 'Editar vía ferrata' : 'Nueva vía ferrata';
}

function resetForm() {
    document.getElementById('ferrata-form')?.reset();
    document.querySelectorAll('#ferrata-form .invalid').forEach(el => el.classList.remove('invalid'));
    state.editingId = null;
    state.formMedia = [];
    renderMediaPreview();
    clearSelectedCoords();
    setFormMode('create');
}

function cancelEdit() {
    resetForm();
    showView('list');
}

// ===== MULTIMEDIA =====
async function handleMediaUpload(event) {
    const input = event.target;
    const files = Array.from(input.files || []);
    input.value = ''; // permite volver a elegir el mismo archivo
    if (files.length === 0) return;

    const upload = document.getElementById('media-upload');
    upload?.classList.add('processing');

    for (const file of files) {
        try {
            if (file.type.startsWith('image/')) {
                state.formMedia.push({ path: await compressImage(file), type: 'image' });
            } else if (file.type.startsWith('video/')) {
                if (file.size > MAX_VIDEO_BYTES) {
                    showWarning(`El vídeo "${file.name}" es demasiado grande (máximo ${MAX_VIDEO_BYTES / 1024 / 1024} MB).`);
                    continue;
                }
                state.formMedia.push({ path: await readAsDataUrl(file), type: 'video' });
            } else {
                showWarning(`"${file.name}" no es una foto ni un vídeo.`);
            }
        } catch (error) {
            console.error('Error procesando archivo:', error);
            showWarning(`No se pudo procesar "${file.name}".`);
        }
        renderMediaPreview();
    }

    upload?.classList.remove('processing');
}

function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// Reduce la foto a MAX_IMAGE_DIMENSION px y la convierte a JPEG
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.naturalWidth * scale);
            canvas.height = Math.round(img.naturalHeight * scale);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Formato de imagen no soportado'));
        };
        img.src = url;
    });
}

function renderMediaPreview() {
    const container = document.getElementById('media-preview');
    if (!container) return;

    container.innerHTML = state.formMedia.map((item, index) => {
        const url = escapeHtml(mediaUrl(item.path));
        const isCover = item === state.formMedia.find(m => m.type === 'image');
        return `
            <div class="preview-image">
                ${item.type === 'video'
                    ? `<video src="${url}" preload="metadata" muted playsinline></video><span class="media-badge"><i class="fas fa-video"></i></span>`
                    : `<img src="${url}" alt="Vista previa">`}
                ${isCover ? '<span class="cover-badge">Portada</span>' : ''}
                <button type="button" class="remove-btn" data-action="remove-media" data-index="${index}" aria-label="Quitar">×</button>
            </div>`;
    }).join('');
}

function removeMediaFile(index) {
    if (index >= 0 && index < state.formMedia.length) {
        state.formMedia.splice(index, 1);
        renderMediaPreview();
    }
}

// ===== DESCRIPCIÓN SUGERIDA =====
async function generateDescription() {
    const nombre = document.getElementById('nombre').value.trim();
    const nivel = document.getElementById('nivel').value;
    const ubicacion = document.getElementById('ubicacion').value.trim();
    const duracion = parseInt(document.getElementById('duracion').value, 10);
    const descripcion = document.getElementById('descripcion');

    if (!nombre) {
        showWarning('Escribe primero el nombre de la vía ferrata.');
        return;
    }
    if (descripcion.value.trim()) {
        const replace = await showConfirmation('Ya hay una descripción escrita. ¿Quieres reemplazarla?', 'Reemplazar descripción', 'Reemplazar', 'Cancelar');
        if (!replace) return;
    }

    const partes = [`Vía ferrata "${nombre}"${ubicacion ? `, situada en ${ubicacion}` : ''}.`];
    if (NIVELES[nivel]) partes.push(`Dificultad ${getNivelText(nivel)}.`);
    if (duracion > 0) partes.push(`Duración aproximada: ${formatDuration(duracion)}.`);
    partes.push('Revisa el estado del equipamiento y la previsión meteorológica antes de salir.');
    descripcion.value = partes.join(' ');
}

// ===== NAVEGACIÓN =====
function showView(name) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === name);
    });
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${name}`);
    });

    if (name !== 'map' && state.selectingOnMap) {
        finishMapSelection();
    }
    if (name === 'map' && map) {
        const selecting = state.selectingOnMap;
        setTimeout(() => {
            map.invalidateSize();
            if (!selecting) fitMarkersOnce();
        }, 100);
    }
    if (name === 'add' && !state.editingId && !state.selectedCoords && !autoLocationRequested) {
        autoLocationRequested = true;
        useCurrentLocation();
    }
    window.scrollTo({ top: 0 });
}

// ===== MODALES =====
function closeDetailModal() {
    document.getElementById('detail-modal')?.classList.remove('active');
    document.body.style.overflow = '';
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    const input = document.getElementById('token-input');
    if (!modal || !input) return;
    input.value = '';
    input.placeholder = githubToken ? `Token actual: ${githubToken.slice(0, 8)}…` : 'github_pat_...';
    document.getElementById('remove-token-btn').style.display = githubToken ? 'inline-flex' : 'none';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    document.getElementById('settings-modal')?.classList.remove('active');
    document.body.style.overflow = '';
}

async function saveTokenFromSettings(event) {
    event.preventDefault();
    const input = document.getElementById('token-input');
    const button = document.getElementById('save-token-btn');
    const token = input.value.trim();
    if (!token) {
        showWarning('Pega el token antes de guardar.');
        return;
    }

    button.disabled = true;
    try {
        await verifyGitHubToken(token);
        setGitHubToken(token);
        closeSettings();
        showSuccess('Token verificado. Ya puedes guardar cambios.', 'GitHub conectado');
    } catch (error) {
        showError(error.message, 'Token no válido');
    } finally {
        button.disabled = false;
    }
}

function removeToken() {
    setGitHubToken('');
    closeSettings();
    showInfo('Token eliminado de este dispositivo.');
}

// ===== EVENTOS =====
function setupEventListeners() {
    document.getElementById('ferrata-form')?.addEventListener('submit', handleFormSubmit);
    document.getElementById('select-on-map')?.addEventListener('click', enableMapSelection);
    document.getElementById('use-location')?.addEventListener('click', useCurrentLocation);
    document.getElementById('media-files')?.addEventListener('change', handleMediaUpload);
    document.getElementById('generate-description')?.addEventListener('click', generateDescription);
    document.getElementById('cancel-edit-btn')?.addEventListener('click', cancelEdit);
    document.getElementById('cancel-map-selection')?.addEventListener('click', () => {
        finishMapSelection();
        showView('add');
    });

    document.querySelectorAll('#nivel-chips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            state.filter = chip.dataset.nivel;
            renderFerratas();
        });
    });
    document.querySelectorAll('#stats .stat').forEach(stat => {
        stat.addEventListener('click', () => {
            state.estado = stat.dataset.estado;
            renderFerratas();
        });
    });
    document.getElementById('search-input')?.addEventListener('input', (e) => {
        state.search = e.target.value;
        renderFerratas();
    });
    document.getElementById('reload-btn')?.addEventListener('click', async (e) => {
        const icon = e.currentTarget.querySelector('i');
        icon?.classList.add('fa-spin');
        await loadFerratas();
        icon?.classList.remove('fa-spin');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => showView(item.dataset.view));
    });

    // Modales
    document.getElementById('close-modal')?.addEventListener('click', closeDetailModal);
    document.getElementById('detail-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') closeDetailModal();
    });
    document.getElementById('github-status')?.addEventListener('click', openSettings);
    document.getElementById('close-settings')?.addEventListener('click', closeSettings);
    document.getElementById('settings-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') closeSettings();
    });
    document.getElementById('token-form')?.addEventListener('submit', saveTokenFromSettings);
    setupAscensionListeners();
    document.getElementById('remove-token-btn')?.addEventListener('click', removeToken);

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (document.getElementById('ascension-modal')?.classList.contains('active')) {
            closeAscensionForm();
        } else {
            closeDetailModal();
            closeSettings();
        }
    });

    // Acciones de elementos generados dinámicamente
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const { action, id } = target.dataset;

        switch (action) {
            case 'detail': showFerrataDetail(id); break;
            case 'edit': editFerrata(id); break;
            case 'delete': confirmDelete(id); break;
            case 'focus-map': focusFerrataOnMap(id); break;
            case 'reload': loadFerratas(); break;
            case 'remove-media': removeMediaFile(Number(target.dataset.index)); break;
            case 'add-ascension': openAscensionForm(id); break;
            case 'edit-ascension': openAscensionForm(id, target.dataset.asc); break;
            case 'delete-ascension': deleteAscension(id, target.dataset.asc); break;
            case 'clear-filters': clearFilters(); break;
            case 'go-add': showView('add'); break;
        }
    });
}
