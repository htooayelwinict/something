import { describe, expect, it } from "vitest";
import { calculateKarana, calculateNakshatra, calculatePanchangaAt, calculateTithi, calculateYoga } from "@/lib/astrology/panchanga";

const yangon = {
  label: "Yangon",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
};

describe("Panchanga calculations", () => {
  it("handles tithi and paksha boundaries", () => {
    expect(calculateTithi(10, 10).index).toBe(0);
    expect(calculateTithi(0, 179.999).paksha).toBe("Shukla");
    expect(calculateTithi(0, 180).paksha).toBe("Krishna");
    expect(calculateTithi(0, 359.999).name).toBe("Amavasya");
  });

  it("finds nakshatra, pada, yoga, and karana", () => {
    expect(calculateNakshatra(0)).toMatchObject({ name: "Ashwini", pada: 1 });
    expect(calculateNakshatra(13.34)).toMatchObject({ name: "Bharani", pada: 1 });
    expect(calculateYoga(350, 20).index).toBe(0);
    expect(calculateKarana(0, 0).name).toBe("Kimstughna");
    expect(calculateKarana(0, 6).name).toBe("Bava");
  });

  it("changes Vara at local sunrise rather than civil midnight", () => {
    const beforeSunrise = calculatePanchangaAt(new Date("2026-08-27T21:30:00.000Z"), yangon);
    const afterSunrise = calculatePanchangaAt(new Date("2026-08-28T00:30:00.000Z"), yangon);

    expect(beforeSunrise.vara).toBe("ကြာသပတေး");
    expect(afterSunrise.vara).toBe("သောကြာ");
  });
});
