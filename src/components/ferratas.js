// Gestión de ferratas: carga, listado, detalle, edición y borrado

// ===== CARGA =====
async function loadFerratas() {
    const container = document.getElementById('ferratas-list');
    if (container && !state.loaded) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Cargando vías ferratas...</h3>
            </div>
        `;
    }

    try {
        setFerratas(await loadFromGitHub());
    } catch (error) {
        console.error('Error al cargar ferratas:', error);
        const cached = loadLocalCache();
        if (cached) {
            setFerratas(cached);
            showWarning(`No se pudo conectar con GitHub. Mostrando la última copia guardada en este dispositivo.\n${error.message}`, 'Sin conexión');
        } else if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar datos</h3>
                    <p>${escapeHtml(error.message)}</p>
                    <button type="button" class="btn btn-primary" data-action="reload">Reintentar</button>
                </div>
            `;
        }
    }
}

function setFerratas(list) {
    state.ferratas = list;
    state.loaded = true;
    renderFerratas();
}

function getVisibleFerratas() {
    const search = state.search.trim().toLocaleLowerCase('es');
    return state.ferratas
        .filter(f => state.filter === 'todas' || f.nivel === state.filter)
        .filter(f => !search || `${f.nombre} ${f.ubicacion || ''}`.toLocaleLowerCase('es').includes(search))
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
}

