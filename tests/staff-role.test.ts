import { describe, expect, it } from "vitest";
import { bookingScope, parseAdminEmails, resolveStaff } from "@/lib/auth/roles";

const user = { userId: "usr_1", displayName: "Editor", email: "Editor@Example.com", fullName: null };

describe("parseAdminEmails", () => {
  it("splits, trims, lower-cases, and drops blanks", () => {
    expect([...parseAdminEmails(" A@x.com, b@Y.com ,, ")]).toEqual(["a@x.com", "b@y.com"]);
    expect(parseAdminEmails(undefined).size).toBe(0);
  });
});

describe("resolveStaff", () => {
  it("returns null for guests", () => {
    expect(resolveStaff(null, new Set(["editor@example.com"]), "tsp_thiri")).toBeNull();
  });

  it("prefers editor over teller and matches emails case-insensitively", () => {
    expect(resolveStaff(user, new Set(["editor@example.com"]), "tsp_thiri")).toEqual({ role: "editor", user });
  });

  it("resolves a teller from the matched specialist id", () => {
    expect(resolveStaff(user, new Set(), "tsp_thiri")).toEqual({ role: "teller", user, specialistId: "tsp_thiri" });
  });

  it("returns null for signed-in customers", () => {
    expect(resolveStaff(user, new Set(["someone@else.com"]), null)).toBeNull();
  });
});

describe("bookingScope", () => {
  it("gives editors everything and tellers their own id", () => {
    expect(bookingScope({ role: "editor", user })).toEqual({ kind: "all" });
    expect(bookingScope({ role: "teller", user, specialistId: "tsp_thiri" })).toEqual({ kind: "specialist", specialistId: "tsp_thiri" });
  });
});
