/**
 * Asignación adicional de recursos a un servicio
 * (para incluir en la respuesta de Service)
 */
export interface AdditionalAssignment {
    id: number;
    truck?: { id: number; plate: string; model: string } | null;
    trailer?: { id: number; plate: string; type: string } | null;
    driver?: { id: number; name: string } | null;
    notes: string;
    assignedBy: { id: number; name: string };
    assignedAt: string;
}

export interface Service {
    id: number;
    client_id: number;
    client_name?: string;
    client_ruc: string;
    origin: string;
    destination: string;
    tentative_date: string;
    service_type_id: number;
    service_type_name: string;
    cargo_type_id: number;
    cargo_type_name: string;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    observations?: string;
    operational_notes?: string;
    start_date_time?: string;
    end_date_time?: string;
    price: number;
    currency_id: number;
    currency_code: string;
    status_id: number;
    status_name: string;
    driver_id?: number | null;
    driver_name?: string;
    tractor_id?: number | null;
    tractor_plate?: string;
    trailer_id?: number | null;
    trailer_plate?: string;

    // US-003: Asignaciones adicionales (recursos agregados durante la ejecución)
    additionalAssignments?: AdditionalAssignment[];
    additionalAssignmentsCount?: number; // Contador para listados
}

export interface CreateServiceRequest {
    clientId: number;
    origin: string;
    destination: string;
    tentativeDate: string;
    serviceTypeId: number;
    cargoTypeId: number;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    observations?: string;
    price: number;
    currencyId: number;
}

export interface AssignResourcesPayload {
    driverId: number;
    tractorId: number;
    trailerId?: number;
    notes?: string;
    force?: boolean;
}

export interface AddServiceAssignmentPayload {
    truckId?: number;
    trailerId?: number;
    driverId?: number;
    notes: string;
    force?: boolean;
}

export interface ChangeStatusPayload {
    status: string;
    notes?: string;
    date?: string;
}

export interface ServiceResponse<T = Service> {
    status: string;
    message?: string;
    data: T;
}