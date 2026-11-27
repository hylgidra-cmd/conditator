import { VacancyStatus } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "CLOSED", "CANCELLED"]),
});

type Context = { params: Promise<{ id: string }> };

export const PATCH = route<Context>(async (request, { params }) => {
  const admin = await requireRole(request, "ADMIN");
  rateLimit(`admin-vac:${admin.id}`, { max: 60, windowMs: 60_000 });
  const { id } = await params;
  const { status } = await parseJson(request, patchSchema);

  const existing = await db.vacancy.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, expiresAt: true },
  });
  if (!existing) throw new ApiError(404, "VACANCY_NOT_FOUND");

  const now = new Date();
  const refreshExpiry =
    status === VacancyStatus.ACTIVE &&
    (!existing.expiresAt || existing.expiresAt <= now);

  const updated = await db.vacancy.update({
    where: { id },
    data: {
      status,
      ...(refreshExpiry
        ? { expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) }
        : {}),
    },
    select: { id: true, status: true },
  });

  await writeAdminLog({
    adminId: admin.id,
    action: status === "ACTIVE" ? "COMPANY_APPROVE" : "COMPANY_REJECT",
    targetType: "Vacancy",
    targetId: id,
    details: {
      previousStatus: existing.status,
      newStatus: status,
      title: existing.title,
    },
  });

  try {
    revalidateTag("landing-stats");
  } catch {
    // Ignore outside Next cache
  }
  return NextResponse.json({ ok: true, status: updated.status });
});

export const DELETE = route<Context>(async (request, { params }) => {
  const admin = await requireRole(request, "ADMIN");
  rateLimit(`admin-vac:${admin.id}`, { max: 60, windowMs: 60_000 });
  const { id } = await params;

  const existing = await db.vacancy.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!existing) throw new ApiError(404, "VACANCY_NOT_FOUND");

  await db.vacancy.delete({ where: { id } });

  await writeAdminLog({
    adminId: admin.id,
    action: "COMPANY_REJECT",
    targetType: "Vacancy",
    targetId: id,
    details: { deleted: true, title: existing.title },
  });

  try {
    revalidateTag("landing-stats");
  } catch {
    // Ignore outside Next cache
  }
  return NextResponse.json({ ok: true });
});
