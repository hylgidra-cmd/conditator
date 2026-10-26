import type { User } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import { sendResetEmail } from "@/lib/email/auth-emails";
import { ApiError } from "@/lib/http/errors";
import { consumeCode, issueCode } from "./email-code";
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

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return;
  await sendResetCodeQuietly(user);
}

export async function resetPassword(
  input: z.infer<typeof resetSchema>,
): Promise<void> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) throw new ApiError(400, "CODE_INVALID");

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
