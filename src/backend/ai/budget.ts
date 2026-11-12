import { Prisma } from "@prisma/client";
import { db } from "@/backend/db";

/** $ / 1M token. Manba: Anthropic narxlari (2026-10). Yangi model qo'shilsa shu yerga yoziladi. */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5-5": { input: 4, output: 20 },
};
// Noma'lum model uchun ehtiyotkor (qimmat) narx: limit kam hisoblanib ketmasligi uchun.
const FALLBACK_PRICE = { input: 10, output: 50 };

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
