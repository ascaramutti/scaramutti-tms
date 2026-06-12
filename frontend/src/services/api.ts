import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { sessionStore, V2_LOGIN_URL } from './session';

/**
 * Clientes HTTP con sesión compartida v1+v2 (SSO).
 *
 * - `api`: el API propio de v1 (baseURL VITE_API_URL = /api).
 * - `v2Api`: el API de v2 (/api/v1) — se usa para /auth/me y /auth/refresh.
 *
 * Ambos llevan el access token de v2 y el shim de refresh: ante 401/403 se
 * intenta UNA renovación (/api/v1/auth/refresh) y se reintenta el request.
 * Espejo del interceptor de v2 (frontend/src/shared/http/client.ts).
 */

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
    _retried?: boolean;
}

interface RefreshResponse {
    token: string;
    refreshToken?: string | null;
}

// Single-flight: si varios requests reciben 401/403 a la vez, UN solo refresh.
let refreshInFlight: Promise<string> | null = null;

const redirectToLogin = (): void => {
    sessionStore.clear();
    window.location.href = V2_LOGIN_URL;
};

const refreshTokens = async (): Promise<string> => {
    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            const refreshToken = sessionStore.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token');
            }
            // axios "crudo" a propósito: el refresh no debe pasar por estos
            // interceptores (evita recursión).
            const response = await axios.post<RefreshResponse>('/api/v1/auth/refresh', { refreshToken });
            sessionStore.setTokens(response.data.token, response.data.refreshToken ?? null);
            return response.data.token;
        })().finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
};

const applyAuthInterceptors = (instance: AxiosInstance): void => {
    instance.interceptors.request.use(
        (config) => {
            const token = sessionStore.getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error),
    );

    instance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const status = error.response?.status;
            const config = error.config as RetriableRequestConfig | undefined;

            // El backend v1 responde 401 (sin token) y 403 (token inválido/expirado
            // o permisos insuficientes); el de v2, 401. En cualquiera: refrescar
            // UNA vez y reintentar.
            if ((status === 401 || status === 403) && config && !config._retried) {
                config._retried = true;

                let newToken: string;
                try {
                    newToken = await refreshTokens();
                } catch (refreshError) {
                    // Solo un refresh DEFINITIVAMENTE inválido mata la sesión:
                    // sin refresh token, o 4xx del endpoint. Un fallo transitorio
                    // (red caída, 5xx) NO desloguea — se rechaza y el usuario
                    // puede reintentar sin perder la sesión.
                    const refreshStatus = axios.isAxiosError(refreshError)
                        ? refreshError.response?.status
                        : undefined;
                    const sessionIsDead =
                        !axios.isAxiosError(refreshError) ||
                        (refreshStatus !== undefined && refreshStatus >= 400 && refreshStatus < 500);
                    if (sessionIsDead) {
                        redirectToLogin();
                    }
                    return Promise.reject(error);
                }

                // El retry va FUERA del try del refresh: si vuelve a fallar
                // (ej. 403 de permisos con sesión válida), se rechaza normal —
                // no es un problema de sesión y NO debe expulsar al usuario.
                config.headers.Authorization = `Bearer ${newToken}`;
                return instance.request(config);
            }

            return Promise.reject(error);
        },
    );
};

const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
applyAuthInterceptors(api);

/** Cliente del API de v2 (auth/me, etc.) con los mismos interceptores. */
export const v2Api: AxiosInstance = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});
applyAuthInterceptors(v2Api);

export default api;
