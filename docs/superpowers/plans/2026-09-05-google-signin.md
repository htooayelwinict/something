# Google Sign-in (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace "Sign in with ChatGPT" with Google OAuth as the single sign-in for every Suriya account, adopting existing ChatGPT profiles by verified email.

**Architecture:** A pure `lib/auth/` layer (HMAC-signed cookies, PKCE/OAuth builders, claim validation, profile-resolution decision) is exercised by three thin route handlers under `app/auth/`. `getCurrentUser()` reads only the signed session cookie; every former `getChatGPTUser` call site swaps imports. Migration `0004` adds `auth_provider`/`auth_subject` to `profiles` so Google accounts and adopted legacy rows share one identity key.

**Tech Stack:** vinext 1.0.0-beta.2 (Next app router on Cloudflare Workers), React 19, TypeScript 5.9, Drizzle + D1, Zod 4, Vitest 4, node:test rendered-HTML suite, Web Crypto (HMAC-SHA256, SHA-256), Python Playwright audit.

**Spec:** `docs/superpowers/specs/2026-09-05-google-signin-and-studio-dashboard-design.md` (Phase A section)

## Global Constraints

- All user-facing copy is Burmese; technical labels (Google, OAuth, IANA) stay Latin.
- Cookies: `suriya_session` (30 days) and `suriya_oauth` (10 minutes), both `Path=/; HttpOnly; Secure; SameSite=Lax`.
- Session payload carries identity only (`uid`, `email`, `name`) — never a role.
- Secrets `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` are read server-side only via `process.env`.
- `return_to` must be a relative path, never `//…`, never `/auth/*`, never `/login`.
- ID-token claims required: `iss ∈ {https://accounts.google.com, accounts.google.com}`, `aud === GOOGLE_CLIENT_ID`, `exp` in the future, `email_verified === true`, non-empty `sub` and `email`.
- Do not touch the untracked user files `untitled.pen`, `zartar-home-desktop.png`, `zartar-home-mobile.png`. Never read `.env`, `.env.local`, or `.wrangler`.
- Do not push or deploy. Work on branch `feat/google-signin-studio`; merge to `main` locally at the end.
- Commit trailer on every commit:
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii`.
- Gates before merge: `npm run lint`, `npm run test:unit`, `npm run build`, `node --test tests/rendered-html.test.mjs`.

## File Structure

| file | responsibility |
| --- | --- |
| `lib/auth/session.ts` | base64url helpers, HMAC sign/verify of JSON payloads, session/OAuth cookie constants, cookie parse/serialize |
| `lib/auth/paths.ts` | client-safe path helpers: `safeRelativeReturnPath`, `loginPath`, `signOutPath`, `googleStartPath` (no server imports) |
| `lib/auth/google.ts` | env config, redirect URI, PKCE, authorize URL, code exchange (fetch injected), ID-token claim validation |
| `lib/auth/profile-resolution.ts` | pure decision: update / adopt / create for a Google identity |
| `lib/auth/responses.ts` | `redirectWithCookies(location, cookies)` helper for route handlers |
| `lib/auth/current-user.ts` | `AppUser`, `getCurrentUser()` (cookie → user), `requireUser(returnTo)` (server-only) |
| `app/auth/google/start/route.ts` | begins the OAuth flow |
| `app/auth/google/callback/route.ts` | completes it, sets the session |
| `app/auth/signout/route.ts` | clears the session |
| `db/schema.ts`, `drizzle/0004_*.sql`, `db/initialize.ts`, `lib/ids.ts` | identity columns, backfill, indexes, `usr` id prefix |
| `db/repositories/profiles.ts` | `findOrCreateGoogleProfile`, `upsertProfile` typed on `AppUser` |
| `app/login/page.tsx` | single Google button + error notices |
| call sites | import swap `getChatGPTUser` → `getCurrentUser`, `requireChatGPTUser` → `requireUser`, sign-in/out paths |
| `tests/*.test.ts`, `tests/rendered-html.test.mjs` | unit + rendered coverage |
| `README.md`, `.env.example` | documentation |

---

### Task 1: Signed cookies (`lib/auth/session.ts`)

**Files:**
- Create: `lib/auth/session.ts`
- Test: `tests/auth-session.test.ts`

**Interfaces:**
- Produces:
  - `base64UrlEncode(bytes: Uint8Array): string`, `base64UrlDecode(value: string): Uint8Array | null`
  - `signValue(payload: unknown, secret: string): Promise<string>`, `verifyValue<T>(value: string | null | undefined, secret: string): Promise<T | null>`
  - `createSessionCookieValue(user: { uid: string; email: string; name: string | null }, secret: string, now?: number): Promise<string>`
  - `verifySessionCookieValue(value, secret, now?): Promise<SessionPayload | null>`
  - `parseCookies(header: string | null | undefined): Map<string, string>`
  - `serializeCookie(name: string, value: string, maxAgeSeconds: number): string`, `clearCookie(name: string): string`
  - constants `SESSION_COOKIE = "suriya_session"`, `OAUTH_COOKIE = "suriya_oauth"`, `SESSION_MAX_AGE_SECONDS = 2592000`, `OAUTH_MAX_AGE_SECONDS = 600`
  - types `SessionPayload = { v: 1; uid: string; email: string; name: string | null; iat: number; exp: number }`, `OAuthPayload = { state: string; verifier: string; returnTo: string; exp: number }`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/auth-session.test.ts
import { describe, expect, it } from "vitest";
import {
  base64UrlDecode, base64UrlEncode, clearCookie, createSessionCookieValue, OAUTH_COOKIE, parseCookies,
  serializeCookie, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signValue, verifySessionCookieValue, verifyValue,
} from "@/lib/auth/session";

const secret = "test-secret-please-rotate";

describe("base64url", () => {
  it("round-trips bytes without padding characters", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const encoded = base64UrlEncode(bytes);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(Array.from(base64UrlDecode(encoded) ?? [])).toEqual(Array.from(bytes));
  });

  it("rejects characters outside the alphabet", () => {
    expect(base64UrlDecode("abc+/=")).toBeNull();
  });
});

describe("signValue / verifyValue", () => {
  it("verifies its own signature and returns the payload", async () => {
    const value = await signValue({ hello: "မင်္ဂလာပါ" }, secret);
    expect(value.split(".")).toHaveLength(2);
    await expect(verifyValue<{ hello: string }>(value, secret)).resolves.toEqual({ hello: "မင်္ဂလာပါ" });
  });

  it("rejects a tampered payload", async () => {
    const value = await signValue({ uid: "a" }, secret);
    const [, signature] = value.split(".");
    const forged = `${base64UrlEncode(new TextEncoder().encode(JSON.stringify({ uid: "b" })))}.${signature}`;
    await expect(verifyValue(forged, secret)).resolves.toBeNull();
  });

  it("rejects a tampered signature, a different secret, and malformed input", async () => {
    const value = await signValue({ uid: "a" }, secret);
    const [body, signature] = value.split(".");
    const flipped = `${body}.${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;
    await expect(verifyValue(flipped, secret)).resolves.toBeNull();
    await expect(verifyValue(value, "other-secret")).resolves.toBeNull();
    await expect(verifyValue("not-a-cookie", secret)).resolves.toBeNull();
    await expect(verifyValue("", secret)).resolves.toBeNull();
    await expect(verifyValue(null, secret)).resolves.toBeNull();
  });
});

describe("session cookie", () => {
  it("creates a 30-day session and verifies it before expiry", async () => {
    const now = Date.parse("2026-09-05T00:00:00Z");
    const value = await createSessionCookieValue({ uid: "usr_1", email: "a@example.com", name: "အေး" }, secret, now);
    const payload = await verifySessionCookieValue(value, secret, now + 1000);
    expect(payload).toMatchObject({ v: 1, uid: "usr_1", email: "a@example.com", name: "အေး" });
    expect(payload!.exp - payload!.iat).toBe(SESSION_MAX_AGE_SECONDS);
  });

  it("rejects an expired session", async () => {
    const now = Date.parse("2026-09-05T00:00:00Z");
    const value = await createSessionCookieValue({ uid: "usr_1", email: "a@example.com", name: null }, secret, now);
    await expect(verifySessionCookieValue(value, secret, now + SESSION_MAX_AGE_SECONDS * 1000 + 1)).resolves.toBeNull();
  });

  it("rejects payloads that are signed but not sessions", async () => {
    const value = await signValue({ state: "x" }, secret);
    await expect(verifySessionCookieValue(value, secret)).resolves.toBeNull();
  });
});

describe("cookie header helpers", () => {
  it("parses a cookie header and ignores malformed parts", () => {
    const cookies = parseCookies(`${SESSION_COOKIE}=abc.def; other=1; broken; ${OAUTH_COOKIE}=x.y`);
    expect(cookies.get(SESSION_COOKIE)).toBe("abc.def");
    expect(cookies.get(OAUTH_COOKIE)).toBe("x.y");
    expect(cookies.get("broken")).toBeUndefined();
    expect(parseCookies(null).size).toBe(0);
  });

  it("serialises hardened cookies and clears them with Max-Age=0", () => {
    expect(serializeCookie("a", "b", 60)).toBe("a=b; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=60");
    expect(clearCookie("a")).toBe("a=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/auth-session.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/session`.

- [ ] **Step 3: Implement `lib/auth/session.ts`**

```ts
export const SESSION_COOKIE = "suriya_session";
export const OAUTH_COOKIE = "suriya_oauth";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const OAUTH_MAX_AGE_SECONDS = 10 * 60;

export type SessionPayload = { v: 1; uid: string; email: string; name: string | null; iat: number; exp: number };
export type OAuthPayload = { state: string; verifier: string; returnTo: string; exp: number };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function hmacKey(secret: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
}

export async function signValue(payload: unknown, secret: string): Promise<string> {
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  return `${body}.${base64UrlEncode(signature)}`;
}

export async function verifyValue<T>(value: string | null | undefined, secret: string): Promise<T | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const signatureBytes = base64UrlDecode(signature);
  const bodyBytes = base64UrlDecode(body);
  if (!signatureBytes || !bodyBytes || signatureBytes.length !== 32) return null;
  const key = await hmacKey(secret, ["verify"]);
  if (!(await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(body)))) return null;
  try {
    return JSON.parse(decoder.decode(bodyBytes)) as T;
  } catch {
    return null;
  }
}

export async function createSessionCookieValue(
  user: { uid: string; email: string; name: string | null },
  secret: string,
  now = Date.now(),
): Promise<string> {
  const iat = Math.floor(now / 1000);
  const payload: SessionPayload = { v: 1, uid: user.uid, email: user.email, name: user.name, iat, exp: iat + SESSION_MAX_AGE_SECONDS };
  return signValue(payload, secret);
}

export async function verifySessionCookieValue(
  value: string | null | undefined,
  secret: string,
  now = Date.now(),
): Promise<SessionPayload | null> {
  const payload = await verifyValue<Partial<SessionPayload>>(value, secret);
  if (!payload || payload.v !== 1 || typeof payload.uid !== "string" || typeof payload.email !== "string") return null;
  if (typeof payload.iat !== "number" || typeof payload.exp !== "number" || payload.exp * 1000 <= now) return null;
  return { v: 1, uid: payload.uid, email: payload.email, name: typeof payload.name === "string" ? payload.name : null, iat: payload.iat, exp: payload.exp };
}

export function parseCookies(header: string | null | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    if (name) cookies.set(name, part.slice(index + 1).trim());
  }
  return cookies;
}

export function serializeCookie(name: string, value: string, maxAgeSeconds: number): string {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearCookie(name: string): string {
  return serializeCookie(name, "", 0);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/auth-session.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/session.ts tests/auth-session.test.ts
git commit -m "feat(auth): signed session cookie helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 2: Return paths and link helpers (`lib/auth/paths.ts`)

**Files:**
- Create: `lib/auth/paths.ts`
- Test: `tests/auth-paths.test.ts`

**Interfaces:**
- Produces: `safeRelativeReturnPath(value: string | null | undefined): string`, `loginPath(returnTo: string): string`, `signOutPath(returnTo?: string): string`, `googleStartPath(returnTo: string): string`. This module has no server-only imports so client components may import it.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/auth-paths.test.ts
import { describe, expect, it } from "vitest";
import { googleStartPath, loginPath, safeRelativeReturnPath, signOutPath } from "@/lib/auth/paths";

describe("safeRelativeReturnPath", () => {
  it("keeps relative paths with query and hash", () => {
    expect(safeRelativeReturnPath("/tarot/thiri?x=1#booking")).toBe("/tarot/thiri?x=1#booking");
  });

  it("falls back to / for absolute, protocol-relative, empty, and reserved paths", () => {
    for (const bad of ["https://evil.example/", "//evil.example", "", null, undefined, "profile", "/auth/google/start", "/auth/signout", "/login", "/login?return_to=/x"]) {
      expect(safeRelativeReturnPath(bad)).toBe("/");
    }
  });

  it("keeps paths that merely start with the letters auth", () => {
    expect(safeRelativeReturnPath("/authors")).toBe("/authors");
  });
});

describe("link helpers", () => {
  it("builds login, sign-out, and google start links with encoded return paths", () => {
    expect(loginPath("/readings")).toBe("/login?return_to=%2Freadings");
    expect(signOutPath()).toBe("/auth/signout?return_to=%2F");
    expect(googleStartPath("/daily/week")).toBe("/auth/google/start?return_to=%2Fdaily%2Fweek");
    expect(loginPath("//evil.example")).toBe("/login?return_to=%2F");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/auth-paths.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/paths`.

- [ ] **Step 3: Implement `lib/auth/paths.ts`**

```ts
const RESERVED_PREFIX = "/auth/";

export function safeRelativeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (url.pathname.startsWith(RESERVED_PREFIX) || url.pathname === "/login") return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

export function loginPath(returnTo: string): string {
  return `/login?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function signOutPath(returnTo = "/"): string {
  return `/auth/signout?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function googleStartPath(returnTo: string): string {
  return `/auth/google/start?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/auth-paths.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/paths.ts tests/auth-paths.test.ts
git commit -m "feat(auth): safe return paths and sign-in link helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 3: Google OAuth helpers (`lib/auth/google.ts`)

**Files:**
- Create: `lib/auth/google.ts`
- Test: `tests/auth-google.test.ts`

**Interfaces:**
- Consumes: `base64UrlEncode`, `base64UrlDecode` from Task 1.
- Produces:
  - `googleConfig(env?: Record<string, string | undefined>): GoogleConfig | null` where `GoogleConfig = { clientId; clientSecret; sessionSecret; redirectUriOverride: string | null }`
  - `redirectUri(requestUrl: string, override: string | null): string`
  - `randomToken(bytes?: number): string`, `pkceChallenge(verifier: string): Promise<string>`
  - `authorizeUrl(input: { clientId; redirectUri; state; codeChallenge }): string`
  - `decodeJwtPayload(token: string): Record<string, unknown> | null`
  - `validateIdTokenClaims(idToken: string, options: { clientId: string; now?: number }): GoogleIdentity | null` where `GoogleIdentity = { sub: string; email: string; name: string | null }` (email lower-cased)
  - `exchangeCode(input: { code; verifier; redirectUri; clientId; clientSecret }, fetchImpl?: typeof fetch): Promise<string>` (returns the raw `id_token`), throwing `GoogleAuthError("exchange_failed")`
  - constants `GOOGLE_AUTHORIZE_URL`, `GOOGLE_TOKEN_URL`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/auth-google.test.ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/auth-google.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/google`.

- [ ] **Step 3: Implement `lib/auth/google.ts`**

```ts
import { base64UrlDecode, base64UrlEncode } from "./session";

export const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

export type GoogleConfig = { clientId: string; clientSecret: string; sessionSecret: string; redirectUriOverride: string | null };
export type GoogleIdentity = { sub: string; email: string; name: string | null };

export class GoogleAuthError extends Error {
  constructor(public readonly code: "exchange_failed") {
    super(code);
    this.name = "GoogleAuthError";
  }
}

export function googleConfig(env: Record<string, string | undefined> = process.env): GoogleConfig | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const sessionSecret = env.SESSION_SECRET?.trim();
  if (!clientId || !clientSecret || !sessionSecret) return null;
  return { clientId, clientSecret, sessionSecret, redirectUriOverride: env.GOOGLE_REDIRECT_URI?.trim() || null };
}

export function redirectUri(requestUrl: string, override: string | null): string {
  return override ?? new URL("/auth/google/callback", requestUrl).toString();
}

export function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return base64UrlEncode(buffer);
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

export function authorizeUrl(input: { clientId: string; redirectUri: string; state: string; codeChallenge: string }): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("access_type", "online");
  return url.toString();
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const bytes = base64UrlDecode(parts[1]);
  if (!bytes) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The token arrives straight from Google's token endpoint over TLS, so only the claims are checked, not the signature. */
