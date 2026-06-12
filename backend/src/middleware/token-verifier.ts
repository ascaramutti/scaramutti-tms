import jwt from "jsonwebtoken";
import fs from "fs";
import { TokenPayload } from "../interfaces/auth/auth.interface";

/**
 * Verificación de tokens con soporte dual para la unificación con v2 (SSO).
 *
 * Modos (env var AUTH_MODE):
 * - 'legacy' (default): solo tokens HS256 emitidos por este backend (comportamiento histórico).
 * - 'dual':   acepta tokens RS256 emitidos por v2 Y tokens HS256 legacy (transición).
 * - 'rs256':  solo tokens RS256 de v2 (estado final; el login local queda retirado).
 *
 * V2 (Quarkus) firma con RS256: acá solo se necesita la CLAVE PÚBLICA
 * (env var JWT_PUBLIC_KEY_PATH), que no permite emitir tokens, solo verificarlos.
 * Ver docs/PLAN_UNIFICACION_SSO.md en el repo v2.
 */

export type AuthMode = "legacy" | "dual" | "rs256";

// Deben coincidir con la emisión de v2 (application.properties del backend Quarkus).
const V2_ISSUER = "scaramutti-tms";
const V2_AUDIENCE = "scaramutti-tms-app";

/** Claims del access token de v2 (TokenService.java). */
interface V2AccessTokenPayload {
    sub?: string;       // id del usuario
    upn?: string;       // username
    groups?: string[];  // [rol]
    typ?: string;       // 'access' | 'refresh'
}

let cachedPublicKey: string | null = null;

export const getAuthMode = (): AuthMode => {
    const mode = process.env.AUTH_MODE;
    if (mode === "dual" || mode === "rs256") return mode;
    return "legacy";
};

/** Solo para tests: invalida el cache de la clave pública. */
export const resetPublicKeyCache = (): void => {
    cachedPublicKey = null;
};

const getV2PublicKey = (): string => {
    if (cachedPublicKey === null) {
        const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;
        if (!publicKeyPath) {
            throw new Error("JWT_PUBLIC_KEY_PATH is not set (required for AUTH_MODE=dual|rs256)");
        }
        cachedPublicKey = fs.readFileSync(publicKeyPath, "utf8");
    }
    return cachedPublicKey;
};

/** Verifica un token RS256 de v2 y lo adapta al payload que usa v1. */
const verifyV2Token = (token: string): TokenPayload => {
    const decoded = jwt.verify(token, getV2PublicKey(), {
        algorithms: ["RS256"],
        issuer: V2_ISSUER,
        audience: V2_AUDIENCE,
    }) as V2AccessTokenPayload;

    // El refresh token de v2 también es RS256 con mismo iss/aud: distinguir por typ.
    if (decoded.typ !== "access") {
        throw new Error("Not an access token");
    }

    const role = Array.isArray(decoded.groups) ? decoded.groups[0] : undefined;
    if (!decoded.sub || !decoded.upn || !role) {
        throw new Error("Missing required claims (sub/upn/groups)");
    }

    // Adapter de claims v2 → shape histórico de v1. El sub debe ser numérico
    // (id de public.users); un NaN truthy no debe llegar a req.user.
    const userId = Number(decoded.sub);
    if (!Number.isInteger(userId)) {
        throw new Error("Invalid sub claim (not a numeric user id)");
    }
    return { id: userId, username: decoded.upn, role };
};

/** Verifica un token HS256 legacy emitido por este backend. */
const verifyLegacyToken = (token: string): TokenPayload => {
    const secret: string = process.env.JWT_SECRET!;
    return jwt.verify(token, secret, { algorithms: ["HS256"] }) as TokenPayload;
};

// En dual, una clave mal configurada degrada silenciosamente a legacy:
// avisar UNA vez en los logs para que el misconfig no pase desapercibido.
let warnedKeyMisconfig = false;
const warnIfKeyMisconfig = (error: unknown): void => {
    if (warnedKeyMisconfig || !(error instanceof Error)) return;
    if (/JWT_PUBLIC_KEY_PATH|ENOENT|EACCES|EISDIR/.test(error.message)) {
        console.warn(`[token-verifier] AUTH_MODE=dual pero la clave pública de v2 no está disponible — los tokens de v2 serán rechazados: ${error.message}`);
        warnedKeyMisconfig = true;
    }
};

/** Solo para tests: re-habilita el warning de misconfig. */
export const resetMisconfigWarning = (): void => {
    warnedKeyMisconfig = false;
};

/**
 * Punto de entrada único del middleware: verifica según AUTH_MODE.
 * En 'dual' intenta primero v2 (RS256) y cae a legacy (HS256) si falla.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
    const mode = getAuthMode();
    if (mode === "legacy") return verifyLegacyToken(token);
    if (mode === "rs256") return verifyV2Token(token);
    try {
        return verifyV2Token(token);
    } catch (error) {
        warnIfKeyMisconfig(error);
        return verifyLegacyToken(token);
    }
};
