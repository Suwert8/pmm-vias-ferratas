# 🔍 Cómo Ver y Exportar tus Datos

## Ver los datos guardados

### Opción 1: Consola del Navegador

1. Abre tu app: https://suwert8.github.io/pmm-vias-ferratas/
2. Presiona **F12** (o click derecho → Inspeccionar)
3. Ve a la pestaña **"Console"**
4. Escribe:

```javascript
// Ver todos los datos
JSON.parse(localStorage.getItem('ferratas'))

// Ver cuántas vías ferratas tienes
JSON.parse(localStorage.getItem('ferratas')).length

// Ver cuánto espacio ocupan (en caracteres)
localStorage.getItem('ferratas').length
```

### Opción 2: Pestaña Application

1. Abre DevTools (F12)
2. Ve a **"Application"** (Chrome/Edge) o **"Storage"** (Firefox)
3. En el menú izquierdo: **Local Storage** → **https://suwert8.github.io**
4. Verás la clave `ferratas` con todos tus datos

---

## 💾 Exportar tus datos (Backup)

### Exportar a archivo JSON

En la consola del navegador:

```javascript
// 1. Obtener los datos
const data = localStorage.getItem('ferratas');

// 2. Crear un archivo descargable
const blob = new Blob([data], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'mis-vias-ferratas-backup.json';
a.click();
```

Esto descargará un archivo JSON con todas tus vías ferratas.

---

## 📥 Importar/Restaurar datos

### Desde un backup JSON

```javascript
// 1. Copia el contenido del archivo JSON
const dataBackup = '...pega aquí el contenido...';

// 2. Restaurar
localStorage.setItem('ferratas', dataBackup);

// 3. Recargar la página
location.reload();
```

---

## 🗑️ Borrar todos los datos

⚠️ **CUIDADO**: Esto borrará todas tus vías ferratas permanentemente.

```javascript
// Borrar todo
localStorage.removeItem('ferratas');
location.reload();
```

---

## 📊 Estadísticas de almacenamiento

```javascript
// Ver cuánto espacio usas
const data = localStorage.getItem('ferratas');
const sizeInBytes = new Blob([data]).size;
const sizeInKB = (sizeInBytes / 1024).toFixed(2);
const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);

console.log(`Espacio usado: ${sizeInKB} KB (${sizeInMB} MB)`);
console.log(`Vías ferratas guardadas: ${JSON.parse(data).length}`);
```

---

## 🔐 Privacidad

✅ **Tus datos están 100% seguros**:
- Se guardan solo en tu dispositivo
- Nunca se envían a ningún servidor
- Solo tú tienes acceso
- No hay tracking ni analytics

---

## 💡 Consejos

1. **Haz backups periódicos** especialmente si tienes muchas fotos
2. **No borres los datos del navegador** o perderás todo
3. **Reduce el tamaño de fotos** antes de subirlas para ahorrar espacio
4. **Usa el mismo navegador** siempre para acceder a tus datos
5. **No uses modo incógnito** - los datos se borran al cerrar

---

## 📱 Transferir datos entre dispositivos

### Método 1: Exportar/Importar JSON
1. En dispositivo 1: Exporta el JSON (instrucciones arriba)
2. Transfiere el archivo (email, WhatsApp, Drive, etc.)
3. En dispositivo 2: Importa el JSON

### Método 2: Copiar/Pegar
1. En dispositivo 1 (consola):
```javascript
console.log(localStorage.getItem('ferratas'))
```
2. Copia todo el texto que aparece
3. En dispositivo 2 (consola):
```javascript
localStorage.setItem('ferratas', 'pega aquí el texto')
location.reload()
```

---

## ❓ Problemas comunes

**"Los datos desaparecieron"**
- ¿Borraste el historial/caché del navegador?
- ¿Estás usando el mismo navegador?
- ¿No estás en modo incógnito?

**"No puedo subir más fotos"**
- Has alcanzado el límite de ~5-10MB
- Solución: Borra vías ferratas antiguas o reduce tamaño de fotos

**"Quiero mover mis datos a otro móvil"**
- Usa el método de exportar/importar JSON explicado arriba
