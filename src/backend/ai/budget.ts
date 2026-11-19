import { Prisma } from "@prisma/client";
import { db } from "@/backend/db";

/** $ / 1M token. Yangi model qo'shilsa shu yerga yoziladi. */
const PRICES: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "claude-haiku-4-5": { input: 0.8, output: 4 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5-5": { input: 4, output: 20 },
};
// Noma'lum model uchun ehtiyotkor narx: limit kam hisoblanib ketmasligi uchun.
const FALLBACK_PRICE = { input: 2, output: 10 };

export function costUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = PRICES[model] ?? FALLBACK_PRICE;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

export const AI_LIMIT_SETTING = "monthlyAiLimitUsd";

export function monthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function monthlyLimitUsd(): Promise<number> {
  const setting = await db.setting.findUnique({
    where: { key: AI_LIMIT_SETTING },
  });
  const value = Number(
    setting?.value ?? process.env.AI_MONTHLY_LIMIT_USD ?? 50,
  );
  return Number.isFinite(value) && value >= 0 ? value : 50;
}

/** Shu oy (UTC) boshidan beri AI ga sarflangan summa. */
export async function spentThisMonthUsd(): Promise<number> {
  const result = await db.aiLog.aggregate({
    _sum: { costUsd: true },
    where: { createdAt: { gte: monthStart() } },
  });
  return (result._sum.costUsd ?? new Prisma.Decimal(0)).toNumber();
}

export async function isMonthlyLimitReached(): Promise<boolean> {
  const [spent, limit] = await Promise.all([
    spentThisMonthUsd(),
    monthlyLimitUsd(),
  ]);
  return spent >= limit;
}
