import { describe, expect, it } from "vitest";
import { dailyQuota, parseStoredTimestamp, QUOTA_LIMIT } from "@/lib/readings/quota";

const at = (iso: string, status = "complete") => ({ createdAt: iso, status });

describe("dailyQuota", () => {
  it("counts only readings on the same Yangon calendar day", () => {
    const now = new Date("2026-08-30T10:00:00Z"); // 16:30 Yangon
    const readings = [
      at("2026-08-29T17:29:00Z"), // 23:59 Aug 29 Yangon → previous day
      at("2026-08-29T17:31:00Z"), // 00:01 Aug 30 Yangon → today
      at("2026-08-30T09:00:00Z"),
    ];
    const quota = dailyQuota(readings, now);
    expect(quota.used).toBe(2);
    expect(quota.remaining).toBe(1);
    expect(quota.limit).toBe(QUOTA_LIMIT);
  });

  it("ignores failed readings and never goes negative", () => {
    const now = new Date("2026-08-30T10:00:00Z");
    const readings = [
      at("2026-08-30T01:00:00Z"), at("2026-08-30T02:00:00Z"),
      at("2026-08-30T03:00:00Z"), at("2026-08-30T04:00:00Z"),
      at("2026-08-30T05:00:00Z", "failed"),
    ];
    const quota = dailyQuota(readings, now);
    expect(quota.used).toBe(4);
    expect(quota.remaining).toBe(0);
  });

  it("treats SQLite CURRENT_TIMESTAMP strings as UTC", () => {
    expect(parseStoredTimestamp("2026-08-30 09:00:00").toISOString()).toBe("2026-08-30T09:00:00.000Z");
    expect(parseStoredTimestamp("2026-08-30T09:00:00.000Z").toISOString()).toBe("2026-08-30T09:00:00.000Z");
    const quota = dailyQuota([at("2026-08-29 17:31:00")], new Date("2026-08-30T10:00:00Z"));
    expect(quota.used).toBe(1);
  });

  it("resets at the next local midnight", () => {
    const quota = dailyQuota([], new Date("2026-08-30T10:00:00Z"));
    expect(quota.resetsAt).toBe("2026-08-30T17:30:00.000Z");
  });
});
