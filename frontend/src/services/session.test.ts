import { describe, it, expect, beforeEach, vi } from "vitest";
import { sessionStore, mapV2UserToV1, LOGIN_URL, CHANGE_PASSWORD_URL, type V2User } from "./session";

// Stub mínimo de localStorage (los tests corren en node, sin DOM).
function createLocalStorageStub() {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
        clear: () => store.clear(),
    };
}

beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageStub());
});

describe("sessionStore (claves compartidas con v2)", () => {
    it("lee el access token de la clave tms.accessToken (la que escribe v2)", () => {
        localStorage.setItem("tms.accessToken", "abc");
        expect(sessionStore.getAccessToken()).toBe("abc");
    });

    it("setTokens guarda access y refresh en las claves tms.*", () => {
        sessionStore.setTokens("acc-1", "ref-1");
        expect(localStorage.getItem("tms.accessToken")).toBe("acc-1");
        expect(localStorage.getItem("tms.refreshToken")).toBe("ref-1");
    });

    it("setTokens sin refresh conserva el refresh anterior", () => {
        sessionStore.setTokens("acc-1", "ref-1");
        sessionStore.setTokens("acc-2", null);
        expect(localStorage.getItem("tms.accessToken")).toBe("acc-2");
        expect(localStorage.getItem("tms.refreshToken")).toBe("ref-1");
    });

    it("clear limpia las claves nuevas Y los restos del login viejo de v1", () => {
        sessionStore.setTokens("acc", "ref");
        localStorage.setItem("token", "legacy-token");
        localStorage.setItem("user", "{}");

        sessionStore.clear();

        expect(sessionStore.getAccessToken()).toBeNull();
        expect(sessionStore.getRefreshToken()).toBeNull();
        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("user")).toBeNull();
    });
});

describe("mapV2UserToV1", () => {
    it("adapta el UserResponse de v2 al shape de v1", () => {
        const v2User: V2User = {
            id: 7,
            username: "lcampos",
            fullName: "Luis Campos",
            position: "Ventas",
            role: "sales",
            isActive: true,
        };
        expect(mapV2UserToV1(v2User)).toEqual({
            id: "7",
            username: "lcampos",
            role: "sales",
            name: "Luis Campos",
        });
    });
});

describe("LOGIN_URL", () => {
    it("es la URL NEUTRAL del gateway (no conoce paths internos de v2)", () => {
        expect(LOGIN_URL).toBe("/login");
    });
});

describe("CHANGE_PASSWORD_URL", () => {
    it("apunta a la pantalla de v2 (única accesible para todos los roles)", () => {
        expect(CHANGE_PASSWORD_URL).toBe("/cotizaciones/cuenta/cambiar-contrasena");
    });
});
