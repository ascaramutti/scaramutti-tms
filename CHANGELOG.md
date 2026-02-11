# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Agregado

**Edición de Servicios con Justificación Obligatoria (US-004)**
- Permite editar información de servicios en cualquier estado con justificación obligatoria para auditoría
- Validaciones por estado del servicio (campos editables dependen del estado)
- Auditoría detallada por campo modificado (cada cambio genera un registro individual)
- Permisos extendidos: Admin, Sales, Gerentes pueden editar (solo Admin puede cambiar estado)

**Backend:**
- Endpoint PUT `/api/services/:id` refactorizado completamente:
  - Permisos actualizados: `['admin', 'sales', 'general_manager', 'operations_manager']`
  - Solo Admin puede editar campo `statusId` directamente
  - Justificación obligatoria (mínimo 10 caracteres) compartida entre todos los cambios
  - Detección automática de campos modificados (al menos 1 cambio requerido)
  - Validaciones por estado: campos permitidos según estado del servicio
  - Comparación numérica correcta para evitar falsos duplicados
- Auditoría por campo en `service_audit_logs`:
  - Cada campo modificado genera UN registro individual con `change_type='field_edit'`
  - Campos: `field_name` (técnico), `field_label` (legible), `old_value`, `new_value`
  - Mapeo completo de 19 campos editables a etiquetas en español
- Refactorización de 4 endpoints existentes para usar nueva estructura de auditoría:
  - `createService()`, `assignResources()`, `changeStatus()`, `updateService()`
  - Diseño consistente: TODOS los cambios de estado usan `field_name='status'`, `field_label='Estado'`

**Frontend:**
- Componente `EditServiceModal` para editar servicios existentes:
  - Pre-carga valores actuales del servicio
  - Campos visibles según estado del servicio (lógica de visibilidad)
  - Detección automática de cambios (comparación formData vs valores originales)
  - Campo "Justificación" obligatorio con validación mínima 10 caracteres
  - Validación: al menos 1 campo debe cambiar para habilitar guardado
  - Manejo de errores (403 sin permisos, 400 sin cambios, validaciones)
- Integración en `ServiceDetailModal`:
  - Botón "Editar Servicio" con validación de permisos por rol
  - Recarga automática de datos al guardar cambios exitosamente
- Interfaces TypeScript actualizadas:
  - `UpdateServiceRequest` con todos los campos editables
  - `ServiceUpdateField` para tracking de cambios

**Base de Datos:**
- **Migración 003:** Refactorización de tabla `service_audit_logs` para auditoría genérica
  - Agregadas columnas: `old_value`, `new_value`, `field_name`, `field_label` (nullable)
  - Migración de datos existentes: `old_status` → `old_value`, `new_status` → `new_value`
  - Actualización de 105 registros existentes con `field_name='status'`, `field_label='Estado'`
  - Eliminadas columnas legacy: `old_status`, `new_status`
  - Índices creados: `change_type`, `field_name`, `service_id + change_type`
- **Migración 004:** Ampliación de columnas para soportar timestamps largos
  - `old_value` y `new_value`: VARCHAR(50) → VARCHAR(255)

### Testing
- ✅ Backend: 10+ casos de prueba ejecutados (validaciones, permisos, auditoría, estados)
- ✅ Frontend: 14 casos de prueba ejecutados (modal, validaciones, permisos, estados)
- ✅ Base de datos: 105 registros migrados exitosamente sin pérdida de datos

### Técnico
- 4 archivos modificados en backend (migraciones, controllers, rutas)
- 4 archivos modificados en frontend (componentes, interfaces, servicios)
- 2 migraciones de base de datos ejecutadas
- Versión sincronizada en backend y frontend: 1.3.0

### Próximas Features
- Reporte de servicios completados para cálculo de bonos semanales
- CI/CD con GitHub Actions
- Migración incremental a Quarkus

---

## [1.2.0] - 2026-02-08

### Agregado

**Recursos Adicionales a Servicios en Ejecución (US-003)**
- Nueva funcionalidad para agregar recursos adicionales (tractores, trailers, conductores) a servicios que ya están en ejecución
- Permite adaptarse a cambios operativos sin cerrar el servicio original:
  - Cambio de tracto por falla mecánica
  - Relevo de conductores en viajes largos
  - Cargas compartidas entre múltiples vehículos
  - Agregar trailer durante la ejecución

**Backend:**
- Nueva tabla `service_assignments` con auditoría completa (quién asignó, cuándo)
- Endpoint POST `/api/services/:id/assignments` con validaciones:
  - Solo servicios en estado `in_progress` pueden agregar recursos
  - Detección inteligente de conflictos (recursos ocupados en otros servicios)
  - Parámetro `force` para sobrescribir advertencias de conflictos
  - Validación de duplicados en mismo servicio (400) vs conflictos (409)
  - Notes obligatorio (mínimo 10 caracteres) para documentar motivo
- Modificación a GET `/api/services/:id`: incluye array `additionalAssignments` con datos completos
- Modificación a GET `/api/services`: incluye campo `additionalAssignmentsCount` (contador)
- Queries optimizadas con UNION para verificar conflictos en ambas tablas (services + service_assignments)

**Frontend:**
- Modal `AddUnitsModal` con formulario completo:
  - Dropdowns opcionales para tracto, trailer y conductor
  - Campo notes obligatorio con validación
  - Manejo de conflictos con alerta roja y botones Cancelar/FORZAR
- Timeline visual de recursos adicionales en `ServiceDetailModal`:
  - Diseño cronológico (más antiguo → más reciente)
  - Muestra recursos asignados, notas y metadata (quién asignó, cuándo)
  - Visible independientemente del estado del servicio
- Badge de contador en `ServiceCard` con colores dinámicos según estado
- Botón "Agregar Recursos" con validación de permisos por rol
- Validación frontend: al menos un recurso debe estar presente, notes mínimo 10 caracteres

**Base de Datos:**
- **Migración 001:** Tabla `service_assignments` con constraints, foreign keys e índices
- **Migración 002:** Conversión de 12 tablas de TIMESTAMP a TIMESTAMPTZ (con timezone)

### Corregido

**Zona Horaria en Timestamps**
- Fix crítico: Todas las columnas timestamp ahora usan `TIMESTAMPTZ` (timestamp with time zone)
- Tablas afectadas: service_assignments, service_audit_logs, y todas las created_at/updated_at (12 tablas total)
- Datos existentes interpretados como hora de Lima (UTC-5) y convertidos a UTC
- Frontend ahora muestra fechas correctamente en la zona horaria local del usuario
- Fix específico: `service_assignments.assigned_at` ahora muestra hora correcta en UI

### Testing
- ✅ 16/16 casos de prueba ejecutados (100% PASS)
- Backend: 14/14 casos (validaciones 400, conflictos 409, operaciones 200, GET endpoints)
- Frontend: 2/2 casos (modal conflictos, botón FORZAR)

### Técnico
- 21 archivos modificados (+1,402 líneas de código)
- 2 migraciones de base de datos ejecutadas
- Versión sincronizada en backend y frontend: 1.2.0
- Deploy en producción sin downtime (08/02/2026 ~1:30 AM)

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
**Última actualización:** 08 de Febrero 2026
