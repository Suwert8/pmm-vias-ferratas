# -*- coding: utf-8 -*-
import codecs

# Leer el archivo con codificación latin-1 (que es como lo guardó PowerShell)
with open('ferrata-app.html', 'r', encoding='latin-1') as f:
    content = f.read()

# Reemplazar caracteres mal codificados
replacements = {
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
    'Ã©': 'é',
    'Ã¡': 'á',
    'Â¡': '¡',
    'Â¿': '¿',
    'Ã': 'Í',
    'Ã'': 'Ó',
    'Ãš': 'Ú',
    'Ã'': 'Ñ',
    'Ã‰': 'É',
    'Ã': 'Á',
    'VÃƒÂ­as': 'Vías',
    'AÃ±adir': 'Añadir',
    'descripciÃ³n': 'descripción',
    'ubicaciÃ³n': 'ubicación',
    'informaciÃ³n': 'información',
    'AtenciÃ³n': 'Atención',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Guardar con UTF-8
with open('ferrata-app.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Archivo corregido y guardado con UTF-8")
