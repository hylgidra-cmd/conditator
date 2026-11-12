import { z } from "zod";

// Server muhit o'zgaruvchilari. Build vaqtida emas, birinchi ishlatilganda tekshiriladi.
// Login va ro'yxatdan o'tish uchun bularning hech biri shart emas (Vercel'da faqat DATABASE_URL yetadi).
// AUTH_SECRET va email (Resend yoki SMTP) faqat parol tiklash uchun kerak.
const schema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET kamida 32 belgi bo'lishi kerak")
    .optional(),
  // Email: RESEND_API_KEY bo'lsa Resend (Vercel uchun), aks holda SMTP.
  RESEND_API_KEY: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  // Jo'natuvchi manzil. Resend da tasdiqlangan domen bo'lishi kerak.
  EMAIL_FROM: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  // Bo'sh qatorlar (.env dagi `SMTP_HOST=`) "yo'q" deb hisoblanadi.
  const values = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== ""),
  );
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Muhit o'zgaruvchilari noto'g'ri yoki yo'q: ${fields}`);
  }
  const env = parsed.data;
  if (
    env.APP_URL.startsWith("https://") &&
    env.AUTH_SECRET?.startsWith("dev-only")
  ) {
    throw new Error(
      "Production uchun AUTH_SECRET almashtirilmagan (dev-only qiymat).",
    );
  }
  cached = env;
  return env;
}

/** Xat jo'natuvchi manzili (EMAIL_FROM, eski nomi SMTP_FROM). */
export function emailFrom(): string | undefined {
  const env = serverEnv();
  return env.EMAIL_FROM ?? env.SMTP_FROM;
}

/** Parol tiklash xatini yuborish mumkinmi: AUTH_SECRET, jo'natuvchi va Resend yoki SMTP sozlangan. */
export function emailConfigured(): boolean {
  const env = serverEnv();
  const transport = Boolean(
    env.RESEND_API_KEY || (env.SMTP_HOST && env.SMTP_PORT),
  );
  return Boolean(env.AUTH_SECRET && emailFrom() && transport);
}

const aiSchema = z.object({
  AI_PROVIDER: z.enum(["anthropic"]).default("anthropic"),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL_CV: z.string().min(1).default("claude-haiku-5-5"),
  AI_MODEL_MATCH: z.string().min(1).default("claude-sonnet-5-5"),
});

export type AiEnv = z.infer<typeof aiSchema>;

/** AI sozlamalari (auth ishlashi uchun shart emas, shuning uchun alohida). */
export function aiEnv(): AiEnv {
  const parsed = aiSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`AI sozlamalari noto'g'ri: ${fields}`);
  }
  return parsed.data;
}
