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
