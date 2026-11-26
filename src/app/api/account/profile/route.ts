import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { isValidImageDataUrl } from "@/backend/company/logo";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: "FIELD_TOO_LONG" })
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v ? v : null));

const profilePatchSchema = z.object({
  fullName: nullableText(100),
  phone: nullableText(50),
  city: nullableText(100),
  educationSummary: nullableText(180),
  avatarUrl: z
    .string()
    .trim()
    .max(260_000, { error: "FILE_TOO_LARGE" })
    .nullable()
    .optional()
    .refine((v) => !v || isValidImageDataUrl(v), {
      error: "FILE_TYPE_NOT_ALLOWED",
    }),
  locale: z.enum(["kk", "uz", "ru", "en"]).optional(),
});

export const PATCH = route(async (request) => {
  const sessionUser = await requireRole(request);
  rateLimit(`account-profile:${sessionUser.id}`, {
    max: 30,
    windowMs: 10 * 60_000,
  });

  const input = await parseJson(request, profilePatchSchema, 400_000);

  const userData: Prisma.UserUpdateInput = {};
  if (input.fullName !== undefined) userData.fullName = input.fullName;
  if (input.phone !== undefined) userData.phone = input.phone;
  if (input.city !== undefined) userData.city = input.city;
  if (input.educationSummary !== undefined) {
    userData.educationSummary = input.educationSummary;
  }
  if (input.avatarUrl !== undefined) userData.avatarUrl = input.avatarUrl;
  if (input.locale !== undefined) userData.locale = input.locale;

  const updated = await db.user.update({
    where: { id: sessionUser.id },
    data: userData,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      city: true,
      educationSummary: true,
      avatarUrl: true,
      locale: true,
    },
  });

  // Talabaning oxirgi CV si bo'lsa, asosiy shaxsiy maydonlarni u bilan ham sinxronlaymiz.
  if (
    sessionUser.role === "STUDENT" &&
    (input.fullName !== undefined ||
      input.phone !== undefined ||
      input.city !== undefined ||
      input.avatarUrl !== undefined)
  ) {
    const latestCv = await db.cv.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, data: true, location: true },
    });

    if (
      latestCv &&
      typeof latestCv.data === "object" &&
      latestCv.data !== null &&
      !Array.isArray(latestCv.data)
    ) {
      const prev = latestCv.data as Record<string, unknown>;
      const prevContact =
        typeof prev.contact === "object" &&
        prev.contact !== null &&
        !Array.isArray(prev.contact)
          ? (prev.contact as Record<string, unknown>)
          : { email: updated.email, phone: null };

      const nextData: Record<string, unknown> = {
        ...prev,
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.city !== undefined ? { location: input.city } : {}),
        ...(input.avatarUrl !== undefined ? { photo: input.avatarUrl } : {}),
        contact: {
          ...prevContact,
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
        },
      };

      await db.cv.update({
        where: { id: latestCv.id },
        data: {
          data: nextData as Prisma.InputJsonValue,
          ...(input.city !== undefined ? { location: input.city } : {}),
        },
      });
    }
  }

  return NextResponse.json({ ok: true, profile: updated });
});
