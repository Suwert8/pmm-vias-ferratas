// Mapa (Leaflet)

let map = null;
let markersLayer = null;
let selectionMarker = null;
let markersFitted = false;

const selectionIcon = () => L.divIcon({
    className: 'selection-marker',
    html: '<i class="fas fa-map-pin"></i>',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

function initMap() {
    if (typeof L === 'undefined') {
        showError('No se pudo cargar la librería de mapas. Comprueba tu conexión.');
        return;
    }

    map = L.map('map').setView([40.4168, -3.7038], 6); // España

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    map.on('click', (e) => {
        if (!state.selectingOnMap) return;
        setSelectedCoords(e.latlng.lat, e.latlng.lng);
        finishMapSelection();
        showView('add');
    });
}

// ===== MARCADORES DE FERRATAS =====
function renderMarkers(list) {
    if (!map || !markersLayer) return;
    markersLayer.clearLayers();

    const withCoords = list.filter(f => Number.isFinite(f.lat) && Number.isFinite(f.lng));
    withCoords.forEach(ferrata => {
        const popup = document.createElement('div');
        popup.className = 'map-popup';
        popup.innerHTML = `
            <strong>${escapeHtml(ferrata.nombre)}</strong><br>
            <span>${escapeHtml(getNivelText(ferrata.nivel))}</span><br>
            <button type="button" class="btn btn-small btn-primary">Ver detalles</button>
        `;
        popup.querySelector('button').addEventListener('click', () => showFerrataDetail(ferrata.id));

        L.marker([ferrata.lat, ferrata.lng]).bindPopup(popup).addTo(markersLayer);
    });

    // Encuadrar todas las ferratas la primera vez que se cargan
    if (!markersFitted && withCoords.length > 0) {
        markersFitted = true;
        const bounds = L.latLngBounds(withCoords.map(f => [f.lat, f.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
}

function focusFerrataOnMap(id) {
    const ferrata = state.ferratas.find(f => f.id === id);
    if (!ferrata || !map) return;
    closeDetailModal();
    showView('map');
    setTimeout(() => map.setView([ferrata.lat, ferrata.lng], 14), 150);
}

// ===== SELECCIÓN DE UBICACIÓN =====
function setSelectedCoords(lat, lng) {
    state.selectedCoords = { lat, lng };

    if (map) {
        if (selectionMarker) {
            selectionMarker.setLatLng([lat, lng]);
        } else {
            selectionMarker = L.marker([lat, lng], { icon: selectionIcon(), zIndexOffset: 1000 }).addTo(map);
        }
    }

    const coordsDisplay = document.getElementById('coords-display');
    if (coordsDisplay) {
        coordsDisplay.style.display = 'block';
        coordsDisplay.textContent = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    updateLocationStatus('Ubicación seleccionada', 'success');
}

function clearSelectedCoords() {
    state.selectedCoords = null;
    if (selectionMarker && map) {
        map.removeLayer(selectionMarker);
    }
    selectionMarker = null;

    const coordsDisplay = document.getElementById('coords-display');
    if (coordsDisplay) {
        coordsDisplay.style.display = 'none';
        coordsDisplay.textContent = '';
    }
    updateLocationStatus('Sin ubicación', 'error');
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        updateLocationStatus('GPS no disponible', 'error');
        showWarning('Tu dispositivo no permite obtener la ubicación. Selecciónala en el mapa.');
        return;
    }

    updateLocationStatus('Obteniendo ubicación...', 'loading');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setSelectedCoords(latitude, longitude);
            if (map) map.setView([latitude, longitude], 13);
        },
        (error) => {
            console.warn('Error al obtener ubicación:', error.message);
            updateLocationStatus('No se pudo obtener', 'error');
            showWarning('No se pudo obtener tu ubicación. Selecciónala en el mapa.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
}

function updateLocationStatus(message, type = 'loading') {
    const statusElement = document.getElementById('location-status');
    if (!statusElement) return;

    const icons = {
        loading: 'fas fa-spinner fa-spin',
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle'
    };

    statusElement.innerHTML = `<i class="${icons[type]}"></i> ${escapeHtml(message)}`;
    statusElement.className = `location-status ${type}`;
}

function enableMapSelection() {
    state.selectingOnMap = true;
    document.getElementById('map-selection-banner')?.classList.add('active');
    showView('map');
    const coords = state.selectedCoords;
    if (coords && map) {
        setTimeout(() => map.setView([coords.lat, coords.lng], 13), 150);
    }
}

function finishMapSelection() {
    state.selectingOnMap = false;
    document.getElementById('map-selection-banner')?.classList.remove('active');
}
