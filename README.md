# TMS - Transport Management System

Sistema de gestión de transporte para Transportes Scaramutti.

## 🚀 Despliegue Rápido

### Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Git

### Configuración Inicial

1. **Clonar el repositorio:**
   ```bash
   git clone <repo-url>
   cd scaramutti-tms
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con los valores reales
   ```

3. **Desplegar:**
   ```bash
   ./scripts/deploy.sh v1.0.0
   ```

## 🏗️ Estructura del Proyecto

```
scaramutti-tms/
├── backend/           # API REST (Node.js + Express + TypeScript)
├── frontend/          # SPA (React + Vite + TypeScript)
├── scripts/           # Scripts de utilidad
├── docker-compose.yml # Configuración de desarrollo
├── docker-compose.prod.yml # Configuración de producción
└── .env.example       # Plantilla de variables de entorno
```

## 🧪 Desarrollo Local

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## 📦 Despliegue en Producción

```bash
# Desplegar nueva versión
./scripts/deploy.sh v1.0.1

# Ver estado
./scripts/deploy.sh status

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🏷️ Versionado

Usamos [Semantic Versioning](https://semver.org/lang/es/):
- `v1.0.0` - Versión mayor (cambios breaking)
- `v1.1.0` - Nueva funcionalidad
- `v1.1.1` - Fix de bug

## 🔍 Health Check

- Backend: `GET http://localhost:3000/api/health`
- Frontend: `GET http://localhost`

## 📋 Changelog

### v1.0.0 - 2025-01-31
- Configuración Docker completa
- Despliegue automatizado con scripts
- Sistema de versionado implementado
