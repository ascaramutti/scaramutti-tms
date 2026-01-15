export interface Trailer {
    id: number;
    plate: string;
    type: string | null;
    status: string;
}

export interface TrailerRequest {
    plate: string;
    type?: string;
}