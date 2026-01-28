export interface DocumentType {
    id: number;
    code: string;
    name: string;
    description: string | null;
    max_length: number;
    validation_pattern: string | null;
    is_active: boolean;
    created_at: Date;
}

export interface Worker {
    id: number;
    first_name: string;
    last_name: string;
    document_type_id: number;
    document_type_code?: string;
    document_type_name?: string;
    document_number: string;
    phone: string | null;
    position: string;
    is_active: boolean;
    created_at: Date;
}

export interface CreateWorkerRequest {
    firstName: string;
    lastName: string;
    documentTypeId: number;
    documentNumber: string;
    phone?: string;
    position: string;
}
