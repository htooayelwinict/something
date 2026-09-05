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