export function validateIdTokenClaims(idToken: string, options: { clientId: string; now?: number }): GoogleIdentity | null {
  const claims = decodeJwtPayload(idToken);
  if (!claims) return null;
  const now = options.now ?? Date.now();
  if (typeof claims.iss !== "string" || !GOOGLE_ISSUERS.has(claims.iss)) return null;
  if (claims.aud !== options.clientId) return null;
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now) return null;
  if (claims.email_verified !== true) return null;
  if (typeof claims.sub !== "string" || !claims.sub || typeof claims.email !== "string" || !claims.email) return null;
  const name = typeof claims.name === "string" ? claims.name.trim() : "";
  return { sub: claims.sub, email: claims.email.trim().toLowerCase(), name: name || null };
}

export async function exchangeCode(
  input: { code: string; verifier: string; redirectUri: string; clientId: string; clientSecret: string },
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const body = new URLSearchParams({
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
    code_verifier: input.verifier,
  });
  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: body.toString(),
  });
  if (!response.ok) throw new GoogleAuthError("exchange_failed");
  const data = (await response.json().catch(() => null)) as { id_token?: unknown } | null;
  if (!data || typeof data.id_token !== "string" || !data.id_token) throw new GoogleAuthError("exchange_failed");
  return data.id_token;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/auth-google.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/google.ts tests/auth-google.test.ts
