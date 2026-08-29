import { describe, expect, it } from "vitest";
import { demoSpecialists } from "@/lib/content/demo";
import { breadcrumbJsonLd, faqJsonLd, localBusinessJsonLd, serializeJsonLd } from "@/lib/content/seo";
import { publicToday, todayFaq } from "@/lib/services/public-today";

describe("structured data", () => {
  it("builds valid JSON-LD with the expected types", () => {
    const business = localBusinessJsonLd(demoSpecialists);
    expect(business["@type"]).toEqual(["LocalBusiness", "Service"]);
    expect((business.makesOffer as unknown[]).length).toBe(2);
    const parsed = JSON.parse(serializeJsonLd([business, faqJsonLd([{ question: "q<", answer: "a" }])]));
    expect(parsed[1]["@type"]).toBe("FAQPage");
    expect(serializeJsonLd({ x: "</script>" })).not.toContain("</script>");
    expect(breadcrumbJsonLd([{ name: "ပင်မ", path: "/" }]).itemListElement).toHaveLength(1);
  });
});

describe("public today", () => {
  it("computes a Yangon day with horas and FAQ", () => {
    const today = publicToday(new Date("2026-08-30T10:00:00Z"));
    expect(today.date).toBe("2026-08-30");
    expect(today.horas).toHaveLength(12);
    expect(today.rahuKalam).not.toBeNull();
    expect(today.moonSignIndex).toBeGreaterThanOrEqual(0);
    expect(todayFaq(today)[0].answer).toMatch(/[၀-၉]/);
  });
});
