import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { generateKeyPairSync } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { validateToken, authorizeRoles } from "../auth.middleware";
import { AuthenticatedRequest } from "../../interfaces/auth/auth.interface";
import { resetPublicKeyCache } from "../token-verifier";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

let publicKeyPath: string;
const originalEnv = { ...process.env };

function buildRequest(authorization?: string): Request {
    return { headers: { authorization } } as unknown as Request;
}

function buildResponse(): Response {
    const res = {
        status: vi.fn(),
        json: vi.fn(),
    } as unknown as Response;
    (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
    return res;
}

function signV2AccessToken(): string {
    return jwt.sign(
        { sub: "7", upn: "lcampos", groups: ["sales"], typ: "access" },
        privateKey,
        {
            algorithm: "RS256",
            issuer: "scaramutti-tms",
            audience: "scaramutti-tms-app",
            expiresIn: "1h",
        },
    );
}

beforeAll(() => {
    publicKeyPath = path.join(os.tmpdir(), `v2-mw-publickey-${process.pid}.pem`);
    fs.writeFileSync(publicKeyPath, publicKey);
});

afterAll(() => {
    fs.rmSync(publicKeyPath, { force: true });
    process.env = originalEnv;
});

beforeEach(() => {
    resetPublicKeyCache();
    process.env.AUTH_MODE = "dual";
    process.env.JWT_SECRET = "legacy-test-secret";
    process.env.JWT_PUBLIC_KEY_PATH = publicKeyPath;
});

describe("validateToken", () => {
    it("sin header Authorization responde 401", () => {
        const req = buildRequest();
        const res = buildResponse();
        const next = vi.fn();

        validateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("token inválido responde 403", () => {
        const req = buildRequest("Bearer not-a-token");
        const res = buildResponse();
        const next = vi.fn();

        validateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it("token de v2 válido (dual) setea req.user con el shape de v1 y llama next", () => {
        const req = buildRequest(`Bearer ${signV2AccessToken()}`);
        const res = buildResponse();
        const next = vi.fn();

        validateToken(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect((req as AuthenticatedRequest).user).toEqual({
            id: 7,
            username: "lcampos",
            role: "sales",
        });
    });

    it("token legacy HS256 sigue funcionando en dual (sin regresión)", () => {
        const legacy = jwt.sign(
            { id: 3, username: "jdiaz", role: "dispatcher" },
            "legacy-test-secret",
            { expiresIn: "4h" },
        );
        const req = buildRequest(`Bearer ${legacy}`);
        const res = buildResponse();
        const next = vi.fn();

        validateToken(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect((req as AuthenticatedRequest).user).toMatchObject({
            id: 3,
            username: "jdiaz",
            role: "dispatcher",
        });
    });
});

describe("authorizeRoles", () => {
    it("permite el acceso si el rol (mapeado desde un token v2) está autorizado", () => {
        const req = buildRequest(`Bearer ${signV2AccessToken()}`);
        const res = buildResponse();
        validateToken(req, res, vi.fn());

        const next = vi.fn();
        authorizeRoles(["sales", "admin"])(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });

    it("rechaza con 403 si el rol no está autorizado", () => {
        const req = buildRequest(`Bearer ${signV2AccessToken()}`);
        const res = buildResponse();
        validateToken(req, res, vi.fn());

        const next = vi.fn();
        authorizeRoles(["admin"])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