git commit -m "feat(auth): google oauth builders and id-token claim validation

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 4: Identity columns, migration, and profile resolution

**Files:**
- Create: `lib/auth/profile-resolution.ts`
- Modify: `db/schema.ts:9-15`, `db/initialize.ts`, `lib/ids.ts`, `db/repositories/profiles.ts`
- Create (generated): `drizzle/0004_<generated-slug>.sql` + `drizzle/meta/0004_snapshot.json` + journal entry
- Test: `tests/profile-resolution.test.ts`, `tests/ids.test.ts` (extend)

**Interfaces:**
- Produces:
  - `resolveGoogleProfile(input: GoogleProfileInput, existing: { bySubject: ProfileLike | null; legacyByEmail: ProfileLike | null }): ProfileResolution`
    with `ProfileLike = { id: string; authProvider: "chatgpt" | "google"; authSubject: string | null }`,
    `GoogleProfileInput = { sub: string; email: string; name: string | null }`, and
    `ProfileResolution = { action: "update"; id; displayName; email } | { action: "adopt"; id; authSubject; displayName; email } | { action: "create"; authSubject; displayName; email }`
  - `findOrCreateGoogleProfile(identity: GoogleProfileInput): Promise<ProfileRow>` in `db/repositories/profiles.ts`
  - `profiles` columns `authProvider`, `authSubject`; `ProfileRow` type; `newId("usr")`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/profile-resolution.test.ts
import { describe, expect, it } from "vitest";
import { resolveGoogleProfile } from "@/lib/auth/profile-resolution";

const identity = { sub: "sub-1", email: "reader@example.com", name: "သီရိ" };

describe("resolveGoogleProfile", () => {
  it("updates the existing google row when the subject matches", () => {
    expect(resolveGoogleProfile(identity, {
      bySubject: { id: "usr_a", authProvider: "google", authSubject: "sub-1" },
      legacyByEmail: { id: "legacy", authProvider: "chatgpt", authSubject: "legacy" },
    })).toEqual({ action: "update", id: "usr_a", displayName: "သီရိ", email: "reader@example.com" });
  });

  it("adopts a legacy chatgpt row with the same email, keeping its id", () => {
    expect(resolveGoogleProfile(identity, {
      bySubject: null,
      legacyByEmail: { id: "user-chatgpt-9", authProvider: "chatgpt", authSubject: "user-chatgpt-9" },
    })).toEqual({ action: "adopt", id: "user-chatgpt-9", authSubject: "sub-1", displayName: "သီရိ", email: "reader@example.com" });
  });

  it("creates a new row otherwise and falls back to the email as display name", () => {
    expect(resolveGoogleProfile({ ...identity, name: null }, { bySubject: null, legacyByEmail: null }))
      .toEqual({ action: "create", authSubject: "sub-1", displayName: "reader@example.com", email: "reader@example.com" });
  });

  it("never adopts a row that already belongs to another google subject", () => {
    expect(resolveGoogleProfile(identity, {
      bySubject: null,
      legacyByEmail: { id: "usr_other", authProvider: "google", authSubject: "sub-2" },
    }).action).toBe("create");
  });
});
```

Append to `tests/ids.test.ts` (inside its existing `describe`, matching the file's style):

```ts
  it("accepts the usr prefix for google-created profiles", () => {
    expect(newId("usr")).toMatch(/^usr_[0-9a-z]{13}_[0-9a-f]{18}$/);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/profile-resolution.test.ts tests/ids.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/profile-resolution`; `newId("usr")` throws "Invalid ID prefix" (also a TypeScript error on the union).

- [ ] **Step 3: Implement the pure resolution and the id prefix**

`lib/auth/profile-resolution.ts`:

```ts
export type ProfileLike = { id: string; authProvider: "chatgpt" | "google"; authSubject: string | null };
export type GoogleProfileInput = { sub: string; email: string; name: string | null };

export type ProfileResolution =
  | { action: "update"; id: string; displayName: string; email: string }
  | { action: "adopt"; id: string; authSubject: string; displayName: string; email: string }
  | { action: "create"; authSubject: string; displayName: string; email: string };

export function resolveGoogleProfile(
  input: GoogleProfileInput,
  existing: { bySubject: ProfileLike | null; legacyByEmail: ProfileLike | null },
): ProfileResolution {
  const displayName = input.name ?? input.email;
  if (existing.bySubject) return { action: "update", id: existing.bySubject.id, displayName, email: input.email };
  if (existing.legacyByEmail?.authProvider === "chatgpt") {
    return { action: "adopt", id: existing.legacyByEmail.id, authSubject: input.sub, displayName, email: input.email };
  }
  return { action: "create", authSubject: input.sub, displayName, email: input.email };
}
```

`lib/ids.ts` — add `"usr"` to both the `allowedPrefixes` set and the parameter union:

```ts
const allowedPrefixes = new Set(["bpr", "rdg", "tsp", "bkg", "prd", "usr"]);
// ...
export function newId(prefix: "bpr" | "rdg" | "tsp" | "bkg" | "prd" | "usr"): string {
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/profile-resolution.test.ts tests/ids.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the identity columns to the schema**

Replace the `profiles` table in `db/schema.ts`:

```ts
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  locale: text("locale").notNull().default("my"),
  authProvider: text("auth_provider", { enum: ["chatgpt", "google"] }).notNull().default("chatgpt"),
  authSubject: text("auth_subject"),
  ...timestamps,
}, (table) => [
  uniqueIndex("profiles_auth_idx").on(table.authProvider, table.authSubject),
  index("profiles_email_idx").on(table.email),
]);
```

and add next to the other row types at the bottom:

```ts
export type ProfileRow = typeof profiles.$inferSelect;
```

- [ ] **Step 6: Generate the migration and append the backfill**

Run: `npm run db:generate`
Expected: a new file `drizzle/0004_<slug>.sql` containing two `ALTER TABLE \`profiles\` ADD …` statements and the two `CREATE … INDEX` statements, plus `drizzle/meta/0004_snapshot.json` and a journal entry. If drizzle-kit asks an interactive question, answer that the columns are **new** (not renamed).

Append to the end of the generated SQL file (drizzle-kit does not write data fixes):

```sql
--> statement-breakpoint
UPDATE `profiles` SET `auth_subject` = `id` WHERE `auth_subject` IS NULL;
```

Add the matching idempotent index lines to `db/initialize.ts` inside the `db.batch([...])` array, before `PRAGMA optimize`:

```ts
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS profiles_auth_idx ON profiles(auth_provider, auth_subject)"),
    db.prepare("CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email)"),
```

- [ ] **Step 7: Add `findOrCreateGoogleProfile` to the repository**

Replace the top of `db/repositories/profiles.ts` (imports and `upsertProfile`) with:

```ts
import { and, eq, sql } from "drizzle-orm";
import type { AppUser } from "@/lib/auth/current-user";
import { resolveGoogleProfile, type GoogleProfileInput } from "@/lib/auth/profile-resolution";
import type { BirthProfileInput } from "@/lib/schemas/profile";
import { newId } from "@/lib/ids";
import { getDb } from "@/db";
import { birthProfiles, profiles } from "@/db/schema";

export async function upsertProfile(user: AppUser) {
  const db = await getDb();
  await db.insert(profiles).values({ id: user.userId, displayName: user.displayName, email: user.email })
    .onConflictDoUpdate({ target: profiles.id, set: { displayName: user.displayName, email: user.email, updatedAt: new Date().toISOString() } });
}

/** Resolve the profile for a verified Google identity: reuse, adopt a legacy ChatGPT row by email, or create. */
export async function findOrCreateGoogleProfile(identity: GoogleProfileInput) {
  const db = await getDb();
  const bySubject = await db.query.profiles.findFirst({
    where: and(eq(profiles.authProvider, "google"), eq(profiles.authSubject, identity.sub)),
  });
  const legacyByEmail = bySubject ? null : await db.query.profiles.findFirst({
    where: and(eq(profiles.authProvider, "chatgpt"), sql`lower(${profiles.email}) = ${identity.email.toLowerCase()}`),
  });
  const resolution = resolveGoogleProfile(identity, { bySubject: bySubject ?? null, legacyByEmail: legacyByEmail ?? null });
  const now = new Date().toISOString();
  if (resolution.action === "create") {
    const [row] = await db.insert(profiles).values({
      id: newId("usr"), authProvider: "google", authSubject: resolution.authSubject,
      displayName: resolution.displayName, email: resolution.email, createdAt: now, updatedAt: now,
    }).returning();
    return row;
  }
  const patch = resolution.action === "adopt"
    ? { authProvider: "google" as const, authSubject: resolution.authSubject, displayName: resolution.displayName, email: resolution.email, updatedAt: now }
    : { displayName: resolution.displayName, email: resolution.email, updatedAt: now };
  const [row] = await db.update(profiles).set(patch).where(eq(profiles.id, resolution.id)).returning();
  return row;
}
```

(The `AppUser` type is created in Task 5; until then `npx tsc --noEmit` reports the missing module — that is expected and resolved by Task 5. Do not run the build gate between Tasks 4 and 5.)

- [ ] **Step 8: Run unit tests**

Run: `npx vitest run`
Expected: PASS for everything except possibly the pre-existing flaky `tests/astrology/daily-score.test.ts` band test (re-run in isolation if it fails).

- [ ] **Step 9: Commit**

```bash
git add lib/auth/profile-resolution.ts lib/ids.ts db/schema.ts db/initialize.ts db/repositories/profiles.ts drizzle tests/profile-resolution.test.ts tests/ids.test.ts
git commit -m "feat(auth): profile identity columns and google profile resolution

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 5: Current user and the three auth routes

**Files:**
- Create: `lib/auth/current-user.ts`, `lib/auth/responses.ts`, `app/auth/google/start/route.ts`, `app/auth/google/callback/route.ts`, `app/auth/signout/route.ts`
- Test: `tests/auth-responses.test.ts`

**Interfaces:**
- Consumes: Task 1 cookie helpers, Task 2 paths, Task 3 Google helpers, Task 4 `findOrCreateGoogleProfile`.
- Produces:
  - `AppUser = { userId: string; displayName: string; email: string; fullName: string | null }`
  - `getCurrentUser(): Promise<AppUser | null>`, `requireUser(returnTo: string): Promise<AppUser>`
  - `redirectWithCookies(location: string, cookies?: string[]): Response` (302, `cache-control: no-store`, one `set-cookie` header per cookie)

- [ ] **Step 1: Write the failing test for the redirect helper**

```ts
// tests/auth-responses.test.ts
import { describe, expect, it } from "vitest";
import { redirectWithCookies } from "@/lib/auth/responses";

describe("redirectWithCookies", () => {
  it("returns a no-store 302 with one set-cookie header per cookie", () => {
    const response = redirectWithCookies("/login?error=google", ["a=1; Path=/", "b=; Max-Age=0"]);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login?error=google");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.getSetCookie()).toEqual(["a=1; Path=/", "b=; Max-Age=0"]);
  });

  it("works without cookies", () => {
    expect(redirectWithCookies("/").headers.getSetCookie()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/auth-responses.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/responses`.

- [ ] **Step 3: Implement `lib/auth/responses.ts` and `lib/auth/current-user.ts`**

`lib/auth/responses.ts`:

```ts
/** 302 with cookies; `Response.redirect` is not used because its headers are immutable. */
export function redirectWithCookies(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}
```

`lib/auth/current-user.ts`:

```ts
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginPath } from "./paths";
import { parseCookies, SESSION_COOKIE, verifySessionCookieValue } from "./session";

export type AppUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) return null;
  const requestHeaders = await headers();
  const session = await verifySessionCookieValue(parseCookies(requestHeaders.get("cookie")).get(SESSION_COOKIE), secret);
  if (!session) return null;
  return { userId: session.uid, displayName: session.name ?? session.email, email: session.email, fullName: session.name };
}

export async function requireUser(returnTo: string): Promise<AppUser> {
  const user = await getCurrentUser();
  if (user) return user;
  redirect(loginPath(returnTo));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/auth-responses.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the three route handlers**

`app/auth/google/start/route.ts`:

```ts
import { authorizeUrl, googleConfig, pkceChallenge, randomToken, redirectUri } from "@/lib/auth/google";
import { safeRelativeReturnPath } from "@/lib/auth/paths";
import { redirectWithCookies } from "@/lib/auth/responses";
import { OAUTH_COOKIE, OAUTH_MAX_AGE_SECONDS, serializeCookie, signValue, type OAuthPayload } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = googleConfig();
  if (!config) return redirectWithCookies("/login?error=unconfigured");
  const url = new URL(request.url);
  const state = randomToken(16);
  const verifier = randomToken(32);
  const payload: OAuthPayload = {
    state,
    verifier,
    returnTo: safeRelativeReturnPath(url.searchParams.get("return_to")),
    exp: Math.floor(Date.now() / 1000) + OAUTH_MAX_AGE_SECONDS,
  };
  const cookie = serializeCookie(OAUTH_COOKIE, await signValue(payload, config.sessionSecret), OAUTH_MAX_AGE_SECONDS);
  const location = authorizeUrl({
    clientId: config.clientId,
    redirectUri: redirectUri(request.url, config.redirectUriOverride),
    state,
    codeChallenge: await pkceChallenge(verifier),
  });
  return redirectWithCookies(location, [cookie]);
}
```

`app/auth/google/callback/route.ts`:

```ts
import { findOrCreateGoogleProfile } from "@/db/repositories/profiles";
import { exchangeCode, googleConfig, redirectUri, validateIdTokenClaims, type GoogleIdentity } from "@/lib/auth/google";
import { safeRelativeReturnPath } from "@/lib/auth/paths";
import { redirectWithCookies } from "@/lib/auth/responses";
import {
  clearCookie, createSessionCookieValue, OAUTH_COOKIE, parseCookies, serializeCookie, SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS, verifyValue, type OAuthPayload,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = googleConfig();
  if (!config) return redirectWithCookies("/login?error=unconfigured");
  const clearOauth = clearCookie(OAUTH_COOKIE);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error") || !code || !state) return redirectWithCookies("/login?error=google", [clearOauth]);

  const stored = await verifyValue<OAuthPayload>(parseCookies(request.headers.get("cookie")).get(OAUTH_COOKIE), config.sessionSecret);
  if (!stored || stored.state !== state || typeof stored.exp !== "number" || stored.exp * 1000 <= Date.now()) {
    return redirectWithCookies("/login?error=google", [clearOauth]);
  }

  let identity: GoogleIdentity | null = null;
  try {
    const idToken = await exchangeCode({
      code,
      verifier: stored.verifier,
      redirectUri: redirectUri(request.url, config.redirectUriOverride),
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
    identity = validateIdTokenClaims(idToken, { clientId: config.clientId });
  } catch {
    identity = null;
  }
  if (!identity) return redirectWithCookies("/login?error=google", [clearOauth]);

  try {
    const profile = await findOrCreateGoogleProfile(identity);
    const session = await createSessionCookieValue({ uid: profile.id, email: profile.email, name: identity.name }, config.sessionSecret);
    return redirectWithCookies(safeRelativeReturnPath(stored.returnTo), [serializeCookie(SESSION_COOKIE, session, SESSION_MAX_AGE_SECONDS), clearOauth]);
  } catch {
    return redirectWithCookies("/login?error=service", [clearOauth]);
  }
}
```

`app/auth/signout/route.ts`:

```ts
import { safeRelativeReturnPath } from "@/lib/auth/paths";
import { redirectWithCookies } from "@/lib/auth/responses";
import { clearCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return redirectWithCookies(safeRelativeReturnPath(url.searchParams.get("return_to")), [clearCookie(SESSION_COOKIE)]);
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: the only remaining errors are in files that still import `@/app/chatgpt-auth` (fixed in Task 6). No errors under `lib/auth/`, `app/auth/`, or `db/repositories/profiles.ts`.

- [ ] **Step 7: Commit**

```bash
git add lib/auth/current-user.ts lib/auth/responses.ts app/auth tests/auth-responses.test.ts
git commit -m "feat(auth): google sign-in routes and cookie-backed current user

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 6: Replace ChatGPT sign-in everywhere

**Files:**
- Delete: `app/chatgpt-auth.ts`
- Modify: `app/login/page.tsx`, `app/profile/page.tsx`, `app/readings/page.tsx`, `app/readings/[id]/page.tsx`, `app/onboarding/page.tsx`, `app/tarot/[id]/page.tsx`, `app/api/profile/route.ts`, `app/api/bookings/route.ts`, `app/api/readings/route.ts`, `app/api/readings/[id]/feedback/route.ts`, `app/api/readings/[id]/stream/route.ts`, `lib/services/daily.ts`, `lib/services/period-reading.ts`, `components/suriya/period-page.tsx`, `tests/daily-service.test.ts`, `README.md`, `.env.example`

**Interfaces:**
- Consumes: `getCurrentUser`, `requireUser` (`@/lib/auth/current-user`); `loginPath`, `signOutPath`, `googleStartPath` (`@/lib/auth/paths`).

- [ ] **Step 1: Update the daily-service test mock so it fails against the old import**

In `tests/daily-service.test.ts` replace the hoisted mock and `vi.mock` lines:

```ts
const mocks = vi.hoisted(() => ({
  getBirthProfile: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: mocks.getCurrentUser }));
```

and every `mocks.getChatGPTUser` → `mocks.getCurrentUser` (the `beforeEach` `mockReset().mockResolvedValue({...})` block and any later `mockResolvedValue(null)` calls).

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/daily-service.test.ts`
Expected: FAIL — `lib/services/daily.ts` still calls the real `getChatGPTUser`, so the personalised expectations do not hold.

- [ ] **Step 3: Swap the service and API call sites (import + name only)**

Apply in each file:

| file | change |
| --- | --- |
| `lib/services/daily.ts:1,16` | `import { getCurrentUser } from "@/lib/auth/current-user";` · `const user = await getCurrentUser();` |
| `lib/services/period-reading.ts:1,18` | same |
| `app/api/profile/route.ts:1,13,24,38` | same (three calls) |
| `app/api/bookings/route.ts:1,29` | same |
| `app/api/readings/route.ts:1,14` | same |
| `app/api/readings/[id]/feedback/route.ts:1,11` | same |
| `app/api/readings/[id]/stream/route.ts:1,12` | same |
| `app/tarot/[id]/page.tsx:4,19` | same |
| `app/onboarding/page.tsx:2,9` | `import { requireUser } from "@/lib/auth/current-user";` · `const user = await requireUser("/onboarding");` |
| `app/readings/[id]/page.tsx:4,20` | `requireUser("/readings")` |

- [ ] **Step 4: Update the pages that render sign-in / sign-out links**

`app/readings/page.tsx` — imports become:

```ts
import { getCurrentUser } from "@/lib/auth/current-user";
import { loginPath } from "@/lib/auth/paths";
```

line 12 `const user = await getCurrentUser();` and the guest CTA:

```tsx
<a className="primary-button" href={loginPath("/readings")}>အကောင့်ဖွင့်/ဝင်ရောက်မည် (Google)</a>
```

`components/suriya/period-page.tsx` — line 2 becomes `import { loginPath } from "@/lib/auth/paths";` and line 33:

```tsx
<a className="primary-button" href={daily.user ? "/onboarding" : loginPath(path)}>{daily.user ? "မွေးဇာတာ ထည့်သွင်းရန်" : "အကောင့်ဖွင့်/ဝင်ရောက်မည် (Google)"}</a>
```

`app/profile/page.tsx` — line 3 becomes:

```ts
import { getCurrentUser } from "@/lib/auth/current-user";
import { loginPath, signOutPath } from "@/lib/auth/paths";
```

line 13 `const user = await getCurrentUser();`; the account row (line 56):

```tsx
<div className="profile-account-row"><span>အကောင့်ပိုင်ရှင် — {user.displayName} · {user.email}</span><a className="ghost-button" href={signOutPath("/")}><LogOut size={16} aria-hidden="true" /> ထွက်မည်</a></div>
```

and the guest CTA (line 59): `href={loginPath("/profile")}` with label `အကောင့်ဖွင့်/ဝင်ရောက်မည် (Google)`.

`app/login/page.tsx` — full replacement:

```tsx
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Sun } from "lucide-react";
import { Brand } from "@/components/suriya/brand";
import { googleStartPath } from "@/lib/auth/paths";

export const metadata: Metadata = { title: "ဝင်ရောက်ရန်", robots: { index: false, follow: false } };

const errorMessages: Record<string, string> = {
  unconfigured: "ဝင်ရောက်ခြင်းကို ခဏ ရပ်ထားပါသည်။ နောက်မှ ပြန်စမ်းပါ။",
  google: "Google ဖြင့် ဝင်ရောက်ခြင်း မအောင်မြင်ပါ။ ပြန်စမ်းကြည့်ပါ။",
  service: "ဝန်ဆောင်မှု ခေတ္တမရနိုင်ပါ။ ခဏနေမှ ပြန်စမ်းပါ။",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ return_to?: string; error?: string }> }) {
  const params = await searchParams;
  const returnTo = params.return_to?.startsWith("/") ? params.return_to : "/onboarding";
  const error = params.error ? errorMessages[params.error] ?? null : null;
  return (
    <main className="login-page" id="main-content">
      <div className="login-top"><Brand /></div>
      <section className="login-card">
        <span className="login-orbit"><Sun size={36} strokeWidth={1.25} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">သင့်ကိုယ်ပိုင် ကောင်းကင်အထောက်အထား</p>
          <h1>ပြန်လည်ကြိုဆိုပါတယ်</h1>
          <p><strong>သင့်မွေးချိန်အတိုင်း တွက်ချက်ပေးမည်။</strong> သင့်မွေးဇာတာနှင့် ဖတ်ကြားမှုမှတ်တမ်းကို လုံခြုံစွာ သိမ်းဆည်းပြီး မည်သည့်စက်မှမဆို ဆက်လက်ဖတ်ရှုနိုင်ပါတယ်။</p>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <a className="primary-button" href={googleStartPath(returnTo)}>Google ဖြင့် အကောင့်ဖွင့်/ဝင်ရောက်မည် <ArrowRight size={17} aria-hidden="true" /></a>
        <div className="privacy-note"><ShieldCheck size={17} aria-hidden="true" /><span>Google ၏ လုံခြုံသော အကောင့်ဝင်ခြင်းကို အသုံးပြုပါတယ်။ သင့်စကားဝှက်ကို သုရိယက မမြင်ရ၊ မသိမ်းဆည်းပါ။</span></div>
      </section>
      <p className="login-foot">ဆက်လက်ဝင်ရောက်ခြင်းဖြင့် သုရိယ၏ ကိုယ်ရေးအချက်အလက် မူဝါဒကို သဘောတူပါသည်။</p>
    </main>
  );
}
```

- [ ] **Step 5: Delete the ChatGPT module and verify nothing references it**

```bash
git rm app/chatgpt-auth.ts
grep -rn "chatgpt-auth\|getChatGPTUser\|requireChatGPTUser\|chatGPTSignInPath\|chatGPTSignOutPath\|ChatGPTUser\|signin-with-chatgpt" app lib db components tests
```

Expected: no output from `grep`.

- [ ] **Step 6: Type-check, lint, unit tests**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: clean type-check and lint; unit tests PASS (modulo the pre-existing flaky daily-score band test — re-run in isolation if it fails).

- [ ] **Step 7: Document the environment**

`.env.example` — append:

```bash
# Google sign-in (required in production; the login page shows a temporary notice without them)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Optional: override the callback URL when the request origin is not the public origin
GOOGLE_REDIRECT_URI=
# Random string (32+ chars) used to sign the session cookie
SESSION_SECRET=
# Comma-separated Gmail addresses allowed into /studio as editors
SITE_ADMIN_EMAILS=
```

`README.md`:

- In "Included in this MVP" replace `- Sign in with ChatGPT through the Sites platform-owned identity flow` with `- Sign in with Google (OAuth 2.0 authorization code + PKCE) backed by a signed, HttpOnly session cookie`.
- Replace the sentence `Platform authentication headers are supplied by the hosted Sites environment.` with `Sign-in requires the Google variables below; without them the login page shows a temporary notice and every page behaves as a guest.`
- In "Environment", add after the Gemini block:

````markdown
Google sign-in (single sign-in for customers, readers, and the editor):

```bash
GOOGLE_CLIENT_ID=your_web_client_id
GOOGLE_CLIENT_SECRET=your_server_only_secret
SESSION_SECRET=long_random_string
SITE_ADMIN_EMAILS=you@gmail.com
```

Register `https://<your-site-domain>/auth/google/callback` (and `http://localhost:3000/auth/google/callback` for development) as an authorized redirect URI on a Google Cloud *Web application* OAuth client. Only the `openid`, `email`, and `profile` scopes are requested. Existing ChatGPT-era profiles are adopted on the first Google sign-in with the same verified email.
````

- [ ] **Step 8: Commit**

```bash
git add -A app lib components tests README.md .env.example
git status --short   # must NOT list untitled.pen or zartar-home-*.png as staged
git commit -m "feat(auth): make google the single sign-in

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 7: Rendered-HTML coverage, audit, gates, merge

**Files:**
- Modify: `tests/rendered-html.test.mjs:75,133` and append a new test
- Create (scratchpad, not committed): `audit.py`, `publish-checkpoint-3.md`

- [ ] **Step 1: Update the guest expectations and add the auth-route test**

In `tests/rendered-html.test.mjs`:

- line 75: `["/profile", /သင့်ကောင်းကင် ကိုယ်ရေး[\s\S]*အကောင့်ဖွင့်\/ဝင်ရောက်မည် \(Google\)/],`
- line 133: `const guestPattern = /သင့်မွေးချိန်အတိုင်း တွက်ချက်ပေးမည်[\s\S]*အကောင့်ဖွင့်\/ဝင်ရောက်မည် \(Google\)[\s\S]*ယနေ့ဖတ်စာသို့ ပြန်သွားရန်/;`

Append at the end of the file:

```js
test("google sign-in routes redirect safely without configuration", async () => {
  const start = await render("/auth/google/start?return_to=%2Fprofile");
  assert.equal(start.status, 302);
  assert.equal(start.headers.get("location"), "/login?error=unconfigured");
  assert.match(start.headers.get("cache-control") ?? "", /no-store/);

  const callback = await render("/auth/google/callback?code=x&state=y");
  assert.equal(callback.status, 302);
  assert.match(callback.headers.get("location") ?? "", /^\/login\?error=(?:google|unconfigured)$/);

  const signout = await render("/auth/signout?return_to=%2F%2Fevil.example");
  assert.equal(signout.status, 302);
  assert.equal(signout.headers.get("location"), "/");
  assert.match(signout.headers.get("set-cookie") ?? "", /suriya_session=;[^]*Max-Age=0/);

  const onboarding = await render("/onboarding");
  assert.ok([302, 307, 308].includes(onboarding.status), String(onboarding.status));
  assert.match(onboarding.headers.get("location") ?? "", /\/login\?return_to=%2Fonboarding$/);

  const login = await (await render("/login")).text();
  assert.match(login, /href="\/auth\/google\/start\?return_to=%2Fonboarding"/);
  assert.match(login, /Google ဖြင့် အကောင့်ဖွင့်\/ဝင်ရောက်မည်/);
  assert.doesNotMatch(login, /signin-with-chatgpt|ChatGPT/);
  const loginError = await (await render("/login?error=unconfigured")).text();
  assert.match(loginError, /ဝင်ရောက်ခြင်းကို ခဏ ရပ်ထားပါသည်/);
});
```

- [ ] **Step 2: Build and run the rendered suite**

Run: `npm run build && node --test tests/rendered-html.test.mjs`
Expected: all tests PASS, including the new one. If `/onboarding` returns 200 instead of a redirect, `requireUser` is not throwing the Next redirect — check that `redirect` is imported from `next/navigation` in `lib/auth/current-user.ts`.

- [ ] **Step 3: Recreate the Playwright audit script and audit `/login`**

Write `/private/tmp/claude-501/-Users-htooayelwin-orca-something/361e73bd-754d-44f0-a78f-85206d8c7a41/scratchpad/audit.py`:

```python
import asyncio, sys
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
PATHS = sys.argv[1:] or ["/login"]
WIDTHS = [390, 1280]
CHECKS = r"""
() => {
  const issues = [];
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1) issues.push(`horizontal overflow ${doc.scrollWidth}>${doc.clientWidth}`);
  const burmese = /[က-႟]/;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const node = walker.currentNode; const text = node.textContent.trim(); if (!text) continue;
    const el = node.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const size = parseFloat(cs.fontSize);
    if (burmese.test(text) && size < 12) issues.push(`small Burmese ${size}px: ${text.slice(0, 30)}`);
  }
  for (const input of document.querySelectorAll('input:not([type=hidden]),select,textarea')) {
    const labelled = (input.labels && input.labels.length) || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
    if (!labelled) issues.push(`unlabelled control ${input.id || input.name || input.tagName}`);
  }
  return issues;
}
"""

async def main():
    failures = 0
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in WIDTHS:
            page = await browser.new_page(viewport={"width": width, "height": 900})
            errors = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            for path in PATHS:
                errors.clear()
                await page.goto(BASE + path, wait_until="networkidle")
                issues = await page.evaluate(CHECKS) + [f"console: {e}" for e in errors]
                name = path.strip("/").replace("/", "_").replace("?", "_") or "home"
                await page.screenshot(path=f"audit-{width}-{name}.png", full_page=True)
                print(f"{width}px {path}: {'OK' if not issues else ''}")
                for issue in issues:
                    print("  -", issue)
                    failures += 1
            await page.close()
        await browser.close()
    sys.exit(1 if failures else 0)

asyncio.run(main())
```

Run (from the scratchpad directory, with the dev server started by `npm run dev` in the background):

```bash
cd /private/tmp/claude-501/-Users-htooayelwin-orca-something/361e73bd-754d-44f0-a78f-85206d8c7a41/scratchpad
python3 audit.py /login "/login?error=google" /profile /readings
```

Expected: every line `OK`; open `audit-390-login.png` and `audit-1280-login.png` with the Read tool and confirm the single Google button, the privacy note, and (for `?error=google`) the red error line render correctly. Stop the dev server afterwards.

- [ ] **Step 4: Run every gate**

```bash
npm run lint && npx vitest run && npm run build && node --test tests/rendered-html.test.mjs
```

Expected: all green (re-run `npx vitest run tests/astrology/daily-score.test.ts` in isolation if only the known flaky band test failed).

- [ ] **Step 5: Commit the tests**

```bash
git add tests/rendered-html.test.mjs
git commit -m "test: cover google sign-in routes and guest CTAs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

- [ ] **Step 6: Write the publish checkpoint (scratchpad, not committed)**

`scratchpad/publish-checkpoint-3.md` must state:

1. Branch/commit range merged; migration `0004` adds `profiles.auth_provider`, `profiles.auth_subject` (+ backfill) and is applied by the hosting workflow.
2. **Deploy is blocked** until the Sites environment has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, and `SITE_ADMIN_EMAILS` — deploying before that removes the only sign-in.
3. The Google Cloud steps: Web application OAuth client; redirect URIs `https://suriya-myanmar.htoo368095.chatgpt.site/auth/google/callback` and `http://localhost:3000/auth/google/callback`; consent screen published with scopes `openid email profile`; if Google demands domain verification, place the Search Console HTML file in `public/`.
4. Gate results (lint / unit / build / rendered / audit) with the exact commands run.

- [ ] **Step 7: Merge into main (no push)**

```bash
git checkout main
git merge --no-ff feat/google-signin-studio -m "Merge feat/google-signin-studio: google sign-in (phase A)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
git checkout feat/google-signin-studio
git status --short   # only the three untracked user files may appear
```

Phase B (Studio) continues on the same branch with its own plan.

---

## Self-review

- **Spec coverage:** identity columns + backfill + indexes (Task 4); resolution update/adopt/create (Task 4); session and OAuth cookies with the mandated attributes and lifetimes (Task 1); PKCE, state, authorize URL, exchange, claim validation (Task 3); the three routes with every redirect target from the spec table (Task 5); `getCurrentUser`/`requireUser`, `loginPath`/`signOutPath` (Tasks 2, 5 — path helpers live in `lib/auth/paths.ts` so the client-safe component `period-page.tsx` can import them); login page copy and error lines, `(Google)` CTA labels, profile account row with email, README/.env.example (Task 6); `usr` id prefix (Task 4); rendered-HTML and Playwright coverage, publish checkpoint with the deploy blocker (Task 7). The `/profile` Studio button belongs to Phase B.
- **Placeholders:** none — every step carries its code or exact command.
- **Type consistency:** `signValue`/`verifyValue`, `createSessionCookieValue`/`verifySessionCookieValue`, `OAuthPayload`, `redirectWithCookies`, `googleConfig().sessionSecret`, `findOrCreateGoogleProfile(identity: GoogleProfileInput)` returning a row with `id`/`email`, and `AppUser` fields are used with the same names in Tasks 1–7.
