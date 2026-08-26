import { describe, expect, it } from "vitest";
import { newId } from "@/lib/ids";

describe("newId", () => {
  it("creates prefixed, sortable identifiers", () => {
    const first = newId("rdg");
    const second = newId("rdg");
    expect(first).toMatch(/^rdg_[0-9a-z]{13}_[0-9a-f]{18}$/);
    expect(first < second).toBe(true);
  });

  it("rejects unknown prefixes at runtime", () => {
    expect(() => newId("user" as "rdg")).toThrow("Invalid ID prefix");
  });
});
