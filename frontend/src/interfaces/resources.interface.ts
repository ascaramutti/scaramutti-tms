export interface Driver {
    id: number;
    worker_id: number;
    license_category: string;
    license_number: string;
    name: string;
}
export interface Tractor {
    id: number;
    plate: string;
    brand: string;
    model: string;
    status: string;
}
export interface Trailer {
    id: number;
    plate: string;
    type: string;
    status: string;
}