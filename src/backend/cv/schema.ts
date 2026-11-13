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
  photo: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
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
  projects: z
    .array(
      z.object({
        name: z.string(),
        link: z.string().nullable().optional(),
        year: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      }),
    )
    .optional(),
  skills: z.array(z.string()),
  languages: z.array(
    z.object({ name: z.string(), level: z.string().nullable() }),
  ),
  certificates: z
    .array(
      z.union([
        z.string(),
        z.object({
          name: z.string(),
          issuer: z.string().nullable().optional(),
          year: z.string().nullable().optional(),
        }),
      ]),
    )
    .optional()
    .default([]),
  hobbies: z.array(z.string()).optional(),
});

export type AiCvDraft = z.infer<typeof aiCvDraftSchema>;

export const obyektivkaRelativeSchema = z.object({
  qarindoshligi: z.string().default(""),
  fio: z.string().default(""),
  tugilgan: z.string().default(""),
  ish: z.string().default(""),
  manzil: z.string().default(""),
});

export const obyektivkaDataSchema = z.object({
  lavozim: z.string().nullable().optional(),
  tugilganSana: z.string().nullable().optional(),
  tugilganJoy: z.string().nullable().optional(),
  millati: z.string().nullable().optional(),
  partiya: z.string().nullable().optional(),
  oqiganJoyi: z.string().nullable().optional(),
  mutaxassislik: z.string().nullable().optional(),
  ilmiyDaraja: z.string().nullable().optional(),
  ilmiyUnvon: z.string().nullable().optional(),
  harbiyUnvon: z.string().nullable().optional(),
  mukofotlar: z.string().nullable().optional(),
  deputatlik: z.string().nullable().optional(),
  uyTelefoni: z.string().nullable().optional(),
  mehnatFaoliyati: z.string().nullable().optional(),
  qarindoshlar: z.array(obyektivkaRelativeSchema).optional().default([]),
});

export type ObyektivkaData = z.infer<typeof obyektivkaDataSchema>;

/** Bazada (Cv.data) saqlanadigan to'liq CV. */
export const cvDataSchema = aiCvDraftSchema.extend({
  fullName: z.string().nullable(),
  contact: z.object({
    email: z.string().nullable(),
    phone: z.string().nullable(),
    telegram: z.string().nullable().optional(),
    github: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
  }),
  obyektivka: obyektivkaDataSchema.optional(),
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
