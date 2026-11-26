import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/backend/auth/rate-limit";
import { requireCompany } from "@/backend/company/access";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "CLOSED"]),
});

type Context = { params: Promise<{ id: string }> };

export const PATCH = route<Context>(async (request, { params }) => {
  const { company } = await requireCompany(request);
  rateLimit(`vacancy-status:${company.id}`, {
    max: 60,
    windowMs: 10 * 60_000,
  });

  const { id } = await params;
  const { status } = await parseJson(request, statusSchema);

  const existing = await db.vacancy.findFirst({
    where: { id, companyId: company.id },
    select: { id: true, expiresAt: true },
  });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND");
  }

  const now = new Date();
  const refreshExpiry =
    status === "ACTIVE" && (!existing.expiresAt || existing.expiresAt <= now);

  const updated = await db.vacancy.update({
    where: { id: existing.id },
    data: {
      status,
      ...(refreshExpiry
        ? { expiresAt: new Date(now.getTime() + FIFTEEN_DAYS_MS) }
        : {}),
    },
    select: { id: true, status: true },
  });

  try {
    revalidateTag("landing-stats");
  } catch {
    // ignore outside Next cache context
  }

  return NextResponse.json({ ok: true, vacancy: updated });
});
