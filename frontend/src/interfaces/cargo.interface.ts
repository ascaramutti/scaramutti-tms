export interface CargoType {
    id: number;
    name: string;
    description?: string;
    standard_weight: number;
    standard_length?: number;
    standard_width?: number;
    standard_height?: number;
    is_active: boolean;
}

export interface CargoTypeResponse {
    status: string;
    data: CargoType[];
}