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
