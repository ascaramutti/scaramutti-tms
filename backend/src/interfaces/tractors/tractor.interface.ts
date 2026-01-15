export interface Tractor {
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
    status: string;
}

export interface TractorRequest {
    plate: string;
    brand?: string;
    model?: string;
    year?: number;
}