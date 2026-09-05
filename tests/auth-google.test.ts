import { describe, expect, it, vi } from "vitest";
import {
  authorizeUrl, decodeJwtPayload, exchangeCode, GOOGLE_TOKEN_URL, GoogleAuthError, googleConfig, pkceChallenge,
  randomToken, redirectUri, validateIdTokenClaims,
} from "@/lib/auth/google";

const clientId = "123-abc.apps.googleusercontent.com";

function fakeIdToken(claims: Record<string, unknown>) {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "RS256", typ: "JWT" })}.${part(claims)}.signature`;
}

const validClaims = {
  iss: "https://accounts.google.com", aud: clientId, sub: "10769150350006150715113082367",
  email: "Reader@Example.com", email_verified: true, name: "  သီရိ  ", exp: 1_800_000_000, iat: 1_799_990_000,
};

describe("googleConfig", () => {
  it("returns null unless client id, secret, and session secret are all present", () => {
    expect(googleConfig({})).toBeNull();
    expect(googleConfig({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b" })).toBeNull();
    expect(googleConfig({ GOOGLE_CLIENT_ID: " a ", GOOGLE_CLIENT_SECRET: "b", SESSION_SECRET: "c" })).toEqual({
      clientId: "a", clientSecret: "b", sessionSecret: "c", redirectUriOverride: null,
    });
    expect(googleConfig({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b", SESSION_SECRET: "c", GOOGLE_REDIRECT_URI: "https://x/cb" })!.redirectUriOverride).toBe("https://x/cb");
  });
});

describe("redirectUri", () => {
  it("derives the callback from the request origin unless overridden", () => {
    expect(redirectUri("https://suriya.example/auth/google/start?return_to=%2F", null)).toBe("https://suriya.example/auth/google/callback");
    expect(redirectUri("http://localhost:3000/auth/google/start", "https://prod.example/auth/google/callback")).toBe("https://prod.example/auth/google/callback");
  });
});

describe("pkce", () => {
  it("matches the RFC 7636 S256 test vector", async () => {
    await expect(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).resolves.toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("generates url-safe random tokens of the expected length", () => {
    const token = randomToken(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken(32)).not.toBe(token);
  });
});

describe("authorizeUrl", () => {
  it("includes every required parameter", () => {
    const url = new URL(authorizeUrl({ clientId, redirectUri: "https://s.example/auth/google/callback", state: "st", codeChallenge: "ch" }));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: clientId, redirect_uri: "https://s.example/auth/google/callback", response_type: "code",
      scope: "openid email profile", state: "st", code_challenge: "ch", code_challenge_method: "S256",
      prompt: "select_account", access_type: "online",
    });
  });
});

describe("validateIdTokenClaims", () => {
  const now = 1_799_999_000 * 1000;

  it("accepts a valid token and normalises email and name", () => {
    expect(validateIdTokenClaims(fakeIdToken(validClaims), { clientId, now })).toEqual({
      sub: validClaims.sub, email: "reader@example.com", name: "သီရိ",
    });
    expect(validateIdTokenClaims(fakeIdToken({ ...validClaims, iss: "accounts.google.com", name: undefined }), { clientId, now })!.name).toBeNull();
  });

  it("rejects wrong issuer, audience, expiry, unverified email, and missing subject", () => {
    for (const bad of [
      { iss: "https://evil.example" }, { aud: "other-client" }, { exp: 1_799_998_000 }, { email_verified: false },
      { email_verified: "true" }, { sub: "" }, { email: undefined },
    ]) {
      expect(validateIdTokenClaims(fakeIdToken({ ...validClaims, ...bad }), { clientId, now })).toBeNull();
    }
  });

  it("rejects malformed tokens", () => {
    expect(validateIdTokenClaims("nope", { clientId, now })).toBeNull();
    expect(validateIdTokenClaims("a.b", { clientId, now })).toBeNull();
    expect(decodeJwtPayload("a.!!!.c")).toBeNull();
  });
});

describe("exchangeCode", () => {
  const input = { code: "code", verifier: "ver", redirectUri: "https://s.example/auth/google/callback", clientId, clientSecret: "secret" };

  it("posts the form-encoded exchange and returns the id_token", async () => {
    const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe(GOOGLE_TOKEN_URL);
      expect(init?.method).toBe("POST");
      const body = new URLSearchParams(String(init?.body));
      expect(Object.fromEntries(body)).toEqual({
        code: "code", client_id: clientId, client_secret: "secret", redirect_uri: input.redirectUri,
        grant_type: "authorization_code", code_verifier: "ver",
      });
      return Response.json({ id_token: "tok", access_token: "acc" });
    }) as unknown as typeof fetch;
    await expect(exchangeCode(input, fetchImpl)).resolves.toBe("tok");
  });

  it("throws exchange_failed on non-200 or a missing id_token", async () => {
    const failing = (async () => new Response("bad", { status: 400 })) as unknown as typeof fetch;
    await expect(exchangeCode(input, failing)).rejects.toBeInstanceOf(GoogleAuthError);
    const empty = (async () => Response.json({})) as unknown as typeof fetch;
    await expect(exchangeCode(input, empty)).rejects.toMatchObject({ code: "exchange_failed" });
  });
});
