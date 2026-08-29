import type { MetadataRoute } from "next";
import { listSpecialists } from "@/db/repositories/specialists";
import { SITE_URL } from "@/lib/content/business";
import { demoSpecialists } from "@/lib/content/demo";
import { rasiContent } from "@/lib/content/rasi";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const rows = await listSpecialists().catch(() => []);
  const specialistIds = rows.length > 0 ? rows.map((row) => row.id) : demoSpecialists.map((item) => item.id);
  const entry = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => ({ url: new URL(path, SITE_URL).toString(), lastModified: now, changeFrequency, priority });
  return [
    entry("/", 1, "daily"),
    entry("/today", 0.9, "daily"),
    entry("/daily", 0.9, "daily"),
    entry("/tarot", 0.9, "weekly"),
    entry("/rasi", 0.8, "weekly"),
    ...rasiContent.map((item) => entry(`/rasi/${item.slug}`, 0.8, "daily")),
    ...specialistIds.map((id) => entry(`/tarot/${id}`, 0.7, "weekly")),
    entry("/daily/week", 0.6, "weekly"),
    entry("/daily/month", 0.6, "monthly"),
    entry("/ask", 0.6, "monthly"),
    entry("/chart", 0.5, "monthly"),
  ];
}
