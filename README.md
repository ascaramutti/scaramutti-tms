# 🚛 Scaramutti TMS - Transport Management System

> **⚠️ MODO MANTENIMIENTO - LEGACY VERSION**
>
> Este repositorio está en modo de mantenimiento desde el **15 de febrero de 2026**.
>
> **Nueva versión:** El desarrollo activo continúa en [scaramutti-tms-v2](https://github.com/ascaramutti/scaramutti-tms-v2) con stack moderno (Quarkus + Java 17).
>
> **Soporte:** Solo se atenderán hotfixes críticos en esta versión hasta migración completa.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()
[![Methodology](https://img.shields.io/badge/methodology-SCRUM-orange.svg)](./PROYECTO_SCRUM.md)
[![Status](https://img.shields.io/badge/status-LEGACY-orange.svg)]()

Sistema de gestión de transporte de carga pesada para Transportes Scaramutti.

---

## 📚 Documentación Principal

**¿Primera vez aquí?** Empieza por:

1. 📖 **[QUICK_START.md](./QUICK_START.md)** - Guía de inicio rápido (2 horas)
2. 📋 **[PROYECTO_SCRUM.md](./PROYECTO_SCRUM.md)** - Documento maestro con metodología y backlog completo
3. 📝 **[CHANGELOG.md](./CHANGELOG.md)** - Historial de cambios

**Documentación Técnica:**

- 🏗️ **[docs/adr/](./docs/adr/)** - Architecture Decision Records
- 🎯 **[docs/sprints/](./docs/sprints/)** - Planificación de sprints
- 🔄 **[docs/retrospectivas/](./docs/retrospectivas/)** - Retrospectivas semanales
- 📑 **[docs/templates/](./docs/templates/)** - Plantillas reutilizables

---

## 🎯 Estado del Proyecto

**Versión Actual:** v1.0.0 (MVP en producción)

**Estado:** ✅ Producción | 🚧 En migración a Quarkus

**Usuarios:** < 10 concurrentes

**Próximo Hito:** Sprint 1 - Reporte de Bonos Semanales

---

## 🛠️ Stack Tecnológico

### Actual (MVP)

```
Frontend:  React 19 + Vite + TailwindCSS + TypeScript
Backend:   Node.js 20 + Express + TypeScript
Database:  PostgreSQL 16
Infra:     Docker + Docker Compose + Nginx
```

### Objetivo (En migración)

```
Frontend:  React 19 (sin cambios)
Backend:   Quarkus 3.x + Java 17 ← Migración incremental
Database:  PostgreSQL 16 (sin cambios)
Quality:   JaCoCo + SonarQube + JUnit 5
CI/CD:     GitHub Actions
```

**Ver decisión:** [docs/adr/001-quarkus-vs-spring-boot.md](./docs/adr/001-quarkus-vs-spring-boot.md)

---

## 🚀 Inicio Rápido

### Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Git
- Node.js 20+ (para desarrollo local)

### Setup en 5 Minutos

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd scaramutti-tms

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con valores reales

# 3. Iniciar entorno de desarrollo
docker-compose up -d

# 4. Verificar que funciona
curl http://localhost:3000/api/health
open http://localhost

# 5. Ver logs
docker-compose logs -f
```

**Accesos:**
- Frontend: http://localhost
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

**Usuarios de prueba:**
- `admin` / `123456` (Administrador)
- `ascaramutti` / `123456` (Gerente General)
- `jdispatcher` / `123456` (Dispatcher)

---

## 🏗️ Estructura del Proyecto

```
scaramutti-tms/
│
├── 📄 PROYECTO_SCRUM.md         ← Documento maestro (metodología + backlog)
├── 📄 QUICK_START.md             ← Guía de inicio (lee esto primero)
├── 📄 CHANGELOG.md               ← Historial de versiones
├── 📄 README.md                  ← Este archivo
│
├── 📁 docs/                      ← Documentación
│   ├── adr/                      ← Architecture Decision Records
│   ├── sprints/                  ← Planificación de sprints
│   ├── retrospectivas/           ← Retrospectivas semanales
│   └── templates/                ← Plantillas (sprint, retro, ADR)
│
├── 📁 backend/                   ← Backend Node.js (actual)
│   ├── src/
│   │   ├── controllers/          ← 11 controladores
│   │   ├── routes/               ← 11 rutas
│   │   ├── middleware/           ← Auth, authorization
│   │   ├── interfaces/           ← TypeScript types
│   │   └── config/               ← Configuración
│   ├── scripts/                  ← Scripts de DB
│   ├── Dockerfile
│   └── package.json
│
├── 📁 frontend/                  ← Frontend React
│   ├── src/
│   │   ├── pages/                ← 6 páginas
│   │   ├── components/           ← Componentes reutilizables
│   │   ├── services/             ← 9 servicios API
│   │   ├── context/              ← AuthContext
│   │   └── interfaces/           ← TypeScript types
│   ├── nginx.conf                ← Proxy reverso
│   ├── Dockerfile
│   └── package.json
│
├── 📁 scripts/                   ← Scripts de deployment
│   └── deploy.sh                 ← Deploy automatizado
│
├── docker-compose.yml            ← Desarrollo
├── docker-compose.prod.yml       ← Producción
└── .env.example                  ← Template de variables
```

**Métricas de Código:**
- Backend: 1,747 líneas TypeScript
- Frontend: 4,179 líneas TypeScript/React
- Database: 16 tablas normalizadas

---

## 🧪 Desarrollo Local

### Comandos Básicos

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar un servicio
docker-compose restart backend

# Detener todo
docker-compose down

# Rebuild después de cambios
docker-compose up -d --build
```

### Desarrollo Sin Docker (Opcional)

```bash
# Backend
cd backend
npm install
npm run dev     # Puerto 3000

# Frontend
cd frontend
npm install
npm run dev     # Puerto 5173

# PostgreSQL (necesitas Docker solo para BD)
docker-compose up -d postgres
```

### Acceso a la Base de Datos

```bash
# Via Docker
docker exec -it scaramutti-db psql -U postgres -d scaramutti_tms

# Via CLI local (si tienes psql)
psql -h localhost -U postgres -d scaramutti_tms
```

---

## 📦 Despliegue en Producción

### Deploy Automático (Cuando tengas CI/CD)

```bash
# Push a main → Deploy automático
git push origin main
```

### Deploy Manual (Actual)

```bash
# En servidor de producción
cd /app/scaramutti-tms
git pull origin main
./scripts/deploy.sh

# Verificar
curl https://tu-dominio.com/api/health
```

### Rollback

```bash
# Revertir último commit
git revert HEAD
git push origin main

# O volver a versión específica
git checkout v1.0.0
./scripts/deploy.sh
```

---

## 🔍 Health Checks

```bash
# Backend
curl http://localhost:3000/api/health
# Response: {"status": "ok", "database": "connected"}

# Frontend
curl http://localhost
# Response: HTML de la aplicación

# PostgreSQL
docker exec scaramutti-db pg_isready -U postgres
```

---

## 📋 Funcionalidades Principales

### ✅ Implementadas (v1.0.0)

**Autenticación & Usuarios**
- Login con JWT
- 5 roles: admin, general_manager, operations_manager, dispatcher, sales
- Control de permisos por rol

**Gestión de Servicios**
- Crear servicio de transporte
- Asignar recursos (conductor, tractor, carreta)
- Cambiar estado (pending → in_progress → completed)
- Máquina de estados con validaciones
- Auditoría automática de cambios

**Gestión de Recursos**
- Conductores con licencias
- Tractores (placas, modelos)
- Carretas (placas, tipos)
- Estados: disponible, mantenimiento, no_disponible

**Dashboard**
- Servicios activos
- Servicios pendientes
- Recursos disponibles
- Estadísticas en tiempo real

**Clientes**
- CRUD completo
- Búsqueda por nombre/RUC
- Validación de RUC único

### 🚧 En Desarrollo

**Sprint 1:**
- [ ] Reporte de servicios completados para bonos
- [ ] Exportación a Excel

**Sprint 2:**
- [ ] CI/CD con GitHub Actions
- [ ] JaCoCo para coverage
- [ ] SonarQube para calidad

**Sprint 3+:**
- [ ] Migración incremental a Quarkus

Ver backlog completo: [PROYECTO_SCRUM.md](./PROYECTO_SCRUM.md#6-product-backlog-completo)

---

## 🧑‍💻 Metodología de Desarrollo

Usamos **SCRUM adaptado para 1 persona** (Scrumban Personal):

- **Sprints:** 1 semana (Lunes → Viernes)
- **Planning:** Lunes 9:00 AM (30 min)
- **Ejecución:** Martes-Jueves
- **Deploy:** Viernes AM
- **Retrospectiva:** Viernes PM (15 min)

**Herramientas:**
- GitHub Projects (Kanban)
- GitHub Issues (User Stories)
- GitHub Milestones (Sprints)

**Documentación detallada:** [PROYECTO_SCRUM.md](./PROYECTO_SCRUM.md)

---

## 📊 Métricas de Calidad (Objetivo)

| Métrica | Meta | Estado |
|---------|------|--------|
| **Code Coverage** | 60-70% | ⚠️ Pendiente |
| **Complejidad Ciclomática** | < 10 | ✅ OK |
| **Duplicación** | < 5% | ✅ OK |
| **Bugs Críticos** | 0 | ✅ 0 |
| **Vulnerabilidades Críticas** | 0 | ⚠️ Pendiente validar |
| **API Response Time** | < 500ms | ✅ OK |

---

## 🏷️ Versionado

Usamos [Semantic Versioning](https://semver.org/lang/es/):

```
MAJOR.MINOR.PATCH
  │      │      │
  │      │      └─ Bug fixes
  │      └─────── Nuevas features (compatibles)
  └────────────── Breaking changes
```

**Ejemplos:**
- `1.0.0` → `1.0.1`: Fix de bug
- `1.0.1` → `1.1.0`: Nueva feature (reporte de bonos)
- `1.1.0` → `2.0.0`: Cambio breaking (migración a Quarkus completa)

**Ver historial:** [CHANGELOG.md](./CHANGELOG.md)

---

## 🤝 Contribución

### Para Desarrolladores Externos (Futuro)

Actualmente el proyecto es interno, pero si en el futuro se abre:

1. Lee [PROYECTO_SCRUM.md](./PROYECTO_SCRUM.md)
2. Crea issue con User Story
3. Espera aprobación del Product Owner
4. Crea rama: `feature/descripcion`
5. Haz PR a `develop`
6. Espera code review

### Para el Equipo Actual (1 persona)

1. **Lunes:** Sprint Planning
2. **Desarrollo:** Feature branches
3. **Viernes:** Merge a `develop` → `main` → Deploy
4. **Commits:** Usa [Conventional Commits](https://www.conventionalcommits.org/)

```bash
feat(reports): add bonus calculation
fix(services): correct resource validation
docs(readme): update setup instructions
test(services): add state machine tests
```

---

## 📞 Contacto y Soporte

**Mantenedor:** Angel Scaramutti

**Reportar Bugs:**
- Crear issue en GitHub con label `bug`
- Usar template: `.github/ISSUE_TEMPLATE/bug_report.md`

**Proponer Features:**
- Crear issue en GitHub con label `feature`
- Usar formato de User Story (ver `PROYECTO_SCRUM.md`)

---

## 📖 Referencias

**Tecnologías:**
- [React](https://react.dev/) - Framework frontend
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Node.js](https://nodejs.org/) - Runtime backend
- [Express](https://expressjs.com/) - Framework backend
- [PostgreSQL](https://www.postgresql.org/) - Base de datos
- [Quarkus](https://quarkus.io/) - Framework futuro backend

**Metodología:**
- [SCRUM Guide](https://scrumguides.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📜 Licencia

Propietario - Transportes Scaramutti. Todos los derechos reservados.

---

## 🎉 Agradecimientos

- Equipo de Transportes Scaramutti por confiar en el proyecto
- Usuarios beta que probaron el MVP y dieron feedback

---

**Versión del README:** 2.0
**Última actualización:** 05/02/2026
**Próxima revisión:** Post Sprint 1 (14/02/2026)
