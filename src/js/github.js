// Sincronización con GitHub
//
// Los datos viven en data/ferratas.json y las fotos/vídeos en media/.
// Cada guardado es un único commit atómico (Git Data API) construido sobre la
// versión remota más reciente, así nunca se pisan datos de otro dispositivo.

const GITHUB_API = 'https://api.github.com';
const LOCAL_CACHE_KEY = 'ferratas-cache';

function repoApi(path) {
    return `${GITHUB_API}/repos/${GITHUB.owner}/${GITHUB.repo}${path}`;
}

async function githubFetch(url, { method = 'GET', body, accept, auth = true } = {}) {
    const headers = { 'Accept': accept || 'application/vnd.github+json' };
    if (auth && githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`;
    }
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, {
        method,
        headers,
        cache: 'no-store',
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
        const error = new Error(await describeGitHubError(response));
        error.status = response.status;
        throw error;
    }
    return response;
}

async function describeGitHubError(response) {
    let detail = '';
    try {
        const data = await response.json();
        detail = data.message || '';
    } catch (e) { /* sin cuerpo JSON */ }

    switch (response.status) {
        case 401: return 'El token de GitHub no es válido o ha caducado.';
        case 403: return detail.includes('rate limit')
            ? 'Límite de peticiones a GitHub alcanzado. Configura un token o espera unos minutos.'
            : 'El token no tiene permiso de escritura en el repositorio.';
        case 404: return 'Recurso no encontrado en GitHub.';
        default: return `GitHub respondió ${response.status}${detail ? ': ' + detail : ''}`;
    }
}

// ===== LECTURA =====
async function fetchFerratasAt(ref) {
    const url = repoApi(`/contents/${GITHUB.dataPath}?ref=${encodeURIComponent(ref)}`);
    try {
        // El tipo "raw" funciona con archivos de hasta 100 MB (el JSON normal solo hasta 1 MB)
        const response = await githubFetch(url, { accept: 'application/vnd.github.raw+json' });
        const text = (await response.text()).replace(/^﻿/, '').trim();
        if (!text) return [];
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
            throw new Error('El archivo de datos no contiene una lista válida');
        }
        return data.map(normalizeFerrata);
    } catch (error) {
        if (error.status === 404) return [];
        throw error;
    }
}

async function loadFromGitHub() {
    const ferratas = await fetchFerratasAt(GITHUB.branch);
    saveLocalCache(ferratas);
    return ferratas;
}

function saveLocalCache(ferratas) {
    safeStorageSet(LOCAL_CACHE_KEY, JSON.stringify(ferratas));
}

function loadLocalCache() {
    try {
        const raw = safeStorageGet(LOCAL_CACHE_KEY);
        return raw ? JSON.parse(raw).map(normalizeFerrata) : null;
    } catch (e) {
        return null;
    }
}

// ===== ESCRITURA =====

// Aplica `mutate(ferratasRemotas)` y lo guarda como un único commit.
// `mutate` devuelve { ferratas, deletePaths } y puede ejecutarse varias veces
// si otro dispositivo guardó a la vez (se reintenta sobre los datos nuevos).
async function commitChanges(mutate, message, onProgress = () => {}) {
    if (!githubToken) {
        throw new Error('Configura tu token de GitHub para poder guardar (pulsa el indicador de GitHub arriba).');
    }

    const blobCache = new Map(); // data URL -> sha del blob ya subido
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        onProgress('Leyendo datos actuales...');
        const refResponse = await githubFetch(repoApi(`/git/ref/heads/${GITHUB.branch}`));
        const headSha = (await refResponse.json()).object.sha;
        const commitResponse = await githubFetch(repoApi(`/git/commits/${headSha}`));
        const baseTreeSha = (await commitResponse.json()).tree.sha;

        const remote = await fetchFerratasAt(headSha);
        const result = mutate(remote);
        const deletePaths = result.deletePaths || [];
        // Copia profunda: los reintentos deben partir siempre de las data URL originales
        const next = result.ferratas.map(f => ({ ...f, media: (f.media || []).map(m => ({ ...m })) }));

        // Subir como archivos los multimedia nuevos (y los antiguos incrustados en base64)
        const treeEntries = [];
        const pending = [];
        next.forEach(ferrata => {
            (ferrata.media || []).forEach((item, index) => {
                if (item.path.startsWith('data:')) pending.push({ ferrata, item, index });
            });
        });

        for (let i = 0; i < pending.length; i++) {
            const { ferrata, item } = pending[i];
            onProgress(`Subiendo archivos (${i + 1}/${pending.length})...`);
            const dataUrl = item.path;
            let sha = blobCache.get(dataUrl);
            if (!sha) {
                const blobResponse = await githubFetch(repoApi('/git/blobs'), {
                    method: 'POST',
                    body: { content: dataUrl.slice(dataUrl.indexOf(',') + 1), encoding: 'base64' }
                });
                sha = (await blobResponse.json()).sha;
                blobCache.set(dataUrl, sha);
            }
            const path = `${GITHUB.mediaDir}/${ferrata.id}-${sha.slice(0, 10)}.${extensionFromDataUrl(dataUrl)}`;
            treeEntries.push({ path, mode: '100644', type: 'blob', sha });
            item.path = path;
        }

        // Borrar solo archivos que existan y ya no use ninguna ferrata
        const stillUsed = new Set(next.flatMap(f => (f.media || []).map(m => m.path)));
        const candidates = deletePaths.filter(p => p.startsWith(`${GITHUB.mediaDir}/`) && !stillUsed.has(p));
        if (candidates.length > 0) {
            const existing = await listMediaFiles(headSha);
            candidates.filter(p => existing.has(p)).forEach(path => {
                treeEntries.push({ path, mode: '100644', type: 'blob', sha: null });
            });
        }

        treeEntries.push({
            path: GITHUB.dataPath,
            mode: '100644',
            type: 'blob',
            content: JSON.stringify(next, null, 2) + '\n'
        });

        onProgress('Guardando en GitHub...');
        const treeResponse = await githubFetch(repoApi('/git/trees'), {
            method: 'POST',
            body: { base_tree: baseTreeSha, tree: treeEntries }
        });
        const treeSha = (await treeResponse.json()).sha;

        const newCommitResponse = await githubFetch(repoApi('/git/commits'), {
            method: 'POST',
            body: { message, tree: treeSha, parents: [headSha] }
        });
        const newCommitSha = (await newCommitResponse.json()).sha;

        try {
            await githubFetch(repoApi(`/git/refs/heads/${GITHUB.branch}`), {
                method: 'PATCH',
                body: { sha: newCommitSha, force: false }
            });
        } catch (error) {
            // 422 = alguien guardó entre medias; se reintenta sobre los datos nuevos
            if (error.status === 422 && attempt < MAX_ATTEMPTS) continue;
            throw error;
        }

        saveLocalCache(next);
        return next;
    }

    throw new Error('No se pudo guardar: los datos cambiaron varias veces mientras se guardaba. Inténtalo de nuevo.');
}

async function listMediaFiles(ref) {
    try {
        const response = await githubFetch(repoApi(`/contents/${GITHUB.mediaDir}?ref=${encodeURIComponent(ref)}`));
        const items = await response.json();
        return new Set(items.map(item => item.path));
    } catch (error) {
        if (error.status === 404) return new Set();
        throw error;
    }
}

function extensionFromDataUrl(dataUrl) {
    const mime = (dataUrl.match(/^data:([^;,]+)/) || [])[1] || '';
    const known = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'video/webm': 'webm'
    };
    return known[mime] || (mime.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '');
}

// ===== TOKEN =====
async function verifyGitHubToken(token) {
    const response = await fetch(repoApi(''), {
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
    });
    if (response.status === 401) {
        throw new Error('El token no es válido o ha caducado.');
    }
    if (!response.ok) {
        throw new Error(`El token no tiene acceso al repositorio (${response.status}).`);
    }
    const repo = await response.json();
    if (repo.permissions && !repo.permissions.push) {
        throw new Error('El token solo tiene permiso de lectura. Necesita "Contents: Read and write".');
    }
}

function setGitHubToken(token) {
    githubToken = token || '';
    safeStorageSet('github-token', githubToken || null);
    updateGitHubStatus();
}

function updateGitHubStatus() {
    const statusElement = document.getElementById('github-status');
    const statusText = document.getElementById('github-status-text');
    if (!statusElement || !statusText) return;

    statusElement.className = `github-status ${githubToken ? 'connected' : 'disconnected'}`;
    statusText.textContent = githubToken ? 'GitHub: Conectado' : 'GitHub: Solo lectura';
    statusElement.title = githubToken
        ? 'GitHub conectado. Pulsa para cambiar el token.'
        : 'Pulsa para configurar el token y poder guardar.';
}
