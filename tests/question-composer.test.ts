import { describe, expect, it } from "vitest";
import { unauthenticatedAskTarget } from "@/components/suriya/question-composer";

describe("Ask authentication routing", () => {
  it("routes a known anonymous visitor to sign-in before starting a reading request", () => {
    expect(unauthenticatedAskTarget(false)).toBe("/login?return_to=/ask");
    expect(unauthenticatedAskTarget(true)).toBeNull();
  });
});
