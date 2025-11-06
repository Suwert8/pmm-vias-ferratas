// Funciones de GitHub

// ===== FUNCIONES GITHUB =====
async function configureGitHubToken() {
    const currentToken = githubToken || '';
    const tokenInput = prompt(
        `Introduce tu token de GitHub:\n\n` +
        `🔗 Cómo obtener el token:\n` +
        `1. Ve a github.com → Settings → Developer settings\n` +
        `2. Personal access tokens → Tokens (classic)\n` +
        `3. Generate new token (classic)\n` +
        `4. Selecciona scope: 'repo' (Full control of private repositories)\n` +
        `5. Copia el token generado\n\n` +
        `${currentToken ? `Token actual: ${currentToken.substring(0, 8)}...` : 'No hay token configurado'}`,
        currentToken
    );
    
    if (tokenInput !== null) {
        if (tokenInput.trim() === '') {
            localStorage.removeItem('github-token');
            githubToken = '';
            showWarning('Token de GitHub eliminado', 'Configuración');
        } else {
            localStorage.setItem('github-token', tokenInput.trim());
            githubToken = tokenInput.trim();
            showSuccess('Token de GitHub configurado correctamente', 'Configuración');
        }
        updateGitHubStatus();
    }
}

function updateGitHubStatus() {
    const statusElement = document.getElementById('github-status');
    const statusText = document.getElementById('github-status-text');
    
    if (githubToken) {
        statusElement.className = 'github-status connected';
        statusText.textContent = 'GitHub: Conectado';
    } else {
        statusElement.className = 'github-status disconnected';
        statusText.textContent = 'GitHub: No conectado';
    }
    
    // Añadir tooltip
    statusElement.title = githubToken ? 
        'GitHub conectado. Click para reconfigurar token (Ctrl+Shift+T)' : 
        'GitHub no conectado. Click para configurar token (Ctrl+Shift+T)';
}

