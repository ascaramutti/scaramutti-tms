/**
 * Service Assignments Service
 * US-003: Agregar Unidades Adicionales a Servicio en Ejecución
 *
 * Lógica de negocio para asignaciones adicionales de recursos
 */

import { query } from '../config/db';

/**
 * Información de conflicto cuando una unidad ya está asignada
 */
interface ConflictInfo {
  service_id: number;
  resource_identifier: string; // Placa del vehículo o nombre del conductor
  status_name: string;
}

/**
 * Verifica si un tracto ya está asignado a otro servicio activo
 *
 * Busca en:
 * - services.tractor_id (asignación inicial)
 * - service_assignments.truck_id (asignaciones adicionales)
 *
 * Solo considera servicios con status:
 * - 2: pending_start
 * - 3: in_progress
 *
 * @param truckId - ID del tracto a verificar
 * @param currentServiceId - ID del servicio actual (para excluirlo de la búsqueda)
 * @returns Información del conflicto si existe, null si está disponible
 */
export const checkTruckConflict = async (
  truckId: number,
  currentServiceId: number
): Promise<ConflictInfo | null> => {
  const conflictQuery = `
    SELECT
      s.id as service_id,
      t.plate as resource_identifier,
      ss.name as status_name
    FROM (
      -- Asignaciones iniciales en tabla services
      SELECT s.id, s.tractor_id as truck_id, s.status_id
      FROM services s
      WHERE s.tractor_id = $1
        AND s.status_id IN (2, 3)
        AND s.id != $2

      UNION

      -- Asignaciones adicionales en tabla service_assignments
      SELECT sa.service_id as id, sa.truck_id, s.status_id
      FROM service_assignments sa
      JOIN services s ON sa.service_id = s.id
      WHERE sa.truck_id = $1
        AND s.status_id IN (2, 3)
        AND sa.service_id != $2
    ) AS busy
    JOIN services s ON busy.id = s.id
    JOIN tractors t ON busy.truck_id = t.id
    JOIN service_statuses ss ON s.status_id = ss.id
    LIMIT 1
  `;

  const result = await query<ConflictInfo>(conflictQuery, [truckId, currentServiceId]);

  return result.rows[0] ?? null;
};

/**
 * Verifica si un trailer ya está asignado a otro servicio activo
 *
 * Busca en:
 * - services.trailer_id (asignación inicial)
 * - service_assignments.trailer_id (asignaciones adicionales)
 *
 * Solo considera servicios con status:
 * - 2: pending_start
 * - 3: in_progress
 *
 * @param trailerId - ID del trailer a verificar
 * @param currentServiceId - ID del servicio actual (para excluirlo de la búsqueda)
 * @returns Información del conflicto si existe, null si está disponible
 */
export const checkTrailerConflict = async (
  trailerId: number,
  currentServiceId: number
): Promise<ConflictInfo | null> => {
  const conflictQuery = `
    SELECT
      s.id as service_id,
      tr.plate as resource_identifier,
      ss.name as status_name
    FROM (
      -- Asignaciones iniciales en tabla services
      SELECT s.id, s.trailer_id, s.status_id
      FROM services s
      WHERE s.trailer_id = $1
        AND s.status_id IN (2, 3)
        AND s.id != $2

      UNION

      -- Asignaciones adicionales en tabla service_assignments
      SELECT sa.service_id as id, sa.trailer_id, s.status_id
      FROM service_assignments sa
      JOIN services s ON sa.service_id = s.id
      WHERE sa.trailer_id = $1
        AND s.status_id IN (2, 3)
        AND sa.service_id != $2
    ) AS busy
    JOIN services s ON busy.id = s.id
    JOIN trailers tr ON busy.trailer_id = tr.id
    JOIN service_statuses ss ON s.status_id = ss.id
    LIMIT 1
  `;

  const result = await query<ConflictInfo>(conflictQuery, [trailerId, currentServiceId]);

  return result.rows[0] ?? null;
};

/**
 * Verifica si un conductor ya está asignado a otro servicio activo
 *
 * Busca en:
 * - services.driver_id (asignación inicial)
 * - service_assignments.driver_id (asignaciones adicionales)
 *
 * Solo considera servicios con status:
 * - 2: pending_start
 * - 3: in_progress
 *
 * @param driverId - ID del conductor a verificar
 * @param currentServiceId - ID del servicio actual (para excluirlo de la búsqueda)
 * @returns Información del conflicto si existe, null si está disponible
 */
export const checkDriverConflict = async (
  driverId: number,
  currentServiceId: number
): Promise<ConflictInfo | null> => {
  const conflictQuery = `
    SELECT
      s.id as service_id,
      w.first_name || ' ' || w.last_name as resource_identifier,
      ss.name as status_name
    FROM (
      -- Asignaciones iniciales en tabla services
      SELECT s.id, s.driver_id, s.status_id
      FROM services s
      WHERE s.driver_id = $1
        AND s.status_id IN (2, 3)
        AND s.id != $2

      UNION

      -- Asignaciones adicionales en tabla service_assignments
      SELECT sa.service_id as id, sa.driver_id, s.status_id
      FROM service_assignments sa
      JOIN services s ON sa.service_id = s.id
      WHERE sa.driver_id = $1
        AND s.status_id IN (2, 3)
        AND sa.service_id != $2
    ) AS busy
    JOIN services s ON busy.id = s.id
    JOIN drivers d ON busy.driver_id = d.id
    JOIN workers w ON d.worker_id = w.id
    JOIN service_statuses ss ON s.status_id = ss.id
    LIMIT 1
  `;

  const result = await query<ConflictInfo>(conflictQuery, [driverId, currentServiceId]);

  return result.rows[0] ?? null;
};

