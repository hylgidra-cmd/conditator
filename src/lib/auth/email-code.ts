import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { EmailCodePurpose } from "@prisma/client";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/errors";

export const CODE_TTL_MS = 10 * 60_000;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_RESEND_COOLDOWN_MS = 60_000;

/** 6 xonali kod xeshi. HMAC sirli kalit bilan: baza sizib chiqsa ham kodni tanlab topib bo'lmaydi. */
export function hashCode(
  userId: string,
  purpose: EmailCodePurpose,
  code: string,
): string {
  return createHmac("sha256", serverEnv().AUTH_SECRET)
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
