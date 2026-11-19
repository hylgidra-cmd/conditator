import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/backend/auth/password";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { passwordSchema } from "@/backend/auth/schemas";
import { createSession, requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { error: "PASSWORD_REQUIRED" })
    .max(128),
  newPassword: passwordSchema,
});

export const POST = route(async (request) => {
  const sessionUser = await requireRole(request);
  rateLimit(`verify:${clientIp(request)}:${sessionUser.id}`, LIMITS.verify);

  const { currentPassword, newPassword } = await parseJson(
    request,
    changePasswordSchema,
  );

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new ApiError(403, "ACCOUNT_BLOCKED");
  }

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) {
    throw new ApiError(401, "INVALID_CREDENTIALS");
  }

  const nextHash = await hashPassword(newPassword);
  // Parol yangilanishi bilan barcha eski sessiyalar bekor qilinadi va yangi sessiya beriladi (token rotation).
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: nextHash },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);

  const response = NextResponse.json({ ok: true });
  await createSession(response, user.id);
  return response;
});
