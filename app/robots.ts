import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/readings", "/profile", "/onboarding", "/login", "/tarot/bookings/", "/api/", "/studio", "/auth/"] }],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
