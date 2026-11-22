import type { Cv, Lang, WorkType } from "@prisma/client";
import { z } from "zod";
import { isValidImageDataUrl } from "@/backend/company/logo";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { activeResult } from "@/backend/personality/service";
import {
  CV_TEXT_MAX,
  type CvData,
  missingFields,
  obyektivkaDataSchema,
} from "./schema";

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

const photoSchema = z
  .string()
  .trim()
  .max(500_000, { error: "FILE_TOO_LARGE" })
  .nullable()
  .optional()
  .refine((value) => !value || isValidImageDataUrl(value), {
    error: "FILE_TYPE_NOT_ALLOWED",
  });

export const WORK_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "REMOTE",
  "INTERNSHIP",
] as const;

export const cvSaveSchema = z.object({
  cvId: z.string().trim().max(100).optional(),
  createNew: z.boolean().optional(),
  title: z.string().trim().max(100).optional(),
  templateId: z.string().trim().max(50).optional(),
  privacy: z
    .object({
      hideName: z.boolean().optional(),
      hidePhone: z.boolean().optional(),
      hideEmail: z.boolean().optional(),
      hideAddress: z.boolean().optional(),
      hidePhoto: z.boolean().optional(),
    })
    .optional(),
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
      phone: text(50),
      telegram: text(100).optional(),
      github: text(150).optional(),
      linkedin: text(150).optional(),
      website: text(150).optional(),
    }),
    photo: photoSchema,
    telegram: text(100).optional(),
    github: text(150).optional(),
    linkedin: text(150).optional(),
    website: text(150).optional(),
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
    projects: list(
      z.object({
        name: required(150),
        link: z.string().trim().max(200).nullable().optional(),
        year: z.string().trim().max(50).nullable().optional(),
        description: z.string().trim().max(1000).nullable().optional(),
      }),
      20,
    ).optional(),
    skills: list(required(60), 50),
    languages: list(z.object({ name: required(50), level: text(50) }), 20),
    certificates: list(
      z.union([
        required(300),
        z.object({
          name: required(200),
          issuer: z.string().trim().max(150).nullable().optional(),
          year: z.string().trim().max(50).nullable().optional(),
        }),
      ]),
      30,
    ).default([]),
    hobbies: list(required(60), 30).optional(),
    obyektivka: obyektivkaDataSchema.optional(),
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
    ...(cv.certificates ?? []).map((item) =>
      typeof item === "string" ? item : item.name,
    ),
    ...(cv.projects ?? []).flatMap((p) => [p.name, p.description]),
    ...(cv.hobbies ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// ---------- Amallar ----------

export type StudentCv = Pick<
  Cv,
  | "id"
  | "title"
  | "templateId"
  | "privacy"
  | "language"
  | "data"
  | "missingFields"
  | "isVisible"
  | "isPaid"
  | "savedAt"
  | "workTypes"
  | "sourceText"
>;

const STUDENT_CV_SELECT = {
  id: true,
  title: true,
  templateId: true,
  privacy: true,
  language: true,
  data: true,
  missingFields: true,
  isVisible: true,
  isPaid: true,
  savedAt: true,
  workTypes: true,
  sourceText: true,
} as const;

export function getOwnCv(
  userId: string,
  cvId?: string,
): Promise<StudentCv | null> {
  return db.cv.findFirst({
    where: cvId ? { id: cvId, userId } : { userId },
    orderBy: { updatedAt: "desc" },
    select: STUDENT_CV_SELECT,
  });
}

export async function getOwnCvs(userId: string) {
  return db.cv.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      templateId: true,
      language: true,
      isVisible: true,
      isPaid: true,
      savedAt: true,
      updatedAt: true,
      skills: true,
      _count: {
        select: { applications: true },
      },
    },
  });
}

export type MatchingVacancyPreview = {
  id: string;
  title: string;
  companyName: string;
  workType: WorkType | null;
  salaryFrom: number | null;
  salaryTo: number | null;
  currency: string;
  skills: string[];
  matchScore: number;
};

/**
 * Talabaning CV ko'nikmalari va kasbiy unvoniga mos faol vakansiyalarni qaytaradi.
 */
