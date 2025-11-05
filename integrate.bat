@echo off
chcp 65001 >nul
cd /d C:\Users\Usario\Desktop\ViaFerrata

echo Integrando Browser Fingerprinting en ferrata-app.html...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$content = [System.IO.File]::ReadAllText('ferrata-app.html', [System.Text.Encoding]::UTF8); $fingerprint = [System.IO.File]::ReadAllText('fingerprint-code.js', [System.Text.Encoding]::UTF8); $pattern = '(        function isMobileDevice\(\) \{[^\}]+\})'; $content = $content -replace $pattern, \"`$1`n`n$fingerprint\"; $content = $content -replace \"let currentFilter = 'todas';\", \"let currentFilter = 'todas';`n        let isDeviceAuthorized = false;\"; $content = $content -replace \"document.addEventListener\('DOMContentLoaded', function\(\)\", \"document.addEventListener('DOMContentLoaded', async function()\"; $newCode = @'`n            `n            // Verificar autorizacion`n            isDeviceAuthorized = await isAuthorizedDevice();`n            `n            if (!isDeviceAuthorized) {`n                const addTab = document.querySelector('[data-tab=\"add\"]');`n                if (addTab) addTab.style.display = 'none';`n                console.log('Dispositivo no autorizado');`n            } else {`n                console.log('Dispositivo autorizado');`n            }`n            `n            // Atajos`n            document.addEventListener('keydown', async (e) => {`n                if (e.ctrlKey && e.shiftKey && e.key === 'A') {`n                    await authorizeCurrentDevice();`n                    location.reload();`n                }`n                if (e.ctrlKey && e.shiftKey && e.key === 'F') {`n                    await showCurrentFingerprint();`n                }`n            });`n'@; $content = $content -replace '(setupEventListeners\(\);)', \"`$1$newCode\"; $content = $content -replace '\`$\{isMobileDevice\(\)', '\${isDeviceAuthorized'; [System.IO.File]::WriteAllText('ferrata-app.html', $content, [System.Text.Encoding]::UTF8); Write-Host 'Fingerprinting integrado correctamente' -ForegroundColor Green"

echo.
echo ========================================
echo.
echo Para autorizar tu movil:
echo 1. Abre la app en tu movil
echo 2. Presiona Ctrl+Shift+A
echo 3. Recarga la pagina
echo.
echo Para ver fingerprint: Ctrl+Shift+F
echo.
pause
