#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corregir problemas de codificación UTF-8 en archivos JSON
"""
import json
import os
import re

def fix_encoding_issues(text):
    """Corrige problemas comunes de codificación UTF-8 mal interpretada"""
    replacements = {
        'Ã¡': 'á',
        'Ã©': 'é', 
        'Ã­': 'í',
        'Ã³': 'ó',
        'Ãº': 'ú',
        'Ã±': 'ñ',
        'Ã': 'Á',
        'Ã‰': 'É',
        'Ã': 'Í', 
        'Ã"': 'Ó',
        'Ãš': 'Ú',
        'Ã'': 'Ñ',
        'Ã¼': 'ü',
        'Ã§': 'ç'
    }
    
    result = text
    for wrong, correct in replacements.items():
        result = result.replace(wrong, correct)
    
    return result

def fix_json_file(file_path):
    """Corrige la codificación de un archivo JSON"""
    try:
        # Leer el archivo como texto para corregir la codificación
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"Contenido original: {content[:200]}...")
        
        # Corregir problemas de codificación
        fixed_content = fix_encoding_issues(content)
        
        print(f"Contenido corregido: {fixed_content[:200]}...")
        
        # Validar que sigue siendo JSON válido
        try:
            json.loads(fixed_content)
        except json.JSONDecodeError as e:
            print(f"Error: El contenido corregido no es JSON válido: {e}")
            return False
        
        # Escribir el archivo corregido
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"✅ Archivo {file_path} corregido exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error procesando {file_path}: {e}")
        return False

def main():
    """Función principal"""
    json_files = [
        'data/ferratas.json'
    ]
    
    print("🔧 Corrigiendo problemas de codificación UTF-8...")
    
    for file_path in json_files:
        if os.path.exists(file_path):
            fix_json_file(file_path)
        else:
            print(f"⚠️  Archivo no encontrado: {file_path}")
    
    print("✅ Proceso completado")

if __name__ == "__main__":
    main()