async function loadFromGitHub() {
    if (!githubToken) {
        console.log('⚠️ No hay token de GitHub configurado');
        return [];
    }

    try {
        
        const url = `https://api.github.com/repos/${githubRepo}/contents/${githubFilePath}?ref=${githubBranch}&t=${Date.now()}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('📄 Archivo no encontrado en GitHub, creando uno nuevo...');
                return [];
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Verificar que tenemos contenido
        if (!data.content) {
            console.log('📄 Archivo sin contenido en GitHub, retornando array vacío...');
            return [];
        }
        
        // Decodificar contenido desde Base64 con manejo de UTF-8
        let content;
        try {
            const binaryString = atob(data.content.replace(/\\s/g, ''));
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder('utf-8');
            content = decoder.decode(bytes);
        } catch (decodeError) {
            console.warn('⚠️ Error en decodificación UTF-8, usando fallback...', decodeError.message);
            content = atob(data.content.replace(/\\s/g, ''));
        }
        
        // Limpiar BOM y caracteres problemáticos
        const cleanContent = content.replace(/^\\uFEFF/, '').trim();
        
        if (!cleanContent) {
            console.log('📄 Archivo vacío en GitHub, retornando array vacío...');
            return [];
        }

        try {
            const ferratas = JSON.parse(cleanContent);
            
            // Validar que sea un array
            if (!Array.isArray(ferratas)) {
                throw new Error('El contenido no es un array válido');
            }
            
            // console.log(`✅ ${ferratas.length} ferratas cargadas desde GitHub`);
            return ferratas;
            
        } catch (parseError) {
            console.error('⚠️ Error al parsear JSON desde GitHub:', parseError.message);
            console.log('📄 Contenido problemático (primeros 200 caracteres):', cleanContent.substring(0, 200));
            
            // Si el contenido está vacío o es muy corto
            if (cleanContent.length === 0) {
                console.log('📄 Archivo completamente vacío, retornando array vacío');
                return [];
            }
            
            // Si el contenido es muy corto y no es JSON válido
            if (cleanContent.length < 10) {
                console.log('📄 Contenido muy corto y no válido, retornando array vacío');
                return [];
            }
            
            // Intentar reparar JSON común y problemas de encoding
            try {
                let repairedContent = cleanContent
                    .replace(/[\\x00-\\x1F\\x7F]/g, '') // Remover caracteres de control
                    .replace(/,\\s*([}\\]])/g, '$1')   // Remover comas finales
                    .replace(/Ã±/g, 'ñ')            // Reparar ñ mal codificada
                    .replace(/Ã¡/g, 'á')            // Reparar á mal codificada  
                    .replace(/Ã©/g, 'é')            // Reparar é mal codificada
                    .replace(/Ã­/g, 'í')            // Reparar í mal codificada
                    .replace(/Ã³/g, 'ó')            // Reparar ó mal codificada
                    .replace(/Ãº/g, 'ú')            // Reparar ú mal codificada
                    .trim();
                    
                console.log('🔧 Intentando reparar JSON...');
                const repairedFerratas = JSON.parse(repairedContent);
                console.log('✅ JSON reparado y cargado correctamente (problemas de encoding corregidos)');
                return repairedFerratas;
                
            } catch (repairError) {
                console.error('❌ No se pudo reparar el JSON:', repairError.message);
                console.log('🔧 Último recurso: retornando array vacío');
                return [];
            }
        }
        
    } catch (error) {
        console.error('❌ Error al cargar desde GitHub:', error.message);
        return [];
    }
}

async function saveToGitHub(newData = null, operation = 'sync', retryCount = 0) {
    if (!githubToken) {
        showError('⚠️ Configura tu token de GitHub primero (Ctrl+Shift+T)');
        return false;
    }

    // PROTECCIÓN ABSOLUTA: Solo permitir 1 retry máximo para evitar recursión
    if (retryCount > 1) {
        showError(`❌ Demasiados intentos (${retryCount}). Operación cancelada para evitar recursión.`);
        return false;
    }

    try {
        console.log(`📤 ${operation === 'add' ? 'Añadiendo' : operation === 'delete' ? 'Eliminando' : 'Guardando'} datos en GitHub...`);
        
        let updatedFerratas;

        if (operation === 'sync' && newData) {
            // Sincronización completa: usar datos proporcionados directamente
            updatedFerratas = newData;
        } else if (operation === 'add' && newData && newData.length > 0) {
            // Añadir: NUNCA recargar - usar solo datos en memoria
            console.log(`🔄 Usando datos en memoria: ${ferratas.length} ferratas existentes`);
            updatedFerratas = [...ferratas, ...newData];
        } else if (operation === 'delete' && newData) {
            // Eliminar: NUNCA recargar - usar solo datos en memoria
            console.log(`🔄 Eliminando de datos en memoria: ${ferratas.length} ferratas existentes`);
            updatedFerratas = ferratas.filter(f => f.id !== newData);
        } else {
            // Fallback seguro: usar datos en memoria
            console.log(`🔄 Fallback: usando datos en memoria (${ferratas.length} ferratas)`);
            updatedFerratas = [...ferratas];
        }

        const content = JSON.stringify(updatedFerratas, null, 2);
        
        // Codificación UTF-8 correcta para Base64
        const encoder = new TextEncoder();
        const utf8Bytes = encoder.encode(content);
        const base64String = btoa(String.fromCharCode(...utf8Bytes));

        // Obtener SHA del archivo actual (siempre fresco)
        const getUrl = `https://api.github.com/repos/${githubRepo}/contents/${githubFilePath}?ref=${githubBranch}&t=${Date.now()}`;
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        let sha = '';
        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        }

        // Crear o actualizar archivo con SHA fresco
        const putUrl = `https://api.github.com/repos/${githubRepo}/contents/${githubFilePath}`;
        const putResponse = await fetch(putUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                message: `${operation === 'add' ? 'Añadir' : operation === 'delete' ? 'Eliminar' : 'Actualizar'} ferratas - ${new Date().toLocaleString('es-ES')}`,
                content: base64String,
                branch: githubBranch,
                ...(sha && { sha })
            })
        });

        if (!putResponse.ok) {
            const errorData = await putResponse.json().catch(() => ({}));
            
            // RETRY ÚNICO para conflictos 409 - SIN RECURSIÓN
            if (putResponse.status === 409 && retryCount === 0) {
                console.log(`🔄 Conflicto 409 detectado, pero NO reintentamos para evitar recursión`);
                throw new Error(`Conflicto 409: El archivo fue modificado por otro proceso. Intenta de nuevo manualmente.`);
            }
            
            throw new Error(`HTTP ${putResponse.status}: ${JSON.stringify(errorData, null, 2)}`);
        }

        // console.log('✅ Datos guardados en GitHub correctamente');
        
        // Actualizar variable global y renderizar
        ferratas = updatedFerratas;
        if (typeof renderFerratas === 'function') {
            renderFerratas(updatedFerratas);
        }
        
        return updatedFerratas;
        
    } catch (error) {
        console.error('❌ Error al sincronizar con GitHub:', error.message);
        
        // CERO RETRY MANUAL - ELIMINAR COMPLETAMENTE LA RECURSIÓN
        showError(`❌ Error al guardar en GitHub${retryCount > 0 ? ` (retry ${retryCount})` : ''}:\\n${error.message}`);
        
        return false;
    }
}

async function reloadGitHub() {
    try {
        // console.log('🔄 Iniciando recarga desde GitHub...');
        
        // Cargar datos frescos desde GitHub y actualizar interfaz
        // console.log('📥 Cargando datos desde GitHub...');
        const loadedFerratas = await loadFromGitHub();
        if (loadedFerratas) {
            // Actualizar variable global y renderizar
            ferratas = loadedFerratas;
            if (typeof renderFerratas === 'function') {
                renderFerratas(ferratas);
            }
            showSuccess(`✅ Recarga completada: ${ferratas.length} ferratas cargadas desde GitHub`, 'Sincronización Exitosa');
        } else {
            showError('❌ No se pudieron cargar los datos desde GitHub');
        }
        
    } catch (error) {
        console.error('❌ Error en recarga desde GitHub:', error.message);
        showError(`❌ Error en recarga: ${error.message}`);
    }
}

// Módulo GitHub