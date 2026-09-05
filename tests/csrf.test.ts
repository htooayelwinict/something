import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/auth/csrf";

const url = "https://suriya.example/api/studio/bookings/x";

describe("isSameOriginRequest", () => {
  it("trusts sec-fetch-site same-origin and none", () => {
    expect(isSameOriginRequest(new Headers({ "sec-fetch-site": "same-origin" }), url)).toBe(true);
    expect(isSameOriginRequest(new Headers({ "sec-fetch-site": "none" }), url)).toBe(true);
    expect(isSameOriginRequest(new Headers({ "sec-fetch-site": "cross-site", origin: "https://suriya.example" }), url)).toBe(false);
  });

  it("falls back to a matching origin header", () => {
    expect(isSameOriginRequest(new Headers({ origin: "https://suriya.example" }), url)).toBe(true);
    expect(isSameOriginRequest(new Headers({ origin: "https://evil.example" }), url)).toBe(false);
    expect(isSameOriginRequest(new Headers({ origin: "not a url" }), url)).toBe(false);
  });

  it("rejects requests with neither header", () => {
    expect(isSameOriginRequest(new Headers(), url)).toBe(false);
  });
});
