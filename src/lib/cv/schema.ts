import { z } from "zod";

/** Talaba erkin matnining eng ko'p uzunligi (Unicode belgilar). */
export const CV_TEXT_MAX = 3000;

/**
 * AI qaytaradigan CV qismi. Ism va aloqa bu yerda YO'Q: ular AI ga yuborilmaydi,
 * formadan va akkauntdan olinadi. Matnda yo'q ma'lumot uchun null yoki bo'sh ro'yxat.
 */
export const aiCvDraftSchema = z.object({
  goal: z.string().nullable(),
  location: z.string().nullable(),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().nullable(),
      field: z.string().nullable(),
      startYear: z.string().nullable(),
      endYear: z.string().nullable(),
    }),
  ),
  experience: z.array(
    z.object({
      organization: z.string(),
      position: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      description: z.string().nullable(),
    }),
  ),
  skills: z.array(z.string()),
  languages: z.array(
    z.object({ name: z.string(), level: z.string().nullable() }),
  ),
  certificates: z.array(z.string()),
});

export type AiCvDraft = z.infer<typeof aiCvDraftSchema>;

/** Bazada (Cv.data) saqlanadigan to'liq CV. */
export const cvDataSchema = aiCvDraftSchema.extend({
  fullName: z.string().nullable(),
  contact: z.object({
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
});

export type CvData = z.infer<typeof cvDataSchema>;

/** "To'ldiring" deb belgilanadigan maydonlar. */
export const CV_FIELDS = [
  "fullName",
  "phone",
  "email",
  "goal",
  "location",
  "education",
  "experience",
  "skills",
  "languages",
  "certificates",
] as const;

export type CvField = (typeof CV_FIELDS)[number];

export function missingFields(cv: CvData): CvField[] {
  const empty = (value: string | null) => !value || value.trim() === "";
  const checks: Record<CvField, boolean> = {
    fullName: empty(cv.fullName),
    phone: empty(cv.contact.phone),
    email: empty(cv.contact.email),
    goal: empty(cv.goal),
    location: empty(cv.location),
    education: cv.education.length === 0,
    experience: cv.experience.length === 0,
    skills: cv.skills.length === 0,
    languages: cv.languages.length === 0,
    certificates: cv.certificates.length === 0,
  };
  return CV_FIELDS.filter((field) => checks[field]);
}
