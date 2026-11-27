import { createHmac, timingSafeEqual } from "node:crypto";
import type { User } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/backend/db";
import { sendLogin2faEmail, sendResetEmail } from "@/backend/email/auth-emails";
import { emailConfigured, serverEnv } from "@/backend/env";
import { ApiError } from "@/backend/http/errors";
import { CODE_TTL_MS, consumeCode, issueCode } from "./email-code";
import { hashPassword, verifyPassword } from "./password";
import type { loginSchema, registerSchema, resetSchema } from "./schemas";

// Mavjud bo'lmagan email bilan kirishda ham parol tekshiruvi vaqti bir xil bo'lishi uchun.
const DUMMY_HASH_PROMISE = hashPassword("dummy-password-for-timing");

/** Parol tiklash kodini yuboradi; kutish vaqti xatosini yashiradi (email mavjudligini oshkor qilmaslik uchun). */
async function sendResetCodeQuietly(
  user: Pick<User, "id" | "email" | "locale">,
) {
  try {
    const code = await issueCode(user.id, "RESET");
    await sendResetEmail(user.email, user.locale, code);
  } catch (error) {
    if (error instanceof ApiError && error.code === "RESEND_TOO_SOON") return;
    throw error;
  }
}

/** Ro'yxatdan o'tish: email va parol yetarli, emailga kod yuborilmaydi. Keyin foydalanuvchi o'zi kiradi. */
export async function register(
  input: z.infer<typeof registerSchema>,
): Promise<void> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, "EMAIL_TAKEN");

  await db.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      locale: input.locale,
      consentAt: new Date(),
      ...(input.role === "COMPANY" ? { company: { create: {} } } : {}),
    },
  });
}

export async function login(input: z.infer<typeof loginSchema>): Promise<User> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  const valid = await verifyPassword(
    user?.passwordHash ?? (await DUMMY_HASH_PROMISE),
    input.password,
  );
  if (!user || !valid) throw new ApiError(401, "INVALID_CREDENTIALS");
  if (user.status === "BLOCKED") throw new ApiError(403, "ACCOUNT_BLOCKED");
  return user;
}

function twoFactorSecret(): string {
  const secret = serverEnv().AUTH_SECRET;
  if (!secret) throw new ApiError(503, "EMAIL_UNAVAILABLE");
  return secret;
}

function signChallengePayload(payloadB64: string): string {
  return createHmac("sha256", twoFactorSecret())
    .update(`login-2fa:${payloadB64}`)
    .digest("base64url");
}

/** Parol tasdiqlangandan keyin 2FA yoqilgan foydalanuvchi uchun 6 xonali email kodi va imzolangan token yaratadi. */
export async function issueLogin2faChallenge(
  user: Pick<User, "id" | "email" | "locale">,
): Promise<string> {
  if (!emailConfigured()) throw new ApiError(503, "EMAIL_UNAVAILABLE");
  try {
    const code = await issueCode(user.id, "LOGIN_2FA");
    await sendLogin2faEmail(user.email, user.locale, code);
  } catch (error) {
    if (!(error instanceof ApiError && error.code === "RESEND_TOO_SOON")) {
      throw error;
    }
  }
  const exp = Date.now() + CODE_TTL_MS;
  const payloadB64 = Buffer.from(
    JSON.stringify({ uid: user.id, exp }),
    "utf8",
  ).toString("base64url");
  const sig = signChallengePayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

/** 2FA tokeni va 6 xonali kodni tekshirib foydalanuvchini qaytaradi. */
export async function verifyLogin2fa(
  challengeToken: string,
  code: string,
): Promise<User> {
  const parts = challengeToken.split(".");
  if (parts.length !== 2) throw new ApiError(400, "TWO_FACTOR_EXPIRED");
  const [payloadB64, providedSig] = parts;
  const expectedSig = signChallengePayload(payloadB64);
  const a = Buffer.from(providedSig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError(400, "TWO_FACTOR_EXPIRED");
  }

  let parsed: { uid?: unknown; exp?: unknown };
  try {
    parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as { uid?: unknown; exp?: unknown };
  } catch {
    throw new ApiError(400, "TWO_FACTOR_EXPIRED");
  }
  if (
    typeof parsed.uid !== "string" ||
    typeof parsed.exp !== "number" ||
    parsed.exp <= Date.now()
  ) {
    throw new ApiError(400, "TWO_FACTOR_EXPIRED");
  }

  const user = await db.user.findUnique({ where: { id: parsed.uid } });
  if (!user) throw new ApiError(400, "TWO_FACTOR_EXPIRED");
  if (user.status === "BLOCKED") throw new ApiError(403, "ACCOUNT_BLOCKED");

  await consumeCode(user.id, "LOGIN_2FA", code);
  return user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  // Email mavjudligini oshkor qilmaslik uchun foydalanuvchini qidirishdan oldin tekshiriladi.
  if (!emailConfigured()) throw new ApiError(503, "EMAIL_UNAVAILABLE");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return;
  await sendResetCodeQuietly(user);
}

export async function resetPassword(
  input: z.infer<typeof resetSchema>,
): Promise<void> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || user.status !== "ACTIVE") throw new ApiError(400, "CODE_INVALID");

  await consumeCode(user.id, "RESET", input.code);
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(input.password),
        // Kodni emaildan olgani email egasi ekanini ham tasdiqlaydi.
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);
}
