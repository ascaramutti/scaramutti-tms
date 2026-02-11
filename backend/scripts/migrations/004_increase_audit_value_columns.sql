-- ============================================================================
-- Migración 004: Aumentar tamaño de columnas old_value y new_value
-- US-004: Editar Información de Servicios con Justificación
-- ============================================================================
-- Descripción:
--   Aumenta el tamaño de las columnas old_value y new_value en
--   service_audit_logs de VARCHAR(50) a VARCHAR(255) para soportar:
--   - Timestamps completos con zona horaria
--   - Textos largos de observaciones
--   - Otros valores que excedan 50 caracteres
--
-- Problema detectado:
--   Al guardar auditoría de campos como startDateTime, endDateTime,
--   observations, etc., los valores convertidos a string exceden 50 caracteres
--   causando error: "value too long for type character varying(50)"
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. AUMENTAR TAMAÑO DE COLUMNAS
-- ============================================================================

ALTER TABLE service_audit_logs
  ALTER COLUMN old_value TYPE VARCHAR(255),
  ALTER COLUMN new_value TYPE VARCHAR(255);

-- ============================================================================
-- 2. VERIFICACIÓN
-- ============================================================================

DO $$
DECLARE
  old_value_length INTEGER;
  new_value_length INTEGER;
BEGIN
  SELECT character_maximum_length INTO old_value_length
  FROM information_schema.columns
  WHERE table_name = 'service_audit_logs' AND column_name = 'old_value';

  SELECT character_maximum_length INTO new_value_length
  FROM information_schema.columns
  WHERE table_name = 'service_audit_logs' AND column_name = 'new_value';

  IF old_value_length = 255 AND new_value_length = 255 THEN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Migración 004 completada exitosamente';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Columna old_value: VARCHAR(50) → VARCHAR(255)';
    RAISE NOTICE 'Columna new_value: VARCHAR(50) → VARCHAR(255)';
    RAISE NOTICE '=======================================================';
  ELSE
    RAISE WARNING 'Advertencia: Las columnas no tienen el tamaño esperado';
    RAISE WARNING 'old_value: %, new_value: %', old_value_length, new_value_length;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- - VARCHAR(255) es suficiente para timestamps, textos medianos, y valores comunes
-- - Si en el futuro se necesitan valores más largos (ej: JSON), considerar TEXT
-- - No hay pérdida de datos en esta migración (solo se amplía el límite)
-- ============================================================================
