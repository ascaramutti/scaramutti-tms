import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import jwt from "jsonwebtoken";
import { generateKeyPairSync } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import {
    verifyAccessToken,
    getAuthMode,
    resetPublicKeyCache,
    resetMisconfigWarning,
} from "../token-verifier";

// Claves RSA generadas en el test (NUNCA claves reales).
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
// Segundo par para simular un emisor NO confiable (firma inválida).
const { privateKey: rogueKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const LEGACY_SECRET = "legacy-test-secret";
const V2_ISSUER = "scaramutti-tms";
const V2_AUDIENCE = "scaramutti-tms-app";

let publicKeyPath: string;
const originalEnv = { ...process.env };

/** Token con la forma exacta que emite v2 (TokenService.java). */
function signV2Token(
    overrides: Record<string, unknown> = {},
    options: jwt.SignOptions = {},
    key: string = privateKey,
): string {
    const payload = {
        sub: "7",
        upn: "lcampos",
        groups: ["sales"],
        fullName: "Luis Campos",
        typ: "access",
        ...overrides,
    };
    return jwt.sign(payload, key, {
        algorithm: "RS256",
        issuer: V2_ISSUER,
        audience: V2_AUDIENCE,
        expiresIn: "1h",
        ...options,
    });
}

function signLegacyToken(payload: Record<string, unknown> = {}): string {
    return jwt.sign(
        { id: 3, username: "jdiaz", role: "dispatcher", ...payload },
        LEGACY_SECRET,
        { expiresIn: "4h" },
    );
}

beforeAll(() => {
    publicKeyPath = path.join(os.tmpdir(), `v2-test-publickey-${process.pid}.pem`);
    fs.writeFileSync(publicKeyPath, publicKey);
});

afterAll(() => {
    fs.rmSync(publicKeyPath, { force: true });
    process.env = originalEnv;
});

beforeEach(() => {
    resetPublicKeyCache();
    process.env.JWT_SECRET = LEGACY_SECRET;
    process.env.JWT_PUBLIC_KEY_PATH = publicKeyPath;
});

describe("getAuthMode", () => {
    it("default (sin AUTH_MODE) es legacy — preserva el comportamiento histórico", () => {
        delete process.env.AUTH_MODE;
        expect(getAuthMode()).toBe("legacy");
    });

    it("valores desconocidos caen a legacy (fail-safe)", () => {
        process.env.AUTH_MODE = "banana";
        expect(getAuthMode()).toBe("legacy");
    });

    it("reconoce dual y rs256", () => {
        process.env.AUTH_MODE = "dual";
        expect(getAuthMode()).toBe("dual");
        process.env.AUTH_MODE = "rs256";
        expect(getAuthMode()).toBe("rs256");
    });
});

describe("verifyAccessToken - modo dual", () => {
    beforeEach(() => {
        process.env.AUTH_MODE = "dual";
    });

    it("acepta un access token de v2 y adapta los claims al shape de v1", () => {
        const user = verifyAccessToken(signV2Token());
        expect(user).toEqual({ id: 7, username: "lcampos", role: "sales" });
    });

    it("acepta también un token legacy HS256 (transición)", () => {
        const user = verifyAccessToken(signLegacyToken());
        expect(user).toMatchObject({ id: 3, username: "jdiaz", role: "dispatcher" });
    });

    it("rechaza el refresh token de v2 (typ != access)", () => {
        expect(() => verifyAccessToken(signV2Token({ typ: "refresh" }))).toThrow();
    });

    it("rechaza un token RS256 con issuer incorrecto", () => {
        expect(() =>
            verifyAccessToken(signV2Token({}, { issuer: "otro-emisor" })),
        ).toThrow();
    });

    it("rechaza un token RS256 con audience incorrecta", () => {
        expect(() =>
            verifyAccessToken(signV2Token({}, { audience: "otra-app" })),
        ).toThrow();
    });

    it("rechaza un token de v2 expirado", () => {
        expect(() =>
            verifyAccessToken(signV2Token({}, { expiresIn: "-10s" })),
        ).toThrow();
    });

    it("rechaza un token firmado con OTRA clave RSA (emisor no confiable)", () => {
        expect(() => verifyAccessToken(signV2Token({}, {}, rogueKey))).toThrow();
    });

    it("rechaza un token de v2 sin groups (claims incompletos)", () => {
        expect(() => verifyAccessToken(signV2Token({ groups: undefined }))).toThrow();
    });

    it("rechaza un token de v2 sin sub", () => {
        expect(() => verifyAccessToken(signV2Token({ sub: undefined }))).toThrow();
    });

    it("rechaza un token de v2 con groups vacío", () => {
        expect(() => verifyAccessToken(signV2Token({ groups: [] }))).toThrow();
    });

    it("rechaza un token de v2 con sub no numérico (no llega NaN a req.user)", () => {
        expect(() => verifyAccessToken(signV2Token({ sub: "no-numerico" }))).toThrow();
    });

    it("rechaza alg confusion: HS256 firmado con el PEM público como secreto HMAC", () => {
        const forged = jwt.sign(
            { sub: "7", upn: "atacante", groups: ["admin"], typ: "access" },
            publicKey, // la clave pública es conocible: NO debe servir para firmar
            { algorithm: "HS256", issuer: V2_ISSUER, audience: V2_AUDIENCE, expiresIn: "1h" },
        );
        expect(() => verifyAccessToken(forged)).toThrow();
    });

    it("con la clave pública mal configurada cae a legacy y avisa por consola (una vez)", () => {
        delete process.env.JWT_PUBLIC_KEY_PATH;
        resetPublicKeyCache();
        resetMisconfigWarning();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        // El token legacy sigue funcionando (no se corta el servicio)...
        const user = verifyAccessToken(signLegacyToken());
        expect(user).toMatchObject({ id: 3, username: "jdiaz", role: "dispatcher" });
        // ...pero el misconfig queda visible en los logs (una sola vez).
        expect(warnSpy).toHaveBeenCalledOnce();
        expect(String(warnSpy.mock.calls[0][0])).toMatch(/JWT_PUBLIC_KEY_PATH/);

        verifyAccessToken(signLegacyToken());
        expect(warnSpy).toHaveBeenCalledOnce();
        warnSpy.mockRestore();
    });
});

describe("verifyAccessToken - modo legacy (default)", () => {
    beforeEach(() => {
        delete process.env.AUTH_MODE;
    });

    it("acepta el token HS256 propio", () => {
        const user = verifyAccessToken(signLegacyToken());
        expect(user).toMatchObject({ id: 3, username: "jdiaz", role: "dispatcher" });
    });

    it("rechaza un token de v2 (no se valida RS256 en legacy)", () => {
        expect(() => verifyAccessToken(signV2Token())).toThrow();
    });
});

describe("verifyAccessToken - modo rs256 (estado final)", () => {
    beforeEach(() => {
        process.env.AUTH_MODE = "rs256";
    });

    it("acepta solo tokens de v2", () => {
        const user = verifyAccessToken(signV2Token());
        expect(user).toEqual({ id: 7, username: "lcampos", role: "sales" });
    });

    it("rechaza el token HS256 legacy (queda retirado)", () => {
        expect(() => verifyAccessToken(signLegacyToken())).toThrow();
    });

    it("falla con error claro si JWT_PUBLIC_KEY_PATH no está configurada", () => {
        delete process.env.JWT_PUBLIC_KEY_PATH;
        resetPublicKeyCache();
        expect(() => verifyAccessToken(signV2Token())).toThrow(/JWT_PUBLIC_KEY_PATH/);
    });
});
