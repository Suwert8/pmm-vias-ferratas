// Funciones del mapa

// ===== FUNCIONES DEL MAPA =====
async function initMap() {
    try {
        
        map = L.map('map').setView([40.4168, -3.7038], 6); // España
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Evento click para seleccionar ubicación
        map.on('click', function(e) {
            if (selectingOnMap) {
                setSelectedCoords(e.latlng.lat, e.latlng.lng);
                selectingOnMap = false;
                const btn = document.getElementById('select-on-map');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Cambiar en Mapa';
                    btn.classList.remove('btn-accent');
                    btn.classList.add('btn-secondary');
                }
            }
        });
        
        // Obtener ubicación actual al inicializar
        if (navigator.geolocation) {
            // console.log('📍 Obteniendo ubicación actual...');
            updateLocationStatus('Obteniendo ubicación...', 'loading');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    map.setView([latitude, longitude], 10);
                    setSelectedCoords(latitude, longitude);
                    updateLocationStatus('Ubicación obtenida', 'success');
                    // console.log('✅ Ubicación obtenida:', latitude, longitude);
                },
                (error) => {
                    console.warn('⚠️ Error al obtener ubicación:', error.message);
                    updateLocationStatus('Error al obtener ubicación', 'error');
                    // Ubicación por defecto (Madrid)
                    setSelectedCoords(40.4168, -3.7038);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        } else {
            // console.log('📍 Geolocalización no disponible, usando ubicación por defecto');
            setSelectedCoords(40.4168, -3.7038);
            updateLocationStatus('Usar ubicación por defecto', 'error');
        }
        
        // Cargar marcadores existentes
        loadMarkersOnMap();
        
        // console.log('✅ Mapa inicializado correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar mapa:', error.message);
        if (typeof showError === 'function') {
            showError(`Error al cargar el mapa: ${error.message}`);
        }
    }
}

function setSelectedCoords(lat, lng) {
    selectedCoords = { lat, lng };
    
    // Remover marcador anterior
    if (marker) {
        map.removeLayer(marker);
    }
    
    // Añadir nuevo marcador
    marker = L.marker([lat, lng]).addTo(map);
    
    // Actualizar display de coordenadas
    const coordsDisplay = document.getElementById('coords-display');
    if (coordsDisplay) {
        coordsDisplay.style.display = 'block';
        coordsDisplay.innerHTML = `
            <strong>📍 Ubicación seleccionada:</strong><br>
            Latitud: ${lat.toFixed(6)}<br>
            Longitud: ${lng.toFixed(6)}
        `;
    }
    
    // console.log('📍 Coordenadas seleccionadas:', lat, lng);
}

function updateLocationStatus(message, type = 'loading') {
    const statusElement = document.getElementById('location-status');
    if (!statusElement) return;
    
    const icons = {
        loading: '<i class="fas fa-spinner fa-spin"></i>',
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>'
    };
    
    statusElement.innerHTML = `${icons[type]} ${message}`;
    statusElement.className = `location-status ${type}`;
}

async function loadMarkersOnMap() {
    try {
        // USAR DATOS EN MEMORIA PARA EVITAR RECURSIÓN
        ferratas.forEach(ferrata => {
            const ferrataMarker = L.marker([ferrata.lat, ferrata.lng])
                .addTo(map)
                .bindPopup(`<b>${ferrata.nombre}</b><br>Nivel: ${getNivelText(ferrata.nivel)}`);
            
            ferrataMarker.on('click', function() {
                if (typeof showFerrataDetail === 'function') {
                    showFerrataDetail(ferrata.id);
                }
            });
        });
    } catch (error) {
        console.error('❌ Error al cargar marcadores:', error.message);
    }
}

function enableMapSelection() {
    selectingOnMap = true;
    const btn = document.getElementById('select-on-map');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-crosshairs"></i> Selecciona en el Mapa';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-accent');
    }
    
    if (typeof showInfo === 'function') {
        showInfo('Haz click en el mapa para seleccionar la ubicación', 'Selección de Ubicación');
    }
    
    // Cambiar a vista de mapa
    const mapView = document.querySelector('[data-view="map"]');
    if (mapView) {
        mapView.click();
    }
}

// Módulo de mapas