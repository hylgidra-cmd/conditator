import { z } from "zod";

/** Erkin matnli talabning eng ko'p uzunligi (Unicode belgilar). */
export const VACANCY_TEXT_MAX = 3000;
export const VACANCY_PAGE_SIZE = 10;
export const VACANCY_WORK_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "REMOTE",
  "INTERNSHIP",
] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: "FIELD_TOO_LONG" })
    .nullable()
    .transform((value) => (value ? value : null));

const tags = (itemMax: number, count: number) =>
  z
    .array(z.string().trim().max(itemMax, { error: "FIELD_TOO_LONG" }))
    .max(count, { error: "TOO_MANY_ITEMS" })
    // Bo'sh qiymatlar va takrorlar olib tashlanadi (katta-kichik harf farqi hisobga olinmaydi).
    .transform((items) => {
      const seen = new Set<string>();
      return items.filter((item) => {
        const key = item.toLowerCase();
        if (!item || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

/**
 * Talab: maydonlar bilan, faqat erkin matn bilan (istalgan tilda) yoki ikkalasi bilan.
 * Lavozim yoki erkin matndan kamida bittasi majburiy.
 */
export const vacancyInputSchema = z
  .object({
    title: optionalText(120),
    rawText: z
      .string()
      .trim()
      .max(VACANCY_TEXT_MAX * 2, { error: "TEXT_TOO_LONG" })
      .refine((value) => Array.from(value).length <= VACANCY_TEXT_MAX, {
        error: "TEXT_TOO_LONG",
      })
      .nullable()
      .transform((value) => (value ? value : null)),
    skills: tags(60, 30),
    languages: tags(50, 10),
    minExperienceYears: z
      .number({ error: "INVALID_NUMBER" })
      .int({ error: "INVALID_NUMBER" })
      .min(0, { error: "INVALID_NUMBER" })
      .max(50, { error: "INVALID_NUMBER" })
      .nullable(),
    location: optionalText(100),
    workType: z
      .enum(VACANCY_WORK_TYPES, { error: "FIELD_REQUIRED" })
      .nullable(),
  })
  .superRefine((value, ctx) => {
    if (!value.title && !value.rawText) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "TITLE_OR_TEXT_REQUIRED",
      });
    }
  });

export type VacancyInput = z.infer<typeof vacancyInputSchema>;

export const pageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);
