import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/backend/auth/password";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

const twoFactorPatchSchema = z.object({
  enabled: z.boolean(),
  currentPassword: z
    .string()
    .min(1, { error: "PASSWORD_REQUIRED" })
    .max(128),
});

export const PATCH = route(async (request) => {
  const sessionUser = await requireRole(request);
  rateLimit(`verify:${clientIp(request)}:${sessionUser.id}`, LIMITS.verify);

  const { enabled, currentPassword } = await parseJson(
    request,
    twoFactorPatchSchema,
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

  const updated = await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: enabled },
    select: { twoFactorEnabled: true },
  });

  return NextResponse.json({
    ok: true,
    twoFactorEnabled: updated.twoFactorEnabled,
  });
});
