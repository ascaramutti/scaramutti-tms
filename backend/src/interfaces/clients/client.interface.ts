export interface Client {
    id: number;
    name: string;
    ruc: string;
    phone: string | null;
    address: string | null;
    contact_name: string | null;
    is_active: boolean;
    created_at: Date;
}

export interface ClientRequest {
    name: string;
    ruc: string;
    phone?: string;
    address?: string;
    contactName?: string;
}