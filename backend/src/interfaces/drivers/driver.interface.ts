export interface Driver {
    id: number;
    name: string;
    phone: string | null;
    license_number: string;
    status: string;
}

export interface CreateDriverRequest {
    firstName: string;
    lastName: string;
    dni: string;
    phone?: string;
    licenseNumber: string;
    category?: string;
}