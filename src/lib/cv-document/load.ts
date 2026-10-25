import "server-only";
import { cvDataSchema } from "@/lib/cv/schema";
import { db } from "@/lib/db";
import type { CvDocumentInput } from "./types";

/**
 * Talabaning SAQLANGAN CV si hujjat uchun. Saqlanmagan bo'lsa null.
 * Ruxsat bu yerda tekshirilmaydi: chaqiruvchi (route/sahifa) tekshiradi.
 */
export async function loadSavedCvDocument(
  userId: string,
): Promise<CvDocumentInput | null> {
  const cv = await db.cv.findUnique({
    where: { userId },
    select: { data: true, language: true, workTypes: true, savedAt: true },
  });
  if (!cv?.savedAt) return null;
  return {
    data: cvDataSchema.parse(cv.data),
    language: cv.language,
    workTypes: cv.workTypes,
  };
}

// Kirill → lotin (fayl nomi uchun). Lotin harflardagi belgilar NFKD bilan olib tashlanadi.
const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  қ: "q",
  л: "l",
  м: "m",
  н: "n",
  ң: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ў: "o",
  ү: "u",
  ф: "f",
  х: "kh",
  ҳ: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ә: "a",
  ө: "o",
  ю: "yu",
  я: "ya",
  і: "i",
};

/**
 * Yuklab olinadigan fayl nomi, faqat ASCII: "CV-Aziza-Karimova.pdf".
 * (UTF-8 filename* ni ba'zi Chromium versiyalari qabul qilmaydi, shuning uchun ishlatilmaydi.)
 */
export function pdfContentDisposition(fullName: string | null): string {
  const name = Array.from(fullName?.trim() ?? "")
    .map((char) => {
      const lower = char.toLowerCase();
      const latin = CYRILLIC[lower];
      if (latin === undefined) return char;
      return char === lower
        ? latin
        : latin.charAt(0).toUpperCase() + latin.slice(1);
    })
    .join("")
    .normalize("NFKD")
    .replace(/ı/g, "i")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `attachment; filename="${name ? `CV-${name}` : "CV"}.pdf"`;
}

/**
 * Kompaniya uchun CV: faqat ochiq (`isVisible`), saqlangan va egasi faol bo'lsa.
 * Aks holda null (chaqiruvchi 404 qaytaradi: CV borligi ham oshkor qilinmaydi).
 * Kompaniya tasdiqlanganini chaqiruvchi tekshiradi (`requireApprovedCompany`).
 */
export async function loadVisibleCvDocument(
  cvId: string,
): Promise<(CvDocumentInput & { id: string }) | null> {
  const cv = await db.cv.findFirst({
    where: {
      id: cvId,
      isVisible: true,
      savedAt: { not: null },
      user: { status: "ACTIVE" },
    },
    select: { id: true, data: true, language: true, workTypes: true },
  });
  if (!cv) return null;
  return {
    id: cv.id,
    data: cvDataSchema.parse(cv.data),
    language: cv.language,
    workTypes: cv.workTypes,
  };
}
