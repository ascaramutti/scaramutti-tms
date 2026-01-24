export interface Client {
    id: number;
    name: string;
    ruc: string;
    phone?: string;
    contact_name?: string;
    is_active: boolean;
}

export interface ClientResponse {
    status: string;
    data: Client[];
}