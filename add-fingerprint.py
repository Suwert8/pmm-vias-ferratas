# -*- coding: utf-8 -*-
import re

# Leer el archivo con UTF-8
with open('ferrata-app.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Código de fingerprinting a insertar
fingerprint_code = '''
        // ===== BROWSER FINGERPRINTING =====
        async function generateDeviceFingerprint() {
            const components = [];
            components.push(navigator.userAgent);
            components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
            components.push(new Date().getTimezoneOffset());
            components.push(navigator.language);
            components.push(navigator.platform);
            components.push(navigator.hardwareConcurrency || 'unknown');
            components.push(navigator.maxTouchPoints || 0);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('ViaFerrata', 2, 15);
            components.push(canvas.toDataURL());
            
            const fingerprint = await hashString(components.join('|||'));
            return fingerprint;
        }

        async function hashString(str) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async function isAuthorizedDevice() {
            const currentFingerprint = await generateDeviceFingerprint();
            const authorized = getAuthorizedFingerprints();
            console.log('Fingerprint:', currentFingerprint);
            return authorized.includes(currentFingerprint);
        }

        function getAuthorizedFingerprints() {
            const stored = localStorage.getItem('authorizedDevices');
            return stored ? JSON.parse(stored) : [];
        }

        async function authorizeCurrentDevice() {
            const fingerprint = await generateDeviceFingerprint();
            const authorized = getAuthorizedFingerprints();
            if (!authorized.includes(fingerprint)) {
                authorized.push(fingerprint);
                localStorage.setItem('authorizedDevices', JSON.stringify(authorized));
                alert('Dispositivo autorizado!\\n' + fingerprint.substring(0, 20) + '...');
                return true;
            }
            alert('Ya autorizado');
            return false;
        }

        async function showFingerprint() {
            const fp = await generateDeviceFingerprint();
            const auth = getAuthorizedFingerprints();
            alert(`Fingerprint: ${fp.substring(0, 30)}...\\nAutorizado: ${auth.includes(fp) ? 'SI' : 'NO'}`);
        }
'''

# Insertar después de isMobileDevice
pattern = r'(        function isMobileDevice\(\) \{[^}]+\})'
content = re.sub(pattern, r'\1' + fingerprint_code, content)

# Agregar variable global
content = content.replace(
    "        let currentFilter = 'todas';",
    "        let currentFilter = 'todas';\n        let isDeviceAuthorized = false;"
)

# Actualizar DOMContentLoaded
old_dom = r"document\.addEventListener\('DOMContentLoaded', function\(\) \{[^}]+setupEventListeners\(\);[^}]+\}\);"
new_dom = """document.addEventListener('DOMContentLoaded', async function() {
            initMap();
            loadFerratas();
            setupEventListeners();
            
            isDeviceAuthorized = await isAuthorizedDevice();
            
            if (!isDeviceAuthorized) {
                const addTab = document.querySelector('[data-tab="add"]');
                if (addTab) addTab.style.display = 'none';
                console.log('Dispositivo no autorizado');
            } else {
                console.log('Dispositivo autorizado');
            }
            
            // Ctrl+Shift+A = autorizar
            document.addEventListener('keydown', async (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                    await authorizeCurrentDevice();
                    location.reload();
                }
                if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                    await showFingerprint();
                }
            });
        });"""

content = re.sub(old_dom, new_dom, content, flags=re.DOTALL)

# Cambiar isMobileDevice() por isDeviceAuthorized
content = re.sub(
    r'\$\{isMobileDevice\(\)',
    '${isDeviceAuthorized',
    content
)

# Guardar con UTF-8
with open('ferrata-app.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fingerprinting integrado correctamente")
print("")
print("Para autorizar tu móvil:")
print("1. Abre la app en tu móvil")  
print("2. Presiona Ctrl+Shift+A")
print("3. Recarga la página")
print("")
print("Para ver fingerprint: Ctrl+Shift+F")