// ===== LISTADO =====
function renderFerratas() {
    const container = document.getElementById('ferratas-list');
    const counter = document.getElementById('ferratas-count');
    if (!container) return;

    const visible = getVisibleFerratas();
    renderMarkers(visible);

    if (counter) {
        counter.textContent = state.ferratas.length
            ? `${visible.length} de ${state.ferratas.length}`
            : '';
    }

    if (state.ferratas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mountain"></i>
                <h3>No hay vías ferratas</h3>
                <p>Añade tu primera vía ferrata desde la pestaña "Añadir"</p>
            </div>
        `;
        return;
    }

    if (visible.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <h3>Ninguna ferrata coincide</h3>
                <p>Prueba con otro nivel o con otra búsqueda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = visible.map(ferrata => {
        const cover = getCoverPath(ferrata);
        const id = escapeHtml(ferrata.id);
        return `
        <div class="ferrata-card" data-action="detail" data-id="${id}">
            <div class="ferrata-header">
                ${cover
                    ? `<img src="${escapeHtml(mediaUrl(cover))}" alt="${escapeHtml(ferrata.nombre)}" loading="lazy" data-fallback>`
                    : '<div class="no-image">🏔️</div>'}
                <div class="ferrata-level level-${escapeHtml(ferrata.nivel)}">${escapeHtml(getNivelText(ferrata.nivel))}</div>
            </div>
            <div class="ferrata-body">
                <h3 class="ferrata-title">${escapeHtml(ferrata.nombre)}</h3>
                <div class="ferrata-info">
                    ${ferrata.duracion ? `<span><i class="fas fa-clock"></i> ${escapeHtml(formatDuration(ferrata.duracion))}</span>` : ''}
                    ${ferrata.ubicacion ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ferrata.ubicacion)}</span>` : ''}
                </div>
                <div class="ferrata-actions">
                    <button type="button" class="btn btn-small btn-secondary" data-action="edit" data-id="${id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button type="button" class="btn btn-small btn-accent" data-action="delete" data-id="${id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Si una imagen no carga, mostrar el icono por defecto
    container.querySelectorAll('img[data-fallback]').forEach(img => {
        img.addEventListener('error', () => {
            img.outerHTML = '<div class="no-image">🏔️</div>';
        }, { once: true });
    });
}

// ===== DETALLE =====
function showFerrataDetail(id) {
    const ferrata = state.ferratas.find(f => f.id === id);
    if (!ferrata) {
        showError('No se encontró la vía ferrata.');
        return;
    }

    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    if (!modal || !title || !body) return;

    const media = ferrata.media || [];
    const cover = getCoverPath(ferrata);
    const hasCoords = Number.isFinite(ferrata.lat) && Number.isFinite(ferrata.lng);
    const directions = hasCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${ferrata.lat},${ferrata.lng}`
        : '';
    const textBlock = (icon, label, value, extraClass = '') => value ? `
        <div class="detail-block ${extraClass}">
            <strong><i class="fas ${icon}"></i> ${label}:</strong>
            <p>${escapeHtml(value)}</p>
        </div>` : '';

    title.textContent = ferrata.nombre;
    body.innerHTML = `
        <div class="ferrata-level level-${escapeHtml(ferrata.nivel)} detail-level">
            ${escapeHtml(getNivelText(ferrata.nivel))}
        </div>

        ${cover ? `<img class="detail-cover" src="${escapeHtml(mediaUrl(cover))}" alt="${escapeHtml(ferrata.nombre)}">` : ''}

        <div class="detail-grid">
            ${ferrata.duracion ? `<div><strong><i class="fas fa-clock"></i> Duración:</strong><br>${escapeHtml(formatDuration(ferrata.duracion))}</div>` : ''}
            ${ferrata.ubicacion ? `<div><strong><i class="fas fa-map-marker-alt"></i> Ubicación:</strong><br>${escapeHtml(ferrata.ubicacion)}</div>` : ''}
            ${hasCoords ? `<div><strong><i class="fas fa-crosshairs"></i> Coordenadas:</strong><br>${ferrata.lat.toFixed(5)}, ${ferrata.lng.toFixed(5)}</div>` : ''}
        </div>

        ${textBlock('fa-align-left', 'Descripción', ferrata.descripcion)}
        ${textBlock('fa-tools', 'Equipamiento', ferrata.equipamiento)}
        ${textBlock('fa-exclamation-triangle', 'Observaciones', ferrata.observaciones, 'warning-text')}

        ${media.length > 0 ? `
            <div class="detail-block">
                <strong><i class="fas fa-images"></i> Galería (${media.length}):</strong>
                <div class="media-gallery">
                    ${media.map(item => {
                        const url = escapeHtml(mediaUrl(item.path));
                        return item.type === 'video'
                            ? `<div class="media-item"><video src="${url}" controls preload="metadata" playsinline></video></div>`
                            : `<a class="media-item" href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="Foto de ${escapeHtml(ferrata.nombre)}" loading="lazy"></a>`;
                    }).join('')}
                </div>
            </div>
        ` : ''}

        <div class="detail-actions">
            ${hasCoords ? `
                <a class="btn btn-primary" href="${directions}" target="_blank" rel="noopener">
                    <i class="fas fa-route"></i> Cómo llegar
                </a>
                <button type="button" class="btn btn-secondary" data-action="focus-map" data-id="${escapeHtml(ferrata.id)}">
                    <i class="fas fa-map"></i> Ver en mapa
                </button>` : ''}
            <button type="button" class="btn btn-secondary" data-action="edit" data-id="${escapeHtml(ferrata.id)}">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button type="button" class="btn btn-accent" data-action="delete" data-id="${escapeHtml(ferrata.id)}">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== EDICIÓN =====
function editFerrata(id) {
    const ferrata = state.ferratas.find(f => f.id === id);
    if (!ferrata) {
        showError('No se encontró la vía ferrata para editar.');
        return;
    }

    closeDetailModal();
    resetForm();
    state.editingId = id;

    const setValue = (fieldId, value) => {
        const field = document.getElementById(fieldId);
        if (field) field.value = value ?? '';
    };
    setValue('nombre', ferrata.nombre);
    setValue('ubicacion', ferrata.ubicacion);
    setValue('nivel', ferrata.nivel);
    setValue('duracion', ferrata.duracion);
    setValue('descripcion', ferrata.descripcion);
    setValue('equipamiento', ferrata.equipamiento);
    setValue('observaciones', ferrata.observaciones);

    if (Number.isFinite(ferrata.lat) && Number.isFinite(ferrata.lng)) {
        setSelectedCoords(ferrata.lat, ferrata.lng);
    }

    state.formMedia = (ferrata.media || []).map(item => ({ ...item }));
    renderMediaPreview();
    setFormMode('edit');
    showView('add');
}

// ===== BORRADO =====
async function confirmDelete(id) {
    const ferrata = state.ferratas.find(f => f.id === id);
    if (!ferrata) return;

    const confirmed = await showConfirmation(
        `¿Seguro que quieres eliminar "${ferrata.nombre}"?\nTambién se borrarán sus fotos y vídeos. Esta acción no se puede deshacer.`,
        'Confirmar eliminación',
        'Eliminar',
        'Cancelar'
    );
    if (!confirmed) return;

    const progress = showNotification('Eliminando...', 'info', 'GitHub', 0);
    try {
        const updated = await commitChanges(remote => {
            const target = remote.find(f => f.id === id);
            return {
                ferratas: remote.filter(f => f.id !== id),
                deletePaths: target ? (target.media || []).map(m => m.path) : []
            };
        }, `Eliminar ferrata "${ferrata.nombre}"`);

        closeDetailModal();
        if (state.editingId === id) resetForm();
        setFerratas(updated);
        showSuccess('Vía ferrata eliminada correctamente.');
    } catch (error) {
        console.error('Error al eliminar:', error);
        showError(`No se pudo eliminar.\n${error.message}`);
    } finally {
        progress?.remove();
    }
}
