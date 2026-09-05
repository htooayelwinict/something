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
