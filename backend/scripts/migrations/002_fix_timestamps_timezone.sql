-- ====================================================================
-- Migración 002: Corregir Timestamps a TIMESTAMPTZ
-- ====================================================================
-- Fecha: 2026-02-08
-- Autor: Claude Sonnet 4.5
-- Descripción: Convierte todas las columnas TIMESTAMP sin timezone a
--              TIMESTAMP WITH TIME ZONE para manejo correcto de zonas
--              horarias. Los datos existentes se interpretan como
--              hora de Lima (UTC-5) y se convierten a UTC.
-- ====================================================================

-- IMPORTANTE: Ejecutar durante ventana de mantenimiento en producción
-- Tiempo estimado: < 30 segundos (depende del volumen de datos)

BEGIN;

-- ====================================================================
-- PRIORIDAD ALTA: Columnas visibles al usuario
-- ====================================================================

-- 1. service_assignments.assigned_at (visible en UI)
ALTER TABLE service_assignments
ALTER COLUMN assigned_at TYPE TIMESTAMPTZ
USING assigned_at AT TIME ZONE 'America/Lima';

COMMENT ON COLUMN service_assignments.assigned_at IS
'Timestamp de asignación con timezone (guardado en UTC, mostrado en timezone local)';

-- 2. service_audit_logs.timestamp (auditoría crítica)
ALTER TABLE service_audit_logs
ALTER COLUMN timestamp TYPE TIMESTAMPTZ
USING timestamp AT TIME ZONE 'America/Lima';

COMMENT ON COLUMN service_audit_logs.timestamp IS
'Timestamp de auditoría con timezone (guardado en UTC)';

-- ====================================================================
-- PRIORIDAD MEDIA: Columnas de auditoría interna
-- ====================================================================

-- 3. services (created_at, updated_at)
ALTER TABLE services
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

ALTER TABLE services
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'America/Lima';

-- 4. users
ALTER TABLE users
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

-- 5. workers
ALTER TABLE workers
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

-- 6. drivers
ALTER TABLE drivers
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

-- 7. tractors
ALTER TABLE tractors
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

-- 8. trailers
ALTER TABLE trailers
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

-- 9. clients
ALTER TABLE clients
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

-- 10. cargo_types
ALTER TABLE cargo_types
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

-- 11. document_types
ALTER TABLE document_types
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'America/Lima';

-- ====================================================================
-- Verificación
-- ====================================================================

DO $$
DECLARE
    wrong_type_count INTEGER;
BEGIN
    -- Contar columnas que aún no son TIMESTAMPTZ
    SELECT COUNT(*) INTO wrong_type_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('assigned_at', 'timestamp', 'created_at', 'updated_at')
      AND data_type = 'timestamp without time zone';

    IF wrong_type_count > 0 THEN
        RAISE EXCEPTION 'Migración falló: % columnas aún sin timezone', wrong_type_count;
    ELSE
        RAISE NOTICE 'Migración exitosa: Todas las columnas convertidas a TIMESTAMPTZ';
    END IF;
END $$;

COMMIT;

-- ====================================================================
-- ROLLBACK (solo en caso de emergencia)
-- ====================================================================
-- IMPORTANTE: El rollback causará pérdida de información de timezone
-- Solo ejecutar si es absolutamente necesario
--
-- BEGIN;
--
-- ALTER TABLE service_assignments ALTER COLUMN assigned_at TYPE TIMESTAMP USING assigned_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE service_audit_logs ALTER COLUMN timestamp TYPE TIMESTAMP USING timestamp AT TIME ZONE 'America/Lima';
-- ALTER TABLE services ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE services ALTER COLUMN updated_at TYPE TIMESTAMP USING updated_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE workers ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE drivers ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE tractors ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE trailers ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE clients ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE cargo_types ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
-- ALTER TABLE document_types ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'America/Lima';
--
-- COMMIT;
-- ====================================================================
