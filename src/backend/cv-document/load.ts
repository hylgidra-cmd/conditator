import "server-only";
import { parsePrivacy, sanitizeCvData } from "@/backend/cv/privacy";
import { cvDataSchema } from "@/backend/cv/schema";
import { db } from "@/backend/db";
import { getActivePersonalityProfile } from "@/backend/personality/service";
import type { CvDocumentInput } from "./types";

/**
 * Talabaning SAQLANGAN CV si hujjat uchun. Saqlanmagan bo'lsa null.
 * Ruxsat bu yerda tekshirilmaydi: chaqiruvchi (route/sahifa) tekshiradi.
 */
export async function loadSavedCvDocument(
  userId: string,
  cvId?: string,
): Promise<(CvDocumentInput & { id: string; isPaid: boolean }) | null> {
  const cv = await db.cv.findFirst({
    where: cvId ? { id: cvId, userId } : { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      userId: true,
      data: true,
      language: true,
      workTypes: true,
      savedAt: true,
      templateId: true,
      isPaid: true,
    },
  });
  if (!cv?.savedAt) return null;
  const personality = await getActivePersonalityProfile(cv.userId, cv.language);
  return {
    id: cv.id,
    data: cvDataSchema.parse(cv.data),
    language: cv.language,
    workTypes: cv.workTypes,
    templateId: cv.templateId,
    isPaid: cv.isPaid,
    personality,
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

function sanitizeAsciiFilename(fullName: string | null): string {
  return Array.from(fullName?.trim() ?? "")
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
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/**
 * Yuklab olinadigan fayl nomi, faqat ASCII: "CV-Aziza-Karimova.pdf".
 * (UTF-8 filename* ni ba'zi Chromium versiyalari qabul qilmaydi, shuning uchun ishlatilmaydi.)
 */
export function pdfContentDisposition(fullName: string | null): string {
  const name = sanitizeAsciiFilename(fullName);
  return `attachment; filename="${name ? `CV-${name}` : "CV"}.pdf"`;
}

/** Obyektivka DOCX fayl nomi, faqat ASCII (non-ISO-8859-1 header xatosini oldini oladi). */
export function docxContentDisposition(fullName: string | null): string {
  const name = sanitizeAsciiFilename(fullName);
  return `attachment; filename="${name ? `Obyektivka-${name}` : "Obyektivka"}.docx"`;
}

/**
 * Kompaniya uchun CV: faqat ochiq (`isVisible`), saqlangan va egasi faol bo'lsa.
 * Aks holda null (chaqiruvchi 404 qaytaradi: CV borligi ham oshkor qilinmaydi).
 * Kompaniya tasdiqlanganini chaqiruvchi tekshiradi (`requireApprovedCompany`).
 */
export async function loadVisibleCvDocument(
  cvId: string,
  options?: { isLocked?: boolean; isOwnerOrAdmin?: boolean },
): Promise<(CvDocumentInput & { id: string }) | null> {
  const cv = await db.cv.findFirst({
    where: {
      id: cvId,
      isVisible: true,
      savedAt: { not: null },
      user: { status: "ACTIVE" },
    },
    select: {
      id: true,
      userId: true,
      data: true,
      language: true,
      workTypes: true,
      templateId: true,
      privacy: true,
    },
  });
  if (!cv) return null;
  const rawData = cvDataSchema.parse(cv.data);
  const privacySettings = parsePrivacy(cv.privacy);
  const sanitized = sanitizeCvData(rawData, {
    privacy: privacySettings,
    isLocked: options?.isLocked,
    isOwnerOrAdmin: options?.isOwnerOrAdmin,
  });
  const personality = await getActivePersonalityProfile(cv.userId, cv.language);

  return {
    id: cv.id,
    data: sanitized,
    language: cv.language,
    workTypes: cv.workTypes,
    templateId: cv.templateId,
    personality,
  };
}
