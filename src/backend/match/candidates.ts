import { Prisma, type Lang, type Vacancy, type WorkType } from "@prisma/client";
import { db } from "@/backend/db";
import { canonicalLanguage, foldText, locationMatches } from "./normalize";

/** AI ga yuboriladigan nomzodlarning eng ko'p soni. */
export const MAX_CANDIDATES = 30;
/** SQL dan olinadigan qatorlar chegarasi (oldindan tartiblangan). Til va joylashuv filtri shundan keyin. */
const SQL_ROW_CAP = 3000;
const MAX_TERMS = 40;

// Kalit so'z sifatida olinmaydigan umumiy so'zlar (4 til).
const STOP_WORDS = new Set(
  [
    "kerak",
    "talab",
    "talablar",
    "ishga",
    "bilan",
    "uchun",
    "yoki",
    "hamda",
    "kamida",
    "yaxshi",
    "bilish",
    "biladigan",
    "tajriba",
    "tajribali",
    "lavozim",
    "kompaniya",
    "biz",
    "bizga",
    "bizge",
    "nuzhen",
    "nuzhna",
    "trebuetsya",
    "opyt",
    "znanie",
    "raboty",
    "rabota",
    "kompaniya",
    "need",
    "needed",
    "with",
    "from",
    "that",
    "this",
    "have",
    "will",
    "years",
    "year",
    "experience",
    "knowledge",
    "work",
    "required",
    "looking",
  ].map(foldText),
);

/** Talabdan kalit so'zlar: ko'nikmalar (butunligicha), sarlavha va erkin matndagi so'zlar. */
export function vacancyTerms(
  vacancy: Pick<Vacancy, "title" | "rawText" | "skills">,
): string[] {
  const skills = vacancy.skills
    .map((skill) => skill.trim().toLowerCase())
    .filter(Boolean);
  const words = `${vacancy.title} ${vacancy.rawText ?? ""}`
    .toLowerCase()
    .split(/[^\p{L}\p{N}+#.]+/u)
    .map((word) => word.replace(/^\.+|\.+$/g, ""))
    .filter(
      (word) => Array.from(word).length >= 3 && !STOP_WORDS.has(foldText(word)),
    );
  return [...new Set([...skills, ...words])].slice(0, MAX_TERMS);
}

export type CandidateRow = {
  id: string;
  language: Lang;
  skills: string[];
  languages: string[];
  location: string | null;
  savedAt: Date;
  /** Talab ko'nikmalaridan CV ko'nikmalarida aynan borlari. */
  skillHits: number;
  /** CV qidiruv matnida uchragan kalit so'zlar. */
  matchedTerms: string[];
};

export type FilterStats = {
  /** Ochiq va saqlangan CV lar soni (faol talabalar). */
  visible: number;
  droppedWorkType: number;
  droppedLanguage: number;
  droppedLocation: number;
  /** Barcha filtrlardan o'tganlar. */
  passed: number;
};

/** CV tili uning o'zida yozilgan tilni bildiradi: rus tilida yozilgan CV egasi rus tilini biladi. */
const CV_LANG_CODE: Record<Lang, string> = {
  kk: "kaa",
  uz: "uz",
  ru: "ru",
  en: "en",
};

export function languagesMatch(
  required: string[],
  cv: Pick<CandidateRow, "languages" | "language">,
): boolean {
  if (required.length === 0) return true;
  const have = new Set(cv.languages.map(canonicalLanguage));
  have.add(CV_LANG_CODE[cv.language]);
  return required.every((name) => have.has(canonicalLanguage(name)));
}

/**
 * Joylashuv: talabda joy ko'rsatilmagan yoki ish turi masofaviy bo'lsa tekshirilmaydi.
 * CV da joylashuv yozilmagan bo'lsa, nomzod chiqarib tashlanmaydi (noma'lum ≠ mos emas); AI buni hisobga oladi.
 */
export function locationPasses(
  vacancy: Pick<Vacancy, "location" | "workType">,
  cvLocation: string | null,
): boolean {
  if (!vacancy.location?.trim() || vacancy.workType === "REMOTE") return true;
  if (!cvLocation?.trim()) return true;
  return locationMatches(vacancy.location, cvLocation);
}

/**
 * 1-bosqich (AI siz): ochiq + saqlangan CV, faol talaba, ish turi (SQL da), til va joylashuv (kodda).
 * Tartib: ko'nikma mosligi, keyin kalit so'zlar, keyin yangi saqlanganlar.
 */
export async function filterCandidates(
  vacancy: Pick<
    Vacancy,
    "title" | "rawText" | "skills" | "languages" | "location" | "workType"
  >,
): Promise<{
  candidates: CandidateRow[];
  stats: FilterStats;
  terms: string[];
}> {
  const terms = vacancyTerms(vacancy);
  const skills = [
    ...new Set(vacancy.skills.map((skill) => skill.trim().toLowerCase())),
  ];
  const workType: WorkType | null = vacancy.workType;

  const [visible, rows] = await Promise.all([
    db.cv.count({
      where: {
        isVisible: true,
        savedAt: { not: null },
        user: { status: "ACTIVE", role: "STUDENT" },
      },
    }),
    db.$queryRaw<
      Array<Omit<CandidateRow, "skillHits"> & { skillHits: number }>
    >(Prisma.sql`
      SELECT c.id, c.language, c.skills, c.languages, c.location, c."savedAt",
        cardinality(ARRAY(SELECT unnest(c.skills) INTERSECT SELECT unnest(${skills}::text[])))::int AS "skillHits",
        ARRAY(SELECT t FROM unnest(${terms}::text[]) AS t WHERE strpos(c."searchText", t) > 0) AS "matchedTerms"
      FROM "Cv" c
      JOIN "User" u ON u.id = c."userId"
      WHERE c."isVisible" AND c."savedAt" IS NOT NULL
        AND u.status = 'ACTIVE' AND u.role = 'STUDENT'
        AND (${workType}::text IS NULL OR cardinality(c."workTypes") = 0
             OR ${workType}::text::"WorkType" = ANY(c."workTypes"))
      ORDER BY "skillHits" DESC, cardinality(ARRAY(SELECT t FROM unnest(${terms}::text[]) AS t WHERE strpos(c."searchText", t) > 0)) DESC,
        c."savedAt" DESC, c.id
      LIMIT ${SQL_ROW_CAP}
    `),
  ]);

  let droppedLanguage = 0;
  let droppedLocation = 0;
  const passed: CandidateRow[] = [];
  for (const row of rows) {
    if (!languagesMatch(vacancy.languages, row)) droppedLanguage++;
    else if (!locationPasses(vacancy, row.location)) droppedLocation++;
    else passed.push(row);
  }

  return {
    candidates: passed.slice(0, MAX_CANDIDATES),
    terms,
    stats: {
      visible,
      // Chegaraga yetilsa qolganlari ish turi sababli emas, tartib sababli qoladi.
      droppedWorkType:
        rows.length < SQL_ROW_CAP ? Math.max(0, visible - rows.length) : 0,
      droppedLanguage,
      droppedLocation,
      passed: passed.length,
    },
  };
}
