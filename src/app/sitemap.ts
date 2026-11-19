import type { MetadataRoute } from "next";
import { VacancyStatus } from "@prisma/client";
import { db } from "@/backend/db";
import { CANONICAL_SITE_URL } from "@/backend/seo";
import { routing } from "@/i18n/routing";

export const revalidate = 3600;

function localeAlternates(path: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const loc of routing.locales) {
    map[loc] = `${CANONICAL_SITE_URL}/${loc}${path}`;
  }
  return map;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Asosiy ochiq sahifalar (4 tilda)
  const staticPaths: Array<{
    path: string;
    changeFrequency: "hourly" | "daily" | "weekly";
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/vacancies", changeFrequency: "hourly", priority: 0.95 },
    { path: "/register", changeFrequency: "weekly", priority: 0.6 },
    { path: "/login", changeFrequency: "weekly", priority: 0.5 },
  ];

  for (const item of staticPaths) {
    const languages = localeAlternates(item.path);
    for (const loc of routing.locales) {
      entries.push({
        url: `${CANONICAL_SITE_URL}/${loc}${item.path}`,
        lastModified: now,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        alternates: { languages },
      });
    }
  }

  // Bazadagi barcha faol ochiq vakansiyalar (Google Jobs va Yandex indeksi uchun)
  try {
    const vacancies = await db.vacancy.findMany({
      where: {
        status: VacancyStatus.ACTIVE,
        company: { approval: "APPROVED", user: { status: "ACTIVE" } },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    });

    for (const v of vacancies) {
      const path = `/vacancies/${v.id}`;
      const languages = localeAlternates(path);
      for (const loc of routing.locales) {
        entries.push({
          url: `${CANONICAL_SITE_URL}/${loc}${path}`,
          lastModified: v.updatedAt,
          changeFrequency: "daily",
          priority: 0.85,
          alternates: { languages },
        });
      }
    }
  } catch (err) {
    console.error("Sitemap vacancy query failed:", err);
  }

  return entries;
}
