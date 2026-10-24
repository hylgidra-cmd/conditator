import { z } from "zod";

// Xabarlar — xato kodlari; matni messages/*.json dagi "Errors" bo'limida.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z.email({ error: "INVALID_EMAIL" }).max(254, { error: "INVALID_EMAIL" }),
  );

export const passwordSchema = z
  .string({ error: "PASSWORD_TOO_SHORT" })
  .min(8, { error: "PASSWORD_TOO_SHORT" })
  .max(128, { error: "PASSWORD_TOO_LONG" });

export const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { error: "CODE_FORMAT" });

export const localeSchema = z.enum(["kk", "uz", "ru", "en"]).catch("uz");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  // Admin ro'yxatdan o'tish orqali yaratilmaydi: faqat talaba yoki kompaniya.
  role: z.enum(["STUDENT", "COMPANY"], { error: "ROLE_REQUIRED" }),
  consent: z.literal(true, { error: "CONSENT_REQUIRED" }),
  locale: localeSchema,
});

export const verifySchema = z.object({ email: emailSchema, code: codeSchema });
export const emailOnlySchema = z.object({ email: emailSchema });
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "PASSWORD_REQUIRED" }).max(128),
});
export const resetSchema = z.object({
  email: emailSchema,
  code: codeSchema,
  password: passwordSchema,
});
