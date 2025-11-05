#!/bin/bash
# Script de respaldo automático para Vías Ferratas PWA

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Iniciando respaldo automático...${NC}"

# Verificar si estamos en un repositorio git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: No se encontró repositorio git${NC}"
    exit 1
fi

# Obtener fecha y hora actual
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BRANCH_NAME="backup_$TIMESTAMP"

echo -e "${YELLOW}📅 Timestamp: $TIMESTAMP${NC}"

# Verificar si hay cambios
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${GREEN}✅ No hay cambios para respaldar${NC}"
    exit 0
fi

# Crear rama de respaldo
echo -e "${YELLOW}🌿 Creando rama de respaldo: $BRANCH_NAME${NC}"
git checkout -b "$BRANCH_NAME"

# Añadir todos los cambios
echo -e "${YELLOW}📦 Añadiendo cambios...${NC}"
git add .

# Hacer commit con mensaje descriptivo
COMMIT_MSG="Respaldo automático - $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${YELLOW}💾 Creando commit: $COMMIT_MSG${NC}"
git commit -m "$COMMIT_MSG"

# Subir rama al remoto
echo -e "${YELLOW}☁️ Subiendo respaldo al repositorio remoto...${NC}"
git push -u origin "$BRANCH_NAME"

# Volver a la rama principal
echo -e "${YELLOW}🔙 Volviendo a rama principal...${NC}"
git checkout main

echo -e "${GREEN}✅ Respaldo completado: $BRANCH_NAME${NC}"
echo -e "${GREEN}📋 Para recuperar: git checkout $BRANCH_NAME${NC}"

# Listar últimos respaldos
echo -e "${YELLOW}📚 Últimos 5 respaldos:${NC}"
git branch -r | grep "backup_" | tail -5