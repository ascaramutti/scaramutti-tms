export interface CargoType {
    id: number;
    name: string;
    description: string | null;
    standard_weight: number;
    standard_length: number | null;
    standard_width: number | null;
    standard_height: number | null;
    is_active: boolean;
    created_at: Date;
}

export interface CargoTypeRequest {
    name: string;
    description?: string;
    standardWeight: number;  // Now required
    standardLength?: number;
    standardWidth?: number;
    standardHeight?: number;
}