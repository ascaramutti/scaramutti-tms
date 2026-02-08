/**
 * Service Assignments Interfaces
 * US-003: Agregar Unidades Adicionales a Servicio en Ejecución
 */

/**
 * Representa una asignación adicional de recursos a un servicio en ejecución
 * Almacena el registro tal como está en la base de datos
 */
export interface ServiceAssignment {
  id: number;
  serviceId: number;
  truckId?: number;
  trailerId?: number;
  driverId?: number;
  notes: string;
  assignedBy: number;
  assignedAt: Date;
}

/**
 * DTO para crear una nueva asignación adicional
 * Usado en el endpoint POST /api/services/:id/assignments
 */
export interface CreateServiceAssignmentDTO {
  truckId?: number;
  trailerId?: number;
  driverId?: number;
  notes: string;
  force?: boolean; // Si true, ignora validaciones de conflictos
}

/**
 * Respuesta enriquecida con datos populados de otras tablas
 * Incluye información completa de unidades, usuario asignador, etc.
 * Usado en el endpoint GET /api/services/:id/assignments
 */
export interface ServiceAssignmentResponse {
  id: number;
  serviceId: number;
  truck?: {
    id: number;
    plate: string;
    model: string;
  };
  trailer?: {
    id: number;
    plate: string;
    type: string;
  };
  driver?: {
    id: number;
    name: string;
  };
  notes: string;
  assignedBy: {
    id: number;
    name: string;
  };
  assignedAt: string; // ISO 8601 string para JSON response
}

/**
 * Respuesta de conflicto cuando una unidad ya está asignada
 * Usado cuando el backend retorna 409 Conflict
 */
export interface ConflictResponse {
  status: 'WARNING';
  message: string; // Mensaje detallado con los conflictos detectados
}
