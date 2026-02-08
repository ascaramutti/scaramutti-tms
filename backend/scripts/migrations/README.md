# Migraciones de Base de Datos

Esta carpeta contiene scripts de migración que modifican la estructura de la base de datos **sin destruir datos existentes**.

## 📋 Diferencia con `init_db.sql`

- **`init_db.sql`**: Crea la BD desde cero (solo para desarrollo inicial)
- **`migrations/`**: Scripts incrementales para actualizar BD existentes (producción)

## 🚀 Cómo ejecutar una migración

### Desarrollo Local
```bash
psql -U postgres -d scaramutti_tms -f backend/scripts/migrations/001_create_service_assignments.sql
```

### Producción (Docker)
```bash
docker exec -i scaramutti-db psql -U postgres -d scaramutti_tms < backend/scripts/migrations/001_create_service_assignments.sql
```

## 📝 Convención de Nombres

```
XXX_descripcion_de_la_migracion.sql
```

Donde:
- **XXX**: Número secuencial (001, 002, 003...)
- **descripcion**: Describe qué hace la migración

## ✅ Características de las migraciones

1. **Idempotentes**: Pueden ejecutarse múltiples veces sin error
2. **Seguras**: No destruyen datos existentes
3. **Documentadas**: Incluyen fecha, descripción y referencia a issue
4. **Verificables**: Incluyen queries de verificación

## 📚 Migraciones Aplicadas

| # | Archivo | Fecha | Descripción | Issue |
|---|---------|-------|-------------|-------|
| 001 | `001_create_service_assignments.sql` | 2026-02-05 | Crear tabla para asignaciones adicionales | US-003 |
| 002 | `002_fix_timestamps_timezone.sql` | 2026-02-08 | Convertir timestamps a TIMESTAMPTZ (con timezone) | US-003 |

## ⚠️ Importante

- Siempre hacer backup antes de ejecutar en producción
- Ejecutar migraciones en orden secuencial
- Verificar resultado con queries de validación
