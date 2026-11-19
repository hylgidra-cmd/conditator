import type { MetadataRoute } from "next";
import { CANONICAL_SITE_URL } from "@/backend/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/uz",
          "/kk",
          "/ru",
          "/en",
          "/uz/vacancies",
          "/kk/vacancies",
          "/ru/vacancies",
          "/en/vacancies",
          "/api/companies/",
        ],
        disallow: [
          "/api/",
          "/*/admin",
          "/*/student",
          "/*/company",
          "/*/chat",
          "/*/support",
          "/*/account",
          "/*/change-password",
          "/*/dashboard",
          "/*/design-system",
        ],
      },
    ],
    sitemap: `${CANONICAL_SITE_URL}/sitemap.xml`,
    host: CANONICAL_SITE_URL,
  };
}
