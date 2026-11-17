import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/backend/auth/password";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { passwordSchema } from "@/backend/auth/schemas";
import {
  deleteOtherSessions,
  getSessionUser,
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/backend/auth/session";
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
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) throw new ApiError(401, "UNAUTHORIZED");
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

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  const currentToken =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
  await deleteOtherSessions(user.id, currentToken);

  return NextResponse.json({ ok: true });
});
