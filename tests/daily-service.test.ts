import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBirthProfile: vi.fn(),
  getChatGPTUser: vi.fn(),
}));

vi.mock("@/app/chatgpt-auth", () => ({ getChatGPTUser: mocks.getChatGPTUser }));
vi.mock("@/db/repositories/profiles", () => ({ getBirthProfile: mocks.getBirthProfile }));

import { getDailyExperience } from "@/lib/services/daily";

describe("getDailyExperience", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T00:00:00.000Z"));
    mocks.getChatGPTUser.mockReset().mockResolvedValue({
      userId: "user-1",
      displayName: "Daily Test",
      email: "daily@example.com",
      fullName: "Daily Test",
    });
    mocks.getBirthProfile.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it("falls back to the public demo when a personalized chart cannot be calculated", async () => {
    mocks.getBirthProfile.mockResolvedValue({
      name: "Historical Profile",
      birthDate: "1600-01-01",
      birthTime: "12:00",
      birthCity: "Yangon",
      latitude: 16.7967,
      longitude: 96.161,
      timezone: "Asia/Yangon",
    });

    await expect(getDailyExperience()).resolves.toMatchObject({
      personalized: false,
      identity: { name: "Suriya Guest" },
    });
  });
});
