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
        .filter(f => state.estado === 'todas' || (state.estado === 'hechas') === isDone(f))
        .filter(f => !search || `${f.nombre} ${f.ubicacion || ''}`.toLocaleLowerCase('es').includes(search))
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));
}

// ===== LISTADO =====
function renderStats() {
    const done = state.ferratas.filter(isDone).length;
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    setText('stat-total', state.ferratas.length);
    setText('stat-done', done);
    setText('stat-pending', state.ferratas.length - done);

    document.querySelectorAll('#stats .stat').forEach(stat => {
        stat.classList.toggle('active', stat.dataset.estado === state.estado);
    });
    document.querySelectorAll('#nivel-chips .chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.nivel === state.filter);
    });
}

function renderFerratas() {
    const container = document.getElementById('ferratas-list');
    const counter = document.getElementById('ferratas-count');
    if (!container) return;

    const visible = getVisibleFerratas();
    renderStats();
    renderMarkers(visible);

    const filtering = state.filter !== 'todas' || state.estado !== 'todas' || state.search.trim();
    if (counter) {
        counter.textContent = filtering && state.ferratas.length
            ? `${visible.length} de ${state.ferratas.length} ferratas`
            : '';
    }

    if (state.ferratas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mountain"></i>
                <h3>Aún no hay vías ferratas</h3>
                <p>Añade la primera desde la pestaña "Añadir"</p>
                <button type="button" class="btn btn-primary" data-action="go-add"><i class="fas fa-plus"></i> Añadir ferrata</button>
            </div>
        `;
        return;
    }

    if (visible.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <h3>Ninguna ferrata coincide</h3>
                <p>Prueba con otro nivel, estado o búsqueda</p>
                <button type="button" class="btn btn-light" data-action="clear-filters">Quitar filtros</button>
            </div>
        `;
        return;
    }

    container.innerHTML = visible.map(ferrata => {
        const cover = getCoverPath(ferrata);
        const done = isDone(ferrata);
        const last = lastAscension(ferrata);
        const rating = averageRating(ferrata);
        const count = (ferrata.ascensiones || []).length;
        return `
        <article class="ferrata-card" data-action="detail" data-id="${escapeHtml(ferrata.id)}">
            <div class="ferrata-thumb">
                ${cover
                    ? `<img src="${escapeHtml(mediaUrl(cover))}" alt="" loading="lazy" data-fallback>`
                    : '<div class="no-image"><i class="fas fa-mountain"></i></div>'}
                ${done ? '<span class="done-badge" title="Hecha"><i class="fas fa-check"></i></span>' : ''}
            </div>
            <div class="ferrata-body">
                <h3 class="ferrata-title">${escapeHtml(ferrata.nombre)}</h3>
                ${ferrata.ubicacion ? `<div class="ferrata-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ferrata.ubicacion)}</div>` : ''}
                ${rating > 0 ? renderStars(rating) : ''}
                <div class="ferrata-meta">
                    <span class="tag level-tag level-${escapeHtml(ferrata.nivel)}">${escapeHtml((ferrata.nivel || '').toUpperCase())}</span>
                    ${ferrata.duracion ? `<span class="tag"><i class="far fa-clock"></i> ${escapeHtml(formatDuration(ferrata.duracion))}</span>` : ''}
                    ${done
                        ? `<span class="tag tag-done"><i class="fas fa-check"></i> ${count > 1 ? `${count} veces` : escapeHtml(formatDate(last.fecha))}</span>`
                        : '<span class="tag tag-pending">Pendiente</span>'}
                </div>
            </div>
        </article>`;
    }).join('');

    // Si una imagen no carga, mostrar el icono por defecto
    container.querySelectorAll('img[data-fallback]').forEach(img => {
        img.addEventListener('error', () => {
            img.outerHTML = '<div class="no-image"><i class="fas fa-mountain"></i></div>';
        }, { once: true });
    });
}

function clearFilters() {
    state.filter = 'todas';
    state.estado = 'todas';
    state.search = '';
    const search = document.getElementById('search-input');
    if (search) search.value = '';
    renderFerratas();
}

// ===== DETALLE =====
function showFerrataDetail(id) {
    const ferrata = state.ferratas.find(f => f.id === id);
    if (!ferrata) {
        showError('No se encontró la vía ferrata.');
        return;
    }

    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    const safeId = escapeHtml(ferrata.id);
    const media = ferrata.media || [];
    const cover = getCoverPath(ferrata);
    const done = isDone(ferrata);
    const rating = averageRating(ferrata);
    const hasCoords = Number.isFinite(ferrata.lat) && Number.isFinite(ferrata.lng);
    const directions = hasCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${ferrata.lat},${ferrata.lng}`
        : '';
    const textSection = (icon, label, value, extraClass = '') => value ? `
        <div class="detail-section ${extraClass}">
            <h3><span><i class="fas ${icon}"></i> ${label}</span></h3>
            <p>${escapeHtml(value)}</p>
        </div>` : '';

    body.innerHTML = `
        <div class="detail-hero">
            ${cover
                ? `<img src="${escapeHtml(mediaUrl(cover))}" alt="">`
                : '<div class="detail-hero-icon"><i class="fas fa-mountain"></i></div>'}
            <div class="detail-hero-text">
                <h2 id="modal-title">${escapeHtml(ferrata.nombre)}</h2>
                ${ferrata.ubicacion ? `<p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ferrata.ubicacion)}</p>` : ''}
            </div>
        </div>

        <div class="detail-body">
            <div class="detail-tags">
                <span class="tag level-tag level-${escapeHtml(ferrata.nivel)}">${escapeHtml(getNivelText(ferrata.nivel))}</span>
                ${ferrata.duracion ? `<span class="tag"><i class="far fa-clock"></i> ${escapeHtml(formatDuration(ferrata.duracion))}</span>` : ''}
                ${done ? '<span class="tag tag-done"><i class="fas fa-check"></i> Hecha</span>' : '<span class="tag tag-pending">Pendiente</span>'}
                ${rating > 0 ? `<span class="tag">${renderStars(rating)}</span>` : ''}
            </div>

            <div class="detail-quick-actions">
                ${hasCoords ? `
                    <a class="quick-action" href="${directions}" target="_blank" rel="noopener">
                        <i class="fas fa-route"></i> Cómo llegar
                    </a>
                    <button type="button" class="quick-action" data-action="focus-map" data-id="${safeId}">
                        <i class="fas fa-map"></i> Ver en mapa
                    </button>` : ''}
                <button type="button" class="quick-action" data-action="add-ascension" data-id="${safeId}">
                    <i class="fas fa-flag-checkered"></i> ¡La he hecho!
                </button>
            </div>

            ${textSection('fa-align-left', 'Descripción', ferrata.descripcion)}
            ${textSection('fa-tools', 'Equipamiento', ferrata.equipamiento)}
            ${textSection('fa-exclamation-triangle', 'Observaciones', ferrata.observaciones, 'warning-text')}

            ${renderAscensionesSection(ferrata)}

            ${media.length > 0 ? `
                <div class="detail-section">
                    <h3><span><i class="fas fa-images"></i> Galería (${media.length})</span></h3>
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

            <div class="detail-footer">
                <button type="button" class="btn btn-light" data-action="edit" data-id="${safeId}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button type="button" class="btn btn-danger" data-action="delete" data-id="${safeId}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;

    const wasOpen = modal.classList.contains('active');
    modal.classList.add('active');
    if (!wasOpen) modal.scrollTop = 0;
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
