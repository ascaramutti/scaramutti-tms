-- ==========================================
-- Migración 001: Crear tabla service_assignments
-- ==========================================
-- Fecha: 2026-02-05
-- Descripción: Permite agregar unidades adicionales (tractores, trailers, conductores)
--              a servicios que ya están en ejecución
-- Issue: US-003
-- ==========================================

-- Crear tabla service_assignments (solo si no existe)
CREATE TABLE IF NOT EXISTS service_assignments (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  truck_id INTEGER REFERENCES tractors(id),
  trailer_id INTEGER REFERENCES trailers(id),
  driver_id INTEGER REFERENCES drivers(id),
  notes TEXT NOT NULL,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: al menos UNA unidad debe estar presente
  CONSTRAINT at_least_one_unit CHECK (
    truck_id IS NOT NULL OR
    trailer_id IS NOT NULL OR
    driver_id IS NOT NULL
  )
);

-- Crear índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_service_assignments_service_id ON service_assignments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_truck_id ON service_assignments(truck_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_trailer_id ON service_assignments(trailer_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_driver_id ON service_assignments(driver_id);

-- Verificación: Mostrar estructura de la tabla creada
\d service_assignments

-- Fin de la migración 001
