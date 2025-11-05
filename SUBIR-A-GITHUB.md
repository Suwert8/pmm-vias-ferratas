# 🚀 PASOS PARA SUBIR A GITHUB

## Paso 1: Crear Repositorio en GitHub

1. Ve a: **https://github.com/new**
2. Rellena:
   - **Repository name:** `pmm-vias-ferratas`
   - **Description:** "Aplicación móvil para gestionar vías ferratas"
   - **Public** ✅ (importante para GitHub Pages)
   - **NO marques** "Add a README file"
   - **NO añadas** .gitignore ni license
3. Click en **"Create repository"**

## Paso 2: Conectar y Subir

Copia y pega estos comandos en PowerShell (ya estás en la carpeta correcta):

```powershell
# Conectar con GitHub
git remote add origin https://github.com/Suwert8/pmm-vias-ferratas.git

# Subir los archivos
git push -u origin main
```

Cuando te pida usuario y contraseña:
- **Usuario:** Suwert8 (o tu usuario de GitHub)
- **Contraseña:** Usa un **Personal Access Token** (no tu contraseña normal)

### 🔑 Si no tienes un Token:
1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token" → "Classic"
3. Dale un nombre: "ViaFerrata"
4. Marca: **repo** (todos los checkboxes de repo)
5. Click "Generate token"
6. **COPIA el token** (no lo volverás a ver)
7. Úsalo como contraseña en el git push

## Paso 3: Activar GitHub Pages

1. Ve a tu repositorio: **https://github.com/Suwert8/pmm-vias-ferratas**
2. Click en **Settings** (arriba a la derecha)
3. En el menú izquierdo, click en **Pages**
4. En "Source" selecciona: **main** branch
5. Click en **Save**
6. ¡Espera 1-2 minutos!

## Paso 4: ¡Acceder desde tu Móvil! 📱

Tu app estará disponible en:
**https://suwert8.github.io/pmm-vias-ferratas/**

O si tu usuario es diferente:
**https://TU-USUARIO.github.io/pmm-vias-ferratas/**

---

## 📱 INSTALAR EN EL MÓVIL

1. Abre la URL en tu móvil
2. **iOS:** Safari → Compartir → "Añadir a pantalla de inicio"
3. **Android:** Chrome → Menú → "Añadir a pantalla de inicio"

---

## 🔄 ACTUALIZAR LA APP EN EL FUTURO

Si haces cambios en el código:

```powershell
cd C:\Users\Usario\Desktop\ViaFerrata
git add .
git commit -m "Descripción del cambio"
git push
```

¡Los cambios aparecerán en la URL en 1-2 minutos!

---

## ❓ PROBLEMAS COMUNES

**Error al hacer push:**
→ Asegúrate de usar un Personal Access Token como contraseña

**La página no se ve:**
→ Espera 2-3 minutos después de activar GitHub Pages
→ Verifica que el repositorio sea "Public"

**404 Not Found:**
→ Asegúrate que GitHub Pages esté activado
→ La URL debe ser: `https://usuario.github.io/pmm-vias-ferratas/`

---

## ✅ RESUMEN RÁPIDO

```powershell
# 1. Crear repo en github.com/new con nombre: pmm-vias-ferratas
# 2. Ejecutar estos comandos:
git remote add origin https://github.com/Suwert8/pmm-vias-ferratas.git
git push -u origin main

# 3. Activar GitHub Pages en Settings → Pages
# 4. Abrir en móvil: https://suwert8.github.io/pmm-vias-ferratas/
```

¡Listo! 🎉
