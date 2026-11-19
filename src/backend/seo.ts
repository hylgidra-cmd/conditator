import type { Metadata } from "next";
import { type Locale, routing } from "@/i18n/routing";

/** Asosiy kanonik domen (Google / Yandex indekslash uchun). */
export const CANONICAL_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://candidator.uz"
).replace(/\/+$/, "");

export const SEO_KEYWORDS: Record<Locale, string[]> = {
  uz: [
    "Candidator",
    "candidator.uz",
    "vakansiya",
    "vakansiyalar",
    "ish",
    "ish bor",
    "online ish izlash",
    "onlayn ish izlash",
    "ish topish",
    "rezyume yaratish",
    "CV yaratish",
    "obyektivka",
    "ish izlash O'zbekiston",
    "Toshkent vakansiya",
    "Nukus vakansiya",
    "dispetcher vakansiya",
    "nomzodlar",
  ],
  kk: [
    "Candidator",
    "candidator.uz",
    "vakansiya",
    "vakansiyalar",
    "jumıs",
    "jumıs izlew",
    "onlayn jumıs izlew",
    "online jumıs",
    "rezyume jaratıw",
    "CV jaratıw",
    "obyektivka",
    "Nókis vakansiya",
    "Qaraqalpaqstan jumıs",
    "Ózbekstan vakansiyalar",
  ],
  ru: [
    "Candidator",
    "candidator.uz",
    "вакансии",
    "вакансия",
    "работа",
    "поиск работы онлайн",
    "работа онлайн",
    "работа в Узбекистане",
    "вакансии Узбекистан",
    "вакансии Ташкент",
    "вакансии Нукус",
    "создать резюме",
    "резюме онлайн",
    "объективка",
    "подбор кандидатов",
  ],
  en: [
    "Candidator",
    "candidator.uz",
    "vacancies",
    "vacancy",
    "jobs",
    "online job search",
    "jobs in Uzbekistan",
    "Uzbekistan vacancies",
    "Tashkent jobs",
    "Nukus jobs",
    "resume builder",
    "CV maker",
    "hire candidates",
  ],
};

export const OG_LOCALE: Record<Locale, string> = {
  uz: "uz_UZ",
  kk: "kk_KZ",
  ru: "ru_RU",
  en: "en_US",
};

/** Har bir ochiq sahifa uchun 4 tildagi hreflang + canonical manzillarini quradi. */
export function buildAlternates(
  locale: Locale,
  path: string,
): NonNullable<Metadata["alternates"]> {
  const normalized = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${CANONICAL_SITE_URL}/${loc}${normalized}`;
  }
  languages["x-default"] =
    `${CANONICAL_SITE_URL}/${routing.defaultLocale}${normalized}`;

  return {
    canonical: `${CANONICAL_SITE_URL}/${locale}${normalized}`,
    languages,
  };
}

/** JSON-LD skriptini XSS dan xavfsiz qilib serializatsiya qiladi. */
export function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
