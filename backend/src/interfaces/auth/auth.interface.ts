export interface User {
    id: number;
    username: string;
    role: string;
    role_description: string;
    password_hash: string;
    worker_id: number;
    name: string;
}

export interface AuthRequest {
    username: string;
    password?: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
        role: string;
        role_description: string;
        name: string;
    }
}