export async function getMatchingVacanciesForCv(
  cvData: CvData,
  cvTitle?: string,
  limit = 6,
): Promise<MatchingVacancyPreview[]> {
  const now = new Date();
  const vacancies = await db.vacancy.findMany({
    where: {
      status: "ACTIVE",
      company: { approval: "APPROVED", user: { status: "ACTIVE" } },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      company: { select: { name: true, industry: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const { scoreVacancyForAudience } =
    await import("@/backend/vacancy/audience-match");
  const profile = {
    titles: [cvTitle ?? "", cvData.goal ?? ""].filter(Boolean),
    skills: cvData.skills,
    searchText: [
      cvTitle ?? "",
      cvData.goal ?? "",
      ...cvData.skills,
      ...cvData.experience.map((e) => `${e.position ?? ""} ${e.organization}`),
    ].join(" "),
    locations: cvData.location ? [cvData.location] : [],
    workTypes: [],
  };

  const scored = vacancies.map((v) => {
    const res = scoreVacancyForAudience(v, profile);
    return {
      id: v.id,
      title: v.title,
      companyName:
        v.company.name?.trim() || v.company.industry?.trim() || "CANDIDATOR",
      workType: v.workType,
      salaryFrom: v.salaryFrom,
      salaryTo: v.salaryTo,
      currency: v.currency,
      skills: v.skills.slice(0, 5),
      matchScore: res.isAudienceMatch ? res.matchScore : 25,
      isAudienceMatch: res.isAudienceMatch,
    };
  });

  scored.sort((a, b) => {
    if (a.isAudienceMatch !== b.isAudienceMatch) {
      return a.isAudienceMatch ? -1 : 1;
    }
    return b.matchScore - a.matchScore;
  });
  return scored.slice(0, limit);
}

/**
 * "Saqlash": CV ni bazaga yozadi, savedAt ni yangilaydi (CV versiyasi o'zgaradi).
 * Ko'rinish (isVisible) bu yerda o'zgartirilmaydi: yangi CV standart bo'yicha yashirin.
 */
export async function saveOwnCv(
  userId: string,
  input: CvSaveInput,
  cvId?: string,
): Promise<StudentCv> {
  if (!(await activeResult(userId))) throw new ApiError(403, "FORBIDDEN");
  const targetCvId = cvId ?? input.cvId;
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
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
    ...(input.privacy !== undefined ? { privacy: input.privacy } : {}),
  };

  if (input.createNew) {
    return db.cv.create({
      data: { userId, isVisible: false, isPaid: false, ...fields },
      select: STUDENT_CV_SELECT,
    });
  }

  if (targetCvId) {
    const existing = await db.cv.findFirst({
      where: { id: targetCvId, userId },
    });
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND");
    }
    return db.cv.update({
      where: { id: targetCvId },
      data: fields,
      select: STUDENT_CV_SELECT,
    });
  }

  const existing = await db.cv.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return db.cv.update({
      where: { id: existing.id },
      data: fields,
      select: STUDENT_CV_SELECT,
    });
  }

  return db.cv.create({
    data: { userId, isVisible: false, isPaid: false, ...fields },
    select: STUDENT_CV_SELECT,
  });
}

export async function deleteOwnCv(userId: string, cvId: string): Promise<void> {
  const deleted = await db.cv.deleteMany({
    where: { id: cvId, userId },
  });
  if (deleted.count === 0) {
    throw new ApiError(404, "NOT_FOUND");
  }
}

export async function setOwnCvVisibility(
  userId: string,
  isVisible: boolean,
  cvId?: string,
): Promise<StudentCv> {
  const cv = await db.cv.findFirst({
    where: cvId ? { id: cvId, userId } : { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, savedAt: true, isPaid: true },
  });
  // Saqlanmagan yoki to'lanmagan CV ni ochiq qilib bo'lmaydi.
  if (!cv?.savedAt) throw new ApiError(409, "CV_NOT_SAVED");
  if (isVisible && !cv.isPaid) {
    throw new ApiError(402, "CV_PAYMENT_REQUIRED");
  }
  return db.cv.update({
    where: { id: cv.id },
    data: { isVisible },
    select: STUDENT_CV_SELECT,
  });
}
