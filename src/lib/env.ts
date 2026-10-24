import { z } from "zod";

// Server muhit o'zgaruvchilari. Build vaqtida emas, birinchi ishlatilganda tekshiriladi.
const schema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET kamida 32 belgi bo'lishi kerak"),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().min(1),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Muhit o'zgaruvchilari noto'g'ri yoki yo'q: ${fields}`);
  }
  const env = parsed.data;
  if (
    env.APP_URL.startsWith("https://") &&
    env.AUTH_SECRET.startsWith("dev-only")
  ) {
    throw new Error(
      "Production uchun AUTH_SECRET almashtirilmagan (dev-only qiymat).",
    );
  }
  cached = env;
  return env;
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
