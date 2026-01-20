import api from "./api";
import type { LoginCredentials, AuthResponse } from "../interfaces/auth.interface";

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('auth/login', credentials);
        return response.data;
    }
};