export interface LoginCredentials {
    username: string;
    password: string;
}

export interface User {
    id: string;
    username: string;
    role: 'admin' | 'general_manager' | 'operations_manager' | 'dispatcher' | 'sales';
    name: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
}
