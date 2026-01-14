import { Request } from "express";

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

export interface TokenPayload {
    id: number;
    username: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}