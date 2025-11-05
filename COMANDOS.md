# Comandos Rápidos para Vías Ferratas PWA

## 🚀 Comandos de Desarrollo Rápido

### Respaldo Automático
```powershell
# Crear respaldo automático
.\backup.ps1

# O manualmente:
git checkout -b backup_$(Get-Date -Format "yyyyMMdd_HHmmss")
git add .
git commit -m "Respaldo manual - $(Get-Date)"
git push -u origin HEAD
git checkout main
```

### Versionado
```powershell
# Crear nueva versión
git tag -a v1.0.1 -m "Descripción de cambios"
git push origin v1.0.1

# Ver todas las versiones
git tag -l

# Volver a una versión específica
git checkout v1.0.0
```

### Recovery Commands (Comandos de Recuperación)
```powershell
# ⚠️ EMERGENCIA: Recuperar versión estable
git checkout main
git reset --hard v1.0.0
git push -f origin main

# Recuperar archivo específico de una versión
git checkout v1.0.0 -- ferrata-app.html

# Ver diferencias con versión estable
git diff v1.0.0 ferrata-app.html
```

### Diagnóstico
```powershell
# Ver estado actual
git status
git log --oneline -5

# Ver ramas
git branch -a

# Ver tags
git tag -l

# Ver qué cambió en último commit
git show --stat
```

## 🛠️ Funcionalidades Críticas a Verificar

### En la App (Navegador)
1. **Ctrl+Shift+T** → Token GitHub configurado
2. **Ctrl+Shift+D** → Diagnosticar archivo GitHub
3. **Ctrl+Shift+S** → Sincronizar desde GitHub

### En el Formulario
1. Botón "Mi Ubicación" con spinner
2. Botón "Generar Descripción con IA"
3. Subida de imágenes funcional
4. Guardado en GitHub funcional

### En la Lista
1. Filtros por nivel funcionando
2. Botones Editar/Borrar visibles
3. Modal de detalles completo

## 🆘 Solución de Problemas

### Si se pierden funcionalidades:
```powershell
# 1. Verificar qué versión estás usando
git log --oneline -1

# 2. Si no es v1.0.0, recuperar:
git checkout v1.0.0
git checkout -b recuperar-funcionalidades
git push -u origin recuperar-funcionalidades

# 3. Si quieres hacer la versión actual como main:
git checkout main
git reset --hard v1.0.0
git push -f origin main
```

### Si GitHub no sincroniza:
1. Verificar token: **Ctrl+Shift+T** en la app
2. Diagnosticar: **Ctrl+Shift+D** en la app
3. Limpiar archivo: **Ctrl+Shift+C** en la app

### Si las funciones de IA no funcionan:
1. Verificar que el nombre esté rellenado
2. Verificar que la ubicación esté seleccionada
3. Revisar consola del navegador (F12)

## 📋 Checklist antes de Cambios Importantes

- [ ] Crear respaldo: `.\backup.ps1`
- [ ] Verificar que todo funciona en navegador
- [ ] Probar funcionalidades críticas
- [ ] Hacer commit pequeño y descriptivo
- [ ] Probar en dispositivo móvil si es posible

## 🎯 Próximos Pasos Seguros

1. **Siempre trabajar en rama desarrollo**: `git checkout desarrollo`
2. **Commits frecuentes**: cada funcionalidad individual
3. **Tags para hitos**: cada grupo de funcionalidades completas
4. **Respaldos antes de cambios grandes**: `.\backup.ps1`