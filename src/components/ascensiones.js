// Registro de ascensiones (salidas realizadas a cada ferrata)

const ascensionForm = {
    ferrataId: null,
    ascensionId: null,
    valoracion: 0
};

// ===== HTML DE LA SECCIÓN EN LA FICHA =====
function renderAscensionesSection(ferrata) {
    const list = sortAscensiones(ferrata.ascensiones || []);
    const id = escapeHtml(ferrata.id);

    const items = list.map(asc => `
        <div class="ascension-item">
            <div class="ascension-date">
                <span class="day">${escapeHtml(formatDate(asc.fecha, { day: 'numeric' }))}</span>
                <span class="month">${escapeHtml(formatDate(asc.fecha, { month: 'short' }).replace('.', ''))}</span>
                <span class="year">${escapeHtml(formatDate(asc.fecha, { year: 'numeric' }))}</span>
            </div>
            <div class="ascension-info">
                ${asc.valoracion > 0 ? renderStars(asc.valoracion) : ''}
                ${asc.companeros ? `<div class="companions"><i class="fas fa-user-friends"></i> ${escapeHtml(asc.companeros)}</div>` : ''}
                ${asc.notas ? `<div class="notes">${escapeHtml(asc.notas)}</div>` : ''}
                ${!asc.valoracion && !asc.companeros && !asc.notas ? '<div class="companions">Sin notas</div>' : ''}
            </div>
            <div class="ascension-actions">
                <button type="button" class="icon-btn" data-action="edit-ascension" data-id="${id}" data-asc="${escapeHtml(asc.id)}" aria-label="Editar ascensión">
                    <i class="fas fa-pen"></i>
                </button>
                <button type="button" class="icon-btn" data-action="delete-ascension" data-id="${id}" data-asc="${escapeHtml(asc.id)}" aria-label="Eliminar ascensión">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    return `
        <div class="detail-section">
            <h3>
                <span><i class="fas fa-flag-checkered"></i> Mis ascensiones (${list.length})</span>
                <button type="button" class="btn btn-primary btn-small" data-action="add-ascension" data-id="${id}">
                    <i class="fas fa-plus"></i> Registrar
                </button>
            </h3>
            ${list.length > 0
                ? `<div class="ascension-list">${items}</div>`
                : '<div class="ascension-empty"><i class="far fa-clock"></i> Pendiente: aún no la has hecho. ¡Registra tu primera ascensión cuando la completes!</div>'}
        </div>
    `;
}

// ===== FORMULARIO =====
function openAscensionForm(ferrataId, ascensionId = null) {
    const ferrata = state.ferratas.find(f => f.id === ferrataId);
    if (!ferrata) return;
    const existing = ascensionId ? (ferrata.ascensiones || []).find(a => a.id === ascensionId) : null;

    ascensionForm.ferrataId = ferrataId;
    ascensionForm.ascensionId = existing ? existing.id : null;

    document.getElementById('ascension-title').textContent = existing ? 'Editar ascensión' : 'Registrar ascensión';
    document.getElementById('ascension-ferrata').textContent = ferrata.nombre;
    document.getElementById('asc-fecha').value = existing?.fecha || todayIso();
    document.getElementById('asc-fecha').max = todayIso();
    document.getElementById('asc-companeros').value = existing?.companeros || '';
    document.getElementById('asc-notas').value = existing?.notas || '';
    setAscensionRating(existing?.valoracion || 0);

    document.getElementById('ascension-modal').classList.add('active');
}

function closeAscensionForm() {
    document.getElementById('ascension-modal')?.classList.remove('active');
}

function setAscensionRating(value) {
    // Pulsar la misma estrella otra vez quita la valoración
    ascensionForm.valoracion = value;
    document.querySelectorAll('#asc-stars button').forEach(button => {
        const on = Number(button.dataset.value) <= value;
        button.classList.toggle('on', on);
        button.setAttribute('aria-checked', String(Number(button.dataset.value) === value));
    });
}

async function handleAscensionSubmit(event) {
    event.preventDefault();
    if (state.submitting) return;

    const fechaInput = document.getElementById('asc-fecha');
    const fecha = fechaInput.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        fechaInput.classList.add('invalid');
        showWarning('Indica la fecha de la ascensión.');
        return;
    }
    fechaInput.classList.remove('invalid');

    const ferrataId = ascensionForm.ferrataId;
    const ferrata = state.ferratas.find(f => f.id === ferrataId);
    const ascension = {
        id: ascensionForm.ascensionId || generateId(),
        fecha,
        valoracion: ascensionForm.valoracion,
        companeros: document.getElementById('asc-companeros').value.trim(),
        notas: document.getElementById('asc-notas').value.trim()
    };
    const isEdit = Boolean(ascensionForm.ascensionId);

    const button = document.getElementById('save-ascension-btn');
    button.disabled = true;
    state.submitting = true;
    try {
        const updated = await commitChanges(remote => {
            const target = remote.find(f => f.id === ferrataId);
            if (!target) throw new Error('Esta vía ferrata se eliminó desde otro dispositivo.');
            const others = (target.ascensiones || []).filter(a => a.id !== ascension.id);
            return {
                ferratas: remote.map(f => (f.id === ferrataId
                    ? { ...f, ascensiones: sortAscensiones([...others, ascension]) }
                    : f))
            };
        }, `${isEdit ? 'Editar' : 'Registrar'} ascensión a "${ferrata ? ferrata.nombre : ferrataId}" (${fecha})`);

        setFerratas(updated);
        closeAscensionForm();
        showFerrataDetail(ferrataId);
        showSuccess(isEdit ? 'Ascensión actualizada.' : '¡Ascensión registrada! 🧗');
    } catch (error) {
        console.error('Error al guardar ascensión:', error);
        showError(`No se pudo guardar la ascensión.\n${error.message}`);
    } finally {
        button.disabled = false;
        state.submitting = false;
    }
}

async function deleteAscension(ferrataId, ascensionId) {
    const confirmed = await showConfirmation('¿Eliminar esta ascensión del registro?', 'Eliminar ascensión', 'Eliminar', 'Cancelar');
    if (!confirmed) return;

    try {
        const updated = await commitChanges(remote => ({
            ferratas: remote.map(f => (f.id === ferrataId
                ? { ...f, ascensiones: (f.ascensiones || []).filter(a => a.id !== ascensionId) }
                : f))
        }), 'Eliminar ascensión');

        setFerratas(updated);
        showFerrataDetail(ferrataId);
        showSuccess('Ascensión eliminada.');
    } catch (error) {
        console.error('Error al eliminar ascensión:', error);
        showError(`No se pudo eliminar la ascensión.\n${error.message}`);
    }
}

function setupAscensionListeners() {
    document.getElementById('ascension-form')?.addEventListener('submit', handleAscensionSubmit);
    document.getElementById('close-ascension')?.addEventListener('click', closeAscensionForm);
    document.getElementById('cancel-ascension')?.addEventListener('click', closeAscensionForm);
    document.getElementById('ascension-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'ascension-modal') closeAscensionForm();
    });
    document.querySelectorAll('#asc-stars button').forEach(button => {
        button.addEventListener('click', () => {
            const value = Number(button.dataset.value);
            setAscensionRating(value === ascensionForm.valoracion ? 0 : value);
        });
    });
}
