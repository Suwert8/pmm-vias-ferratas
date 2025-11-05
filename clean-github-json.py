#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para limpiar el archivo JSON en GitHub eliminando BOM y validando formato
"""
import json
import base64
import requests
import os

# Configuración
GITHUB_OWNER = "Suwert8"
GITHUB_REPO = "pmm-vias-ferratas"
GITHUB_BRANCH = "main"
DATA_FILE = "data/ferratas.json"

def get_github_token():
    """Obtener el token de GitHub desde variables de entorno o input"""
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        token = input("Introduce tu GitHub Personal Access Token: ").strip()
    return token

def clean_bom(content):
    """Limpiar BOM de un contenido"""
    # Eliminar BOM UTF-8
    if content.startswith('\ufeff'):
        content = content[1:]
    if content.startswith('ï»¿'):
        content = content[3:]
    return content

def get_current_file_sha(token):
    """Obtener el SHA actual del archivo en GitHub"""
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{DATA_FILE}"
    headers = {
        'Authorization': f'token {token}',
        'Content-Type': 'application/json',
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()['sha'], response.json()['content']
    elif response.status_code == 404:
        return None, None
    else:
        raise Exception(f"Error al obtener archivo: {response.status_code}")

def upload_clean_file(token, content, sha=None):
    """Subir archivo limpio a GitHub"""
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{DATA_FILE}"
    headers = {
        'Authorization': f'token {token}',
        'Content-Type': 'application/json',
    }
    
    # Codificar contenido
    encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
    
    data = {
        'message': 'Clean: Eliminar BOM y validar formato JSON',
        'content': encoded_content,
        'branch': GITHUB_BRANCH
    }
    
    if sha:
        data['sha'] = sha
    
    response = requests.put(url, headers=headers, json=data)
    return response.status_code == 200 or response.status_code == 201

def main():
    """Función principal"""
    print("🧹 Limpiando archivo JSON en GitHub...")
    
    token = get_github_token()
    if not token:
        print("❌ Token de GitHub requerido")
        return
    
    try:
        # Obtener archivo actual
        print("📥 Obteniendo archivo actual...")
        sha, encoded_content = get_current_file_sha(token)
        
        if not encoded_content:
            print("📁 Archivo no existe, creando nuevo...")
            content = "[]"
        else:
            # Decodificar y limpiar
            content = base64.b64decode(encoded_content).decode('utf-8')
            print(f"📄 Contenido original (primeros 50 chars): {repr(content[:50])}")
            
            # Limpiar BOM
            clean_content = clean_bom(content)
            
            # Validar y reformatear JSON
            try:
                data = json.loads(clean_content)
                content = json.dumps(data, indent=2, ensure_ascii=False)
                print(f"✅ JSON válido con {len(data)} elementos")
            except json.JSONDecodeError as e:
                print(f"❌ Error en JSON: {e}")
                print(f"📄 Contenido problemático: {repr(clean_content[:100])}")
                return
        
        # Subir archivo limpio
        print("📤 Subiendo archivo limpio...")
        if upload_clean_file(token, content, sha):
            print("✅ Archivo limpiado y subido exitosamente")
        else:
            print("❌ Error al subir archivo")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()