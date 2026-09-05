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
