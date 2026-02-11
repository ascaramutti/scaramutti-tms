-- ============================================================================
-- Migración 003: Refactorización de service_audit_logs
-- US-004: Editar Información de Servicios con Justificación
-- ============================================================================
-- Descripción:
--   Refactoriza la tabla service_audit_logs para hacerla genérica y soportar
--   auditoría detallada por campo individual.
--
-- Cambios:
--   1. Agrega columnas genéricas: old_value, new_value, field_name, field_label
--   2. Migra datos existentes de old_status/new_status a old_value/new_value
--   3. Actualiza registros existentes para usar field_name='status'
--   4. Elimina columnas legacy (old_status, new_status)
--   5. Crea índices para optimizar queries
--
-- Diseño consistente:
--   - TODOS los registros usan field_name y field_label
--   - STATUS_CHANGE: field_name='status', field_label='Estado'
--   - field_edit: field_name='price', field_label='Precio' (ejemplo)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. AGREGAR NUEVAS COLUMNAS (nullable para consistencia)
-- ============================================================================

ALTER TABLE service_audit_logs
  ADD COLUMN IF NOT EXISTS old_value VARCHAR(50),
  ADD COLUMN IF NOT EXISTS new_value VARCHAR(50),
  ADD COLUMN IF NOT EXISTS field_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS field_label VARCHAR(100);

-- ============================================================================
-- 2. MIGRAR DATOS EXISTENTES
-- ============================================================================

-- Copiar valores de old_status/new_status a old_value/new_value
UPDATE service_audit_logs
SET
  old_value = old_status,
  new_value = new_status;

-- ============================================================================
-- 3. ACTUALIZAR REGISTROS EXISTENTES CON field_name Y field_label
-- ============================================================================

-- Para todos los cambios de estado, establecer field_name='status' y field_label='Estado'
UPDATE service_audit_logs
SET
  field_name = 'status',
  field_label = 'Estado'
WHERE change_type IN ('STATUS_CHANGE', 'CREATED', 'ASSIGNMENT', 'ADMIN_UPDATE');

-- ============================================================================
-- 4. ELIMINAR COLUMNAS LEGACY
-- ============================================================================

-- Una vez migrados los datos, eliminamos las columnas antiguas
ALTER TABLE service_audit_logs
  DROP COLUMN IF EXISTS old_status,
  DROP COLUMN IF EXISTS new_status;

-- ============================================================================
-- 5. CREAR ÍNDICES PARA OPTIMIZAR QUERIES
-- ============================================================================

-- Índice en change_type para filtrar por tipo de cambio
CREATE INDEX IF NOT EXISTS idx_service_audit_logs_change_type
  ON service_audit_logs(change_type);

-- Índice en field_name para búsquedas por campo específico
CREATE INDEX IF NOT EXISTS idx_service_audit_logs_field_name
  ON service_audit_logs(field_name);

-- Índice compuesto para queries que filtran por servicio + tipo de cambio
CREATE INDEX IF NOT EXISTS idx_service_audit_logs_service_change_type
  ON service_audit_logs(service_id, change_type);

-- ============================================================================
-- 6. VERIFICACIÓN DE LA MIGRACIÓN
-- ============================================================================

-- Verificar que todos los registros existentes tienen field_name y field_label
DO $$
DECLARE
  records_without_field_name INTEGER;
  total_records INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_records FROM service_audit_logs;
  SELECT COUNT(*) INTO records_without_field_name
  FROM service_audit_logs
  WHERE field_name IS NULL;

  IF records_without_field_name > 0 THEN
    RAISE WARNING 'Advertencia: % registros sin field_name después de la migración', records_without_field_name;
  ELSE
    RAISE NOTICE 'Éxito: Todos los % registros tienen field_name asignado', total_records;
  END IF;
END $$;

-- Verificar que las columnas legacy fueron eliminadas
DO $$
DECLARE
  old_status_exists BOOLEAN;
  new_status_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_audit_logs' AND column_name = 'old_status'
  ) INTO old_status_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_audit_logs' AND column_name = 'new_status'
  ) INTO new_status_exists;

  IF old_status_exists OR new_status_exists THEN
    RAISE WARNING 'Advertencia: Columnas legacy aún existen';
  ELSE
    RAISE NOTICE 'Éxito: Columnas legacy (old_status, new_status) eliminadas correctamente';
  END IF;
END $$;

-- ============================================================================
-- 7. INFORMACIÓN DE LA MIGRACIÓN
-- ============================================================================

-- Mostrar resumen de registros por tipo
DO $$
DECLARE
  total_records INTEGER;
  status_changes INTEGER;
  field_edits INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_records FROM service_audit_logs;
  SELECT COUNT(*) INTO status_changes FROM service_audit_logs WHERE field_name = 'status';
  SELECT COUNT(*) INTO field_edits FROM service_audit_logs WHERE change_type = 'field_edit';

  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Migración 003 completada exitosamente';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Total de registros: %', total_records;
  RAISE NOTICE 'Cambios de estado (field_name=status): %', status_changes;
  RAISE NOTICE 'Ediciones de campo (change_type=field_edit): %', field_edits;
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Columnas agregadas: old_value, new_value, field_name, field_label';
  RAISE NOTICE 'Columnas eliminadas: old_status, new_status';
  RAISE NOTICE 'Índices creados: 3 índices para optimización';
  RAISE NOTICE '=======================================================';
END $$;

COMMIT;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- - Las columnas old_status y new_status fueron eliminadas
-- - Todo el código debe usar old_value/new_value, field_name/field_label
-- - Los índices mejoran significativamente el performance de queries de auditoría
-- - Diseño consistente: TODOS los registros usan field_name y field_label
-- ============================================================================
