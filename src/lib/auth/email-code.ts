import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { EmailCodePurpose } from "@prisma/client";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/errors";

export const CODE_TTL_MS = 10 * 60_000;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_RESEND_COOLDOWN_MS = 60_000;
/** Bir foydalanuvchi uchun 24 soatdagi noto'g'ri urinishlar chegarasi (barcha kodlar bo'yicha). */
export const CODE_DAILY_MAX_FAILURES = 15;
const DAY_MS = 24 * 60 * 60_000;

/** 6 xonali kod xeshi. HMAC sirli kalit bilan: baza sizib chiqsa ham kodni tanlab topib bo'lmaydi. */
export function hashCode(
  userId: string,
  purpose: EmailCodePurpose,
  code: string,
): string {
  const secret = serverEnv().AUTH_SECRET;
  if (!secret) throw new ApiError(503, "EMAIL_UNAVAILABLE");
  return createHmac("sha256", secret)
    .update(`${userId}:${purpose}:${code}`)
    .digest("hex");
}

/**
 * Yangi kod yaratadi va bazaga faqat xeshini yozadi. Avvalgi faol kodlar bekor qilinadi.
 * Qaytgan kod faqat email xatiga qo'yiladi: javobga ham, logga ham yozilmaydi.
 */
export async function issueCode(
  userId: string,
  purpose: EmailCodePurpose,
): Promise<string> {
  const last = await db.emailCode.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (last && Date.now() - last.createdAt.getTime() < CODE_RESEND_COOLDOWN_MS) {
    throw new ApiError(429, "RESEND_TOO_SOON");
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.$transaction([
    db.emailCode.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.emailCode.create({
      data: {
        userId,
        purpose,
        codeHash: hashCode(userId, purpose, code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    }),
  ]);
  return code;
}

/** Kodni tekshiradi. To'g'ri bo'lsa ishlatilgan deb belgilaydi; aks holda ApiError tashlaydi. */
export async function consumeCode(
  userId: string,
  purpose: EmailCodePurpose,
  code: string,
): Promise<void> {
  // Kod qayta-qayta so'ralib, tanlab topishga urinishning oldini oladi (IP ga bog'liq emas).
  const { _sum } = await db.emailCode.aggregate({
    where: {
      userId,
      purpose,
      createdAt: { gte: new Date(Date.now() - DAY_MS) },
    },
    _sum: { attempts: true },
  });
  if ((_sum.attempts ?? 0) >= CODE_DAILY_MAX_FAILURES) {
    throw new ApiError(429, "CODE_DAILY_LIMIT");
  }

  const active = await db.emailCode.findFirst({
    where: { userId, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!active || active.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, "CODE_EXPIRED");
  }
  if (active.attempts >= CODE_MAX_ATTEMPTS) {
    throw new ApiError(400, "CODE_LOCKED");
  }

  const expected = Buffer.from(active.codeHash, "hex");
  const actual = Buffer.from(hashCode(userId, purpose, code), "hex");
  if (!timingSafeEqual(expected, actual)) {
    const { attempts } = await db.emailCode.update({
      where: { id: active.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ApiError(
      400,
      attempts >= CODE_MAX_ATTEMPTS ? "CODE_LOCKED" : "CODE_INVALID",
    );
  }

  // Bir vaqtdagi ikki so'rov bitta kodni ikki marta ishlata olmasligi uchun shartli yangilash.
  const { count } = await db.emailCode.updateMany({
    where: { id: active.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (count === 0) throw new ApiError(400, "CODE_EXPIRED");
}
