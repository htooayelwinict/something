import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionCookieValue, SESSION_COOKIE } from "@/lib/auth/session";

const mocks = vi.hoisted(() => ({ cookie: "" as string, redirect: vi.fn() }));

vi.mock("next/headers", () => ({ headers: async () => new Headers(mocks.cookie ? { cookie: mocks.cookie } : {}) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { getCurrentUser, requireUser } from "@/lib/auth/current-user";

const secret = "unit-test-session-secret";

describe("getCurrentUser", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = secret;
    mocks.cookie = "";
    mocks.redirect.mockReset();
  });
  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("returns the user from a valid session cookie", async () => {
    mocks.cookie = `other=1; ${SESSION_COOKIE}=${await createSessionCookieValue({ uid: "usr_1", email: "a@example.com", name: "အေး" }, secret)}`;
    await expect(getCurrentUser()).resolves.toEqual({ userId: "usr_1", displayName: "အေး", email: "a@example.com", fullName: "အေး" });
  });

  it("uses the email as display name when no name is known", async () => {
    mocks.cookie = `${SESSION_COOKIE}=${await createSessionCookieValue({ uid: "usr_1", email: "a@example.com", name: null }, secret)}`;
    await expect(getCurrentUser()).resolves.toMatchObject({ displayName: "a@example.com", fullName: null });
  });

  it("returns null without a cookie, with a bad signature, or without a configured secret", async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
    mocks.cookie = `${SESSION_COOKIE}=${await createSessionCookieValue({ uid: "usr_1", email: "a@example.com", name: null }, "other-secret")}`;
    await expect(getCurrentUser()).resolves.toBeNull();
    delete process.env.SESSION_SECRET;
    mocks.cookie = `${SESSION_COOKIE}=${await createSessionCookieValue({ uid: "usr_1", email: "a@example.com", name: null }, secret)}`;
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("requireUser redirects guests to the login page with the return path", async () => {
    await requireUser("/onboarding");
    expect(mocks.redirect).toHaveBeenCalledWith("/login?return_to=%2Fonboarding");
  });
});
