import type { Cv, Lang, WorkType } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";
import { CV_TEXT_MAX, type CvData, missingFields } from "./schema";

// ---------- Saqlash sxemasi (talaba tahrirlagan CV) ----------

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: "FIELD_TOO_LONG" })
    .nullable()
    .transform((value) => (value ? value : null));

const required = (max: number) =>
  z
    .string()
    .trim()
    .min(1, { error: "FIELD_REQUIRED" })
    .max(max, { error: "FIELD_TOO_LONG" });

const list = <T extends z.ZodType>(item: T, max: number) =>
  z.array(item).max(max, { error: "TOO_MANY_ITEMS" });

export const WORK_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "REMOTE",
  "INTERNSHIP",
] as const;

export const cvSaveSchema = z.object({
  language: z.enum(["kk", "uz", "ru", "en"], { error: "LANGUAGE_REQUIRED" }),
  sourceText: z
    .string()
    .max(CV_TEXT_MAX * 2)
    .refine((value) => Array.from(value).length <= CV_TEXT_MAX, {
      error: "TEXT_TOO_LONG",
    })
    .nullable()
    .optional(),
  workTypes: list(z.enum(WORK_TYPES), WORK_TYPES.length),
  data: z.object({
    fullName: text(100),
    contact: z.object({
      email: z
        .string()
        .trim()
        .max(254)
        .nullable()
        .transform((value) => (value ? value : null))
        .pipe(z.email({ error: "INVALID_EMAIL" }).nullable()),
      phone: text(30),
    }),
    goal: text(1000),
    location: text(100),
    education: list(
      z.object({
        institution: required(200),
        degree: text(100),
        field: text(150),
        startYear: text(20),
        endYear: text(20),
      }),
      20,
    ),
    experience: list(
      z.object({
        organization: required(200),
        position: text(150),
        startDate: text(30),
        endDate: text(30),
        description: text(1000),
      }),
      20,
    ),
    skills: list(required(60), 50),
    languages: list(z.object({ name: required(50), level: text(30) }), 20),
    certificates: list(required(300), 30),
  }),
});

export type CvSaveInput = z.infer<typeof cvSaveSchema>;

// ---------- Filtr va qidiruv maydonlari ----------

function normalizeTags(values: string[]): string[] {
  return [
    ...new Set(
      values.map((value) => value.trim().toLowerCase()).filter(Boolean),
    ),
  ];
}

/** Kalit so'z qidiruvi uchun matn. Ism va aloqa ma'lumoti ataylab kiritilmaydi. */
export function buildSearchText(cv: CvData): string {
  return [
    cv.goal,
    cv.location,
    ...cv.education.flatMap((item) => [
      item.institution,
      item.degree,
      item.field,
    ]),
    ...cv.experience.flatMap((item) => [
      item.organization,
      item.position,
      item.description,
    ]),
    ...cv.skills,
    ...cv.languages.map((item) => item.name),
    ...cv.certificates,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// ---------- Amallar ----------

export type StudentCv = Pick<
  Cv,
  | "language"
  | "data"
  | "missingFields"
  | "isVisible"
  | "savedAt"
  | "workTypes"
  | "sourceText"
>;

const STUDENT_CV_SELECT = {
  language: true,
  data: true,
  missingFields: true,
  isVisible: true,
  savedAt: true,
  workTypes: true,
  sourceText: true,
} as const;

export function getOwnCv(userId: string): Promise<StudentCv | null> {
  return db.cv.findUnique({ where: { userId }, select: STUDENT_CV_SELECT });
}

/**
 * "Saqlash": CV ni bazaga yozadi, savedAt ni yangilaydi (CV versiyasi o'zgaradi).
 * Ko'rinish (isVisible) bu yerda o'zgartirilmaydi: yangi CV standart bo'yicha yashirin.
 */
export async function saveOwnCv(
  userId: string,
  input: CvSaveInput,
): Promise<StudentCv> {
  const data: CvData = input.data;
  const fields = {
    language: input.language as Lang,
    data,
    missingFields: missingFields(data),
    savedAt: new Date(),
    skills: normalizeTags(data.skills),
    languages: normalizeTags(data.languages.map((item) => item.name)),
    location: data.location,
    workTypes: [...new Set(input.workTypes)] as WorkType[],
    searchText: buildSearchText(data),
    ...(input.sourceText !== undefined ? { sourceText: input.sourceText } : {}),
  };
  return db.cv.upsert({
    where: { userId },
    create: { userId, isVisible: false, ...fields },
    update: fields,
    select: STUDENT_CV_SELECT,
  });
}

export async function setOwnCvVisibility(
  userId: string,
  isVisible: boolean,
): Promise<StudentCv> {
  const cv = await db.cv.findUnique({
    where: { userId },
    select: { savedAt: true },
  });
  // Saqlanmagan CV ni ochiq qilib bo'lmaydi.
  if (!cv?.savedAt) throw new ApiError(409, "CV_NOT_SAVED");
  return db.cv.update({
    where: { userId },
    data: { isVisible },
    select: STUDENT_CV_SELECT,
  });
}
