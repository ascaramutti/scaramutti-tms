import type { User } from "../interfaces/auth.interface";

/**
 * Sesión COMPARTIDA con v2 (SSO).
 *
 * Detrás del gateway las dos apps viven en el mismo origin, así que comparten
 * el localStorage. v2 es la autoridad de login: emite los tokens y los guarda
 * en estas claves (tokenStorage.ts del repo v2). v1 solo las LEE.
 * Ver docs/PLAN_UNIFICACION_SSO.md en el repo v2.
 */

// Claves espejo de v2 (frontend/src/shared/auth/tokenStorage.ts)
const ACCESS_TOKEN_KEY = "tms.accessToken";
const REFRESH_TOKEN_KEY = "tms.refreshToken";

// Login único: URL NEUTRAL propiedad del gateway (/login → 302 a donde viva
// la pantalla hoy). v1 NO conoce paths internos de v2: si el auth se extrae a
// un servicio propio, acá no cambia nada (solo el redirect del gateway).
export const LOGIN_URL = "/login";

export const sessionStore = {
    getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
    getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
    setTokens: (accessToken: string, refreshToken: string | null): void => {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    },
    clear: (): void => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        // Claves del login viejo de v1 (retirado): limpiar restos.
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },
};

/** Shape del usuario que devuelve GET /api/v1/auth/me (UserResponse de v2). */
export interface V2User {
    id: number;
    username: string;
    fullName: string;
    position?: string | null;
    role: User["role"];
    isActive: boolean;
}

/** Adapta el usuario de v2 al shape que consumen las pantallas de v1. */
export function mapV2UserToV1(v2User: V2User): User {
    return {
        id: String(v2User.id),
        username: v2User.username,
        role: v2User.role,
        name: v2User.fullName,
    };
}
