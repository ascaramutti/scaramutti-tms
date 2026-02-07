# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Próximas Features
- Reporte de servicios completados para cálculo de bonos semanales
- CI/CD con GitHub Actions
- Migración incremental a Quarkus

---

## [1.1.0] - 2026-02-07

### Cambiado

**Asignación de Servicios (US-002)**
- El campo **Trailer ahora es opcional** al asignar recursos a un servicio
- Permite asignar servicios solo con conductor y tractor (sin carreta)
- Interfaz actualizada: campo mostrado como "Trailer (opcional)"
- Opción por defecto: "Sin trailer"
- Validación ajustada: solo conductor y tractor son campos requeridos
- Payload condicional: `trailerId` solo se envía si se selecciona un trailer

**Backend:**
- Interface `AssignResourcesPayload`: `trailerId` ahora opcional (`trailerId?: number`)
- Validación actualizada en `assignResources`: solo requiere `driverId` y `tractorId`
- Query de conflictos actualizado para manejar `trailer_id = NULL`
- Mensaje dinámico: "Servicio asignado correctamente (sin trailer)" cuando no hay trailer

**Frontend:**
- Interface actualizada: `trailerId?: number`
- Modal de asignación: label cambiado a "(opcional)"
- Validación del formulario: solo driver y tractor requeridos
- Construcción condicional del payload

**Testing:**
- ✅ 5 tests de API (con trailer, sin trailer, validaciones)
- ✅ 2 tests de UI (asignación con/sin trailer)
- ✅ Verificado en base de datos: `trailer_id = NULL` funciona correctamente

---

## [1.0.0] - 2026-01-15

### Agregado

**Sistema MVP completo de gestión de transporte**

#### Autenticación y Usuarios
- Sistema de login con JWT
- Autorización basada en roles (admin, general_manager, operations_manager, dispatcher, sales)
- Protección de rutas en frontend
- Control de permisos para información financiera

#### Gestión de Servicios
- Crear servicio de transporte con toda la información necesaria
- Listar servicios con filtros (estado, cliente, fecha, búsqueda)
- Ver detalle completo de servicio
- Asignar recursos (conductor, tractor, carreta) con validación de conflictos
- Cambiar estado de servicio con máquina de estados validada
- Actualización administrativa (solo rol admin)
- Paginación en listados

#### Gestión de Clientes
- Crear nuevos clientes
- Listar y buscar clientes
- Validación de RUC único

#### Gestión de Recursos
- Gestión de conductores con licencia
- Gestión de tractores (placas, modelos)
- Gestión de carretas (placas, tipos)
- Estados de recursos (disponible, mantenimiento, no disponible)

#### Dashboard
- Estadísticas en tiempo real:
  - Servicios activos (en progreso)
  - Servicios pendientes (sin asignar + por iniciar)
  - Conductores disponibles
  - Vehículos disponibles

#### Catálogos Maestros
- Tipos de carga estándar (Contenedor 40FT, Bobinas, etc.)
- Tipos de servicio (Local, Provincia)
- Monedas (USD, PEN)
- Estados configurables

#### Sistema de Auditoría
- Registro automático de todas las acciones sobre servicios
- Histórico completo: creación, asignaciones, cambios de estado, modificaciones
- Usuario y timestamp de cada acción

#### Infraestructura
- Dockerización completa (frontend, backend, BD)
- Nginx como proxy reverso
- Deploy con script automatizado
- Health checks configurados
- Variables de entorno para configuración

### Técnico

**Backend (Node.js + Express + TypeScript)**
- 11 controladores organizados por dominio
- 11 rutas con validaciones
- Middleware de autenticación y autorización
- Transacciones de BD con rollback automático
- 1,747 líneas de código

**Frontend (React + Vite + TailwindCSS)**
- 6 páginas principales
- 9 servicios API con Axios
- Context API para gestión de estado
- Componentes reutilizables con Radix UI
- Rutas protegidas
- 4,179 líneas de código

**Base de Datos (PostgreSQL 16)**
- 16 tablas normalizadas
- Relaciones con integridad referencial
- Índices optimizados
- Campos de auditoría en todas las tablas

---

## Formato de Versiones

### Tipos de Cambios

- **Agregado** (Added): Para funcionalidades nuevas
- **Cambiado** (Changed): Para cambios en funcionalidades existentes
- **Deprecado** (Deprecated): Para funcionalidades que se eliminarán pronto
- **Eliminado** (Removed): Para funcionalidades eliminadas
- **Corregido** (Fixed): Para bugs corregidos
- **Seguridad** (Security): Para vulnerabilidades de seguridad

### Versionado Semántico

Formato: `MAJOR.MINOR.PATCH` (ej: 1.2.3)

- **MAJOR**: Cambios incompatibles con versiones anteriores
- **MINOR**: Nuevas funcionalidades compatibles con versiones anteriores
- **PATCH**: Correcciones de bugs compatibles con versiones anteriores

**Ejemplos:**
- `1.0.0` → `1.0.1`: Bug fix (patch)
- `1.0.1` → `1.1.0`: Nueva feature (minor)
- `1.1.0` → `2.0.0`: Breaking change (major)

---

## Cómo Actualizar este Archivo

### Al Completar una Historia

1. Agregar cambio en sección `[Unreleased]`
2. Categorizar según tipo (Agregado, Corregido, etc.)
3. Describir el cambio desde perspectiva del usuario

### Al Hacer Release

1. Cambiar `[Unreleased]` por `[X.Y.Z] - YYYY-MM-DD`
2. Crear nueva sección `[Unreleased]` arriba
3. Incrementar versión según cambios
4. Crear tag en Git: `git tag -a vX.Y.Z -m "Release X.Y.Z"`

### Ejemplo de Entrada

```markdown
## [Unreleased]

### Agregado
- Reporte de servicios completados para cálculo de bonos (#20)
- Exportación de reportes a formato Excel (#20)
- Filtro de "Semana Actual" en reporte de bonos (#20)

### Corregido
- Bug en validación de recursos duplicados (#25)
- Error de timezone en date picker (#26)
```

---

## Notas

- Este archivo se actualiza en cada sprint
- Los issues de GitHub se referencian con `#número`
- Las breaking changes se marcan claramente
- Solo cambios notables se documentan (no typos menores)

---

**Mantenido por:** Angel Scaramutti
**Última actualización:** 07 de Febrero 2026