/**
 * Verifica si un recurso ya está asignado al mismo servicio
 * (previene duplicados en asignaciones adicionales)
 */
export const checkDuplicateInSameService = async (
  truckId: number | undefined,
  trailerId: number | undefined,
  driverId: number | undefined,
  serviceId: number
): Promise<string[]> => {
  const duplicates: string[] = [];

  // Verificar en asignación inicial (tabla services)
  const initialAssignmentQuery = `
    SELECT
      s.tractor_id,
      s.trailer_id,
      s.driver_id,
      t.plate as tractor_plate,
      tr.plate as trailer_plate,
      w.first_name || ' ' || w.last_name as driver_name
    FROM services s
    LEFT JOIN tractors t ON s.tractor_id = t.id
    LEFT JOIN trailers tr ON s.trailer_id = tr.id
    LEFT JOIN drivers d ON s.driver_id = d.id
    LEFT JOIN workers w ON d.worker_id = w.id
    WHERE s.id = $1
  `;

  const initialResult = await query(initialAssignmentQuery, [serviceId]);
  const initial = initialResult.rows[0];

  if (initial) {
    if (truckId && initial.tractor_id === truckId) {
      duplicates.push(`El tracto ${initial.tractor_plate} ya está asignado a este servicio (asignación inicial)`);
    }
    if (trailerId && initial.trailer_id === trailerId) {
      duplicates.push(`El trailer ${initial.trailer_plate} ya está asignado a este servicio (asignación inicial)`);
    }
    if (driverId && initial.driver_id === driverId) {
      duplicates.push(`El conductor ${initial.driver_name} ya está asignado a este servicio (asignación inicial)`);
    }
  }

  // Verificar en asignaciones adicionales previas
  const additionalAssignmentsQuery = `
    SELECT
      sa.truck_id,
      sa.trailer_id,
      sa.driver_id,
      t.plate as truck_plate,
      tr.plate as trailer_plate,
      w.first_name || ' ' || w.last_name as driver_name
    FROM service_assignments sa
    LEFT JOIN tractors t ON sa.truck_id = t.id
    LEFT JOIN trailers tr ON sa.trailer_id = tr.id
    LEFT JOIN drivers d ON sa.driver_id = d.id
    LEFT JOIN workers w ON d.worker_id = w.id
    WHERE sa.service_id = $1
  `;

  const additionalResult = await query(additionalAssignmentsQuery, [serviceId]);

  for (const row of additionalResult.rows) {
    if (truckId && row.truck_id === truckId) {
      duplicates.push(`El tracto ${row.truck_plate} ya fue agregado previamente a este servicio`);
    }
    if (trailerId && row.trailer_id === trailerId) {
      duplicates.push(`El trailer ${row.trailer_plate} ya fue agregado previamente a este servicio`);
    }
    if (driverId && row.driver_id === driverId) {
      duplicates.push(`El conductor ${row.driver_name} ya fue agregado previamente a este servicio`);
    }
  }

  return duplicates;
};

/**
 * Verifica conflictos con otros servicios activos
 * (NO incluye duplicados en el mismo servicio - esos se manejan por separado)
 *
 * @param truckId - ID del tracto (opcional)
 * @param trailerId - ID del trailer (opcional)
 * @param driverId - ID del conductor (opcional)
 * @param serviceId - ID del servicio actual
 * @returns Array de mensajes de conflicto (vacío si no hay conflictos)
 */
export const checkAllConflicts = async (
  truckId: number | undefined,
  trailerId: number | undefined,
  driverId: number | undefined,
  serviceId: number
): Promise<string[]> => {
  const conflicts: string[] = [];

  // Verificar conflicto de tracto
  if (truckId) {
    const truckConflict = await checkTruckConflict(truckId, serviceId);
    if (truckConflict) {
      conflicts.push(
        `El tracto ${truckConflict.resource_identifier} ya está asignado al servicio #${truckConflict.service_id} (${truckConflict.status_name})`
      );
    }
  }

  // Verificar conflicto de trailer
  if (trailerId) {
    const trailerConflict = await checkTrailerConflict(trailerId, serviceId);
    if (trailerConflict) {
      conflicts.push(
        `El trailer ${trailerConflict.resource_identifier} ya está asignado al servicio #${trailerConflict.service_id} (${trailerConflict.status_name})`
      );
    }
  }

  // Verificar conflicto de conductor
  if (driverId) {
    const driverConflict = await checkDriverConflict(driverId, serviceId);
    if (driverConflict) {
      conflicts.push(
        `El conductor ${driverConflict.resource_identifier} ya está asignado al servicio #${driverConflict.service_id} (${driverConflict.status_name})`
      );
    }
  }

  return conflicts;
};
