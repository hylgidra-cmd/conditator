import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { parsePrivacy } from "@/backend/cv/privacy";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const privacyPatchSchema = z.object({
  cvId: z.string().trim().max(100).optional(),
  isVisible: z.boolean().optional(),
  privacy: z
    .object({
      hideName: z.boolean().optional(),
      hidePhone: z.boolean().optional(),
      hideEmail: z.boolean().optional(),
      hideAddress: z.boolean().optional(),
      hidePhoto: z.boolean().optional(),
    })
    .optional(),
});

export const PATCH = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  rateLimit(`account-privacy:${user.id}`, { max: 30, windowMs: 10 * 60_000 });

  const input = await parseJson(request, privacyPatchSchema);

  const existing = await db.cv.findFirst({
    where: input.cvId ? { id: input.cvId, userId: user.id } : { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      privacy: true,
      isVisible: true,
      isPaid: true,
      savedAt: true,
    },
  });

  if (!existing) {
    if (input.isVisible) {
      throw new ApiError(409, "CV_NOT_SAVED");
    }
    const mergedPrivacy = {
      ...parsePrivacy(null),
      ...(input.privacy ?? {}),
    };
    const created = await db.cv.create({
      data: {
        userId: user.id,
        isVisible: false,
        isPaid: false,
        privacy: mergedPrivacy,
      },
      select: { id: true, isVisible: true, privacy: true },
    });
    return NextResponse.json({
      ok: true,
      cvId: created.id,
      isVisible: created.isVisible,
      privacy: parsePrivacy(created.privacy),
    });
  }

  let nextVisible = existing.isVisible;
  if (input.isVisible !== undefined) {
    if (input.isVisible) {
      if (!existing.savedAt) throw new ApiError(409, "CV_NOT_SAVED");
      if (!existing.isPaid) throw new ApiError(402, "CV_PAYMENT_REQUIRED");
    }
    nextVisible = input.isVisible;
  }

  const nextPrivacy = {
    ...parsePrivacy(existing.privacy),
    ...(input.privacy ?? {}),
  };

  const updated = await db.cv.update({
    where: { id: existing.id },
    data: {
      isVisible: nextVisible,
      privacy: nextPrivacy,
    },
    select: { id: true, isVisible: true, privacy: true },
  });

  return NextResponse.json({
    ok: true,
    cvId: updated.id,
    isVisible: updated.isVisible,
    privacy: parsePrivacy(updated.privacy),
  });
});
