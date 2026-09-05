import { describe, expect, it } from "vitest";
import { firstIssueMessage, isUniqueViolation } from "@/lib/studio/errors";

describe("firstIssueMessage", () => {
  it("passes Burmese messages through and hides English validator text", () => {
    expect(firstIssueMessage({ issues: [{ message: "အမည်ကို ရေးပါ" }] })).toBe("အမည်ကို ရေးပါ");
    expect(firstIssueMessage({ issues: [{ message: "Unrecognized key: isActive" }] })).toBe("invalid_input");
    expect(firstIssueMessage({ issues: [] })).toBe("invalid_input");
  });
});

describe("isUniqueViolation", () => {
  it("detects the SQLite message directly or nested in a wrapped query error", () => {
    expect(isUniqueViolation(new Error("D1_ERROR: UNIQUE constraint failed: tarot_specialists.login_email: SQLITE_CONSTRAINT"))).toBe(true);
    const wrapped = new Error("Failed query: update tarot_specialists set ...", { cause: new Error("UNIQUE constraint failed: tarot_specialists.login_email") });
    expect(isUniqueViolation(wrapped)).toBe(true);
    expect(isUniqueViolation(new Error("no such table: tarot_specialists"))).toBe(false);
    expect(isUniqueViolation("UNIQUE constraint failed")).toBe(false);
  });
});
