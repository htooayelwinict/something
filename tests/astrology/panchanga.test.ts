import { describe, expect, it } from "vitest";
import { calculateKarana, calculateNakshatra, calculateTithi, calculateYoga } from "@/lib/astrology/panchanga";

describe("Panchanga degree arithmetic", () => {
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
});
