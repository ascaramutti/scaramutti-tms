#!/bin/bash
# ==========================================
# Script de Despliegue para TMS
# Transport Management System
# ==========================================

set -e  # Detenerse ante cualquier error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# Funciones de utilidad
# ==========================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==========================================
# Variables
# ==========================================
VERSION=${1:-"v1.0.0"}
DEPLOY_DATE=$(date +%Y-%m-%d_%H-%M-%S)
COMPOSE_FILE="docker-compose.prod.yml"

# ==========================================
# Validaciones
# ==========================================
if [ ! -f ".env" ]; then
    log_error "No se encontró el archivo .env"
    log_info "Copia .env.example a .env y configura las variables"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "No se encontró $COMPOSE_FILE"
    exit 1
fi

log_info "Iniciando despliegue - Versión: $VERSION - Fecha: $DEPLOY_DATE"

# ==========================================
# Pull del código más reciente
# ==========================================
log_info "Actualizando código desde git..."
git pull origin develop
log_success "Código actualizado"

# ==========================================
# Construir imágenes
# ==========================================
log_info "Construyendo imágenes Docker..."
APP_VERSION=$VERSION DEPLOY_DATE=$DEPLOY_DATE docker-compose -f $COMPOSE_FILE build --no-cache
log_success "Imágenes construidas"

# ==========================================
# Detener servicios actuales
# ==========================================
log_info "Deteniendo servicios actuales..."
docker-compose -f $COMPOSE_FILE down
log_success "Servicios detenidos"

# ==========================================
# Iniciar servicios
# ==========================================
log_info "Iniciando servicios..."
APP_VERSION=$VERSION DEPLOY_DATE=$DEPLOY_DATE docker-compose -f $COMPOSE_FILE up -d
log_success "Servicios iniciados"

# ==========================================
# Verificar salud
# ==========================================
log_info "Verificando salud de los servicios..."
sleep 5

# Verificar backend
if curl -s http://localhost:3000/api/health > /dev/null; then
    log_success "Backend respondiendo correctamente"
else
    log_error "Backend no responde"
    exit 1
fi

# Verificar frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301"; then
    log_success "Frontend respondiendo correctamente"
else
    log_warning "Frontend puede no estar respondiendo (verificar manualmente)"
fi

# ==========================================
# Limpiar imágenes viejas
# ==========================================
log_info "Limpiando imágenes Docker no utilizadas..."
docker image prune -f
log_success "Limpieza completada"

# ==========================================
# Resumen
# ==========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DESPLIEGUE COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}========================================${NC}"
echo "  Versión: $VERSION"
echo "  Fecha: $DEPLOY_DATE"
echo "  Backend: http://localhost:3000/api/health"
echo "  Frontend: http://localhost"
echo -e "${GREEN}========================================${NC}"
echo ""
log_info "Para ver logs: docker-compose -f $COMPOSE_FILE logs -f"
