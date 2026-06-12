export interface User {
    id: string;
    username: string;
    role: 'admin' | 'general_manager' | 'operations_manager' | 'dispatcher' | 'sales';
    name: string;
}

// El login vive en v2 (SSO): acá ya no hay login(credentials), solo logout.
// La sesión se hidrata desde el localStorage compartido + GET /api/v1/auth/me.
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
}
