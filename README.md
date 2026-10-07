# Vías Ferratas App 🏔️

Aplicación web móvil (PWA) para gestionar tus vías ferratas favoritas.

## 🚀 Acceso directo

**Abre desde tu móvil:** [https://suwert8.github.io/pmm-vias-ferratas/](https://suwert8.github.io/pmm-vias-ferratas/)

## 📱 Instalación

1. Abre el enlace en tu móvil
2. **iOS (Safari):** Compartir → "Añadir a pantalla de inicio"
3. **Android (Chrome):** Menú ⋮ → "Añadir a pantalla de inicio"

## ✨ Características

- 📍 Guarda la ubicación GPS de cada vía ferrata (tu posición o elegida en el mapa)
- 📸 Añade fotos (se reducen automáticamente) y vídeos
- 🗺️ Mapa interactivo con todas tus rutas y enlace "Cómo llegar"
- ✅ Registro de ascensiones: fecha, valoración con estrellas, compañeros y notas de cada salida
- 📊 Resumen de ferratas hechas y pendientes; los marcadores del mapa se colorean según el estado
- 🔍 Búsqueda por nombre/ubicación y filtros por nivel (K1-K6) y por estado
- ☁️ Sincronización entre dispositivos a través de este repositorio de GitHub
- 📶 Consulta sin conexión de la última copia descargada

## ☁️ Cómo se guardan los datos

- `data/ferratas.json`: lista de ferratas (solo texto y rutas de archivos).
- `media/`: fotos y vídeos, un archivo por elemento.

Cada cambio se guarda como **un único commit** construido sobre la última versión del repositorio,
así que usar la app desde varios dispositivos no pisa los datos de los demás.

Para **ver** las ferratas no hace falta nada. Para **guardar, editar o eliminar** pulsa el indicador
"GitHub" de la cabecera y pega un token *fine-grained* con acceso solo a este repositorio y permiso
**Contents: Read and write**. El token se guarda únicamente en tu dispositivo.

## 🎯 Niveles de dificultad

| Nivel | Dificultad |
|-------|------------|
| K1 | Fácil |
| K2 | Poco difícil |
| K3 | Algo difícil |
| K4 | Difícil |
| K5 | Muy difícil |
| K6 | Extremadamente difícil |

## 💻 Tecnologías

- HTML5 + CSS3 + JavaScript (sin dependencias de compilación)
- Leaflet.js + OpenStreetMap
- GitHub REST API (Git Data API)
- PWA con service worker

---

**¡Disfruta de tus aventuras! 🧗‍♂️**
