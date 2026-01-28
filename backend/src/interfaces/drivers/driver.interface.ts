export interface Driver {
    id: number;
    name: string;
    phone: string | null;
    license_number: string;
    status: string;
    document_type_id?: number;
    document_type_code?: string;
    document_number?: string;
}

export interface CreateDriverRequest {
    firstName: string;
    lastName: string;
    documentTypeId: number;
    documentNumber: string;
    phone?: string;
    licenseNumber: string;
    category?: string;
}