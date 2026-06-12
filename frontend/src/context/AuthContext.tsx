import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, AuthContextType } from "../interfaces/auth.interface";
import { v2Api } from "../services/api";
import { sessionStore, mapV2UserToV1, LOGIN_URL, type V2User } from "../services/session";

/**
 * Sesión unificada con v2 (SSO): el login vive en v2 (/cotizaciones/login).
 * Acá solo se LEE la sesión compartida: token de localStorage (claves tms.*)
 * + GET /api/v1/auth/me para hidratar el usuario. Ver services/session.ts.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: {children: ReactNode}) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSession = async () => {
            if (!sessionStore.getAccessToken()) {
                // Sin sesión: ProtectedRoute manda al login de v2.
                setIsLoading(false);
                return;
            }
            try {
                // v2Api trae el shim de refresh: si el access token expiró,
                // renueva solo y reintenta. Si el refresh también falla, el
                // interceptor limpia y redirige al login de v2.
                const response = await v2Api.get<V2User>('/auth/me');
                setUser(mapV2UserToV1(response.data));
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, []);

    const logout = () => {
        sessionStore.clear();
        setUser(null);
        // El login único vive en v2 (otra SPA): full page load.
        window.location.href = LOGIN_URL;
    }

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if(context === undefined) {
        throw new Error ('useAuth must be used within AuthProvider');
    }
    return context;
}
