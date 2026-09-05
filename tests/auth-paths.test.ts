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
