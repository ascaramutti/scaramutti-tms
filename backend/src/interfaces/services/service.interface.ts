export interface Service {
    id: number;
    client_id: number;
    client_name: string;
    origin: string;
    destination: string;
    tentative_date: Date | string;
    cargo_type_id: number;
    cargo_type_name: string;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    observations?: string;
    operational_notes: string;
    price?: number;
    currency_id?: number;
    currency_code?: string;

    driver_id?: number | null;
    driver_name?: string;

    tractor_id?: number | null;
    tractor_plate?: string;

    trailer_id?: number | null;
    trailer_plate?: string;

    status_id: number;
    status_name: string;

}

export interface CreateServiceRequest {
    clientId: number;
    origin: string;
    destination: string;
    tentativeDate: string;

    cargoTypeId: number;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    observations?: string;

    price: number;
    currencyId: number;
}

export interface AssignResourcesRequest {
    driverId: number;
    tractorId: number;
    trailerId: number;
    notes?: string;
    force?: boolean;
}