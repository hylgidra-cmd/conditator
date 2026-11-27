import { PaymentPurpose, PaymentProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitDistributed } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  createPaymentOrder,
  getCheckoutRedirect,
} from "@/backend/payment/service";

const checkoutSchema = z.object({
  purpose: z.nativeEnum(PaymentPurpose),
  provider: z.nativeEnum(PaymentProvider).default(PaymentProvider.CLICK),
  vacancyId: z.string().min(1).max(64).optional(),
  cvId: z.string().min(1).max(64).optional(),
  returnUrl: z
    .string()
    .max(512)
    .refine(
      (v) => v.startsWith("/") && !v.startsWith("//") && !v.includes("\\"),
      "INVALID_RETURN",
    )
    .optional(),
});

export const POST = route(async (request) => {
  const user = await requireRole(request);
  await rateLimitDistributed(`checkout:${user.id}`, {
    max: 15,
    windowMs: 10 * 60_000,
  });
  const input = await parseJson(request, checkoutSchema);

  if (
    input.provider === PaymentProvider.TEST &&
    process.env.NODE_ENV === "production"
  ) {
    throw new ApiError(403, "FORBIDDEN");
  }

  if (
    (input.purpose === PaymentPurpose.CV_CREATION ||
      input.purpose === PaymentPurpose.WEEKLY_APPLY_PASS) &&
    user.role !== "STUDENT"
  ) {
    throw new ApiError(403, "FORBIDDEN");
  }

  if (
    input.purpose === PaymentPurpose.VACANCY_UNLOCK &&
    user.role !== "COMPANY"
  ) {
    throw new ApiError(403, "FORBIDDEN");
  }

  let companyId: string | undefined;
  if (user.role === "COMPANY") {
    const company = await db.company.findFirst({
      where: {
        OR: [{ userId: user.id }, { members: { some: { userId: user.id } } }],
      },
      select: { id: true },
    });
    companyId = company?.id;
  }

  if (input.purpose === PaymentPurpose.CV_CREATION) {
    if (!input.cvId) throw new ApiError(400, "VALIDATION");
    const cv = await db.cv.findFirst({
      where: { id: input.cvId, userId: user.id },
      select: { id: true },
    });
    if (!cv) throw new ApiError(404, "NOT_FOUND");
  } else if (input.cvId && user.role === "STUDENT") {
    const cv = await db.cv.findFirst({
      where: { id: input.cvId, userId: user.id },
      select: { id: true },
    });
    if (!cv) throw new ApiError(404, "NOT_FOUND");
  }

  if (input.purpose === PaymentPurpose.VACANCY_UNLOCK || input.vacancyId) {
    if (!companyId || !input.vacancyId) throw new ApiError(403, "FORBIDDEN");
    const vacancy = await db.vacancy.findFirst({
      where: { id: input.vacancyId, companyId },
      select: { id: true },
    });
    if (!vacancy) throw new ApiError(404, "VACANCY_NOT_FOUND");
  }

  const payment = await createPaymentOrder({
    userId: user.id,
    purpose: input.purpose,
    provider: input.provider,
    vacancyId: input.vacancyId,
    cvId: input.cvId,
    companyId,
  });

  const redirectUrl = getCheckoutRedirect(
    payment,
    input.returnUrl || `/${user.locale}/dashboard`,
  );

  return NextResponse.json({
    paymentId: payment.id,
    redirectUrl,
  });
});
