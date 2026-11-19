import { randomBytes } from "node:crypto";
import { PaymentProvider, PaymentPurpose, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import {
  ensureSupportThread,
  sendSupportMessage,
} from "@/backend/chat/support-service";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  CV_CREATION_PRICE_UZS,
  MANUAL_CARD_HOLDER,
  MANUAL_CARD_NUMBER,
  WEEKLY_PASS_PRICE_UZS,
} from "@/backend/payment/service";
import { getCompanySubscriptionPlan } from "@/backend/payment/plans";

const DATA_URL_RE = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

const manualSubmitSchema = z.object({
  purpose: z.nativeEnum(PaymentPurpose),
  planId: z.enum(["START_7", "STANDARD_15", "PRO_30"]).optional(),
  cvId: z.string().min(1).max(64).optional(),
  vacancyId: z.string().min(1).max(64).optional(),
  receiptDataUrl: z
    .string()
    .max(2_500_000)
    .refine((v) => DATA_URL_RE.test(v), "INVALID_RECEIPT_IMAGE"),
  note: z.string().trim().max(400).optional(),
});

const PURPOSE_LABELS: Record<PaymentPurpose, string> = {
  CV_CREATION: "CV yaratish va faollashtirish",
  WEEKLY_APPLY_PASS: "7 kunlik ariza yuborish ruxsatnomasi",
  VACANCY_UNLOCK:
    "Kompaniya Obunasi (Abuna) — Barcha CV kontaktlari va PDF larni ochish",
};

export const POST = route(async (request) => {
  const user = await requireRole(request);
  const input = await parseJson(request, manualSubmitSchema);

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
  }

  if (input.purpose === PaymentPurpose.VACANCY_UNLOCK || input.vacancyId) {
    if (!companyId) throw new ApiError(403, "FORBIDDEN");
    if (input.vacancyId) {
      const vacancy = await db.vacancy.findFirst({
        where: { id: input.vacancyId, companyId },
        select: { id: true },
      });
      if (!vacancy) throw new ApiError(404, "VACANCY_NOT_FOUND");
    }
  }

  const companyPlan =
    input.purpose === PaymentPurpose.VACANCY_UNLOCK
      ? getCompanySubscriptionPlan(input.planId)
      : null;

  const amount = companyPlan
    ? companyPlan.priceUzs
    : input.purpose === PaymentPurpose.WEEKLY_APPLY_PASS
      ? WEEKLY_PASS_PRICE_UZS
      : CV_CREATION_PRICE_UZS;

  const externalId = `CHEK-${Date.now().toString().slice(-6)}-${randomBytes(2).toString("hex").toUpperCase()}`;

  const payment = await db.payment.create({
    data: {
      userId: user.id,
      companyId,
      vacancyId: input.vacancyId,
      cvId: input.cvId,
      amount,
      purpose: input.purpose,
      provider: PaymentProvider.CLICK,
      status: PaymentStatus.PENDING,
      externalId,
      transactionDetails: {
        type: "MANUAL_CARD",
        cardNumber: MANUAL_CARD_NUMBER,
        cardHolder: MANUAL_CARD_HOLDER,
        receiptDataUrl: input.receiptDataUrl,
        note: input.note ?? null,
        submittedAt: new Date().toISOString(),
        ...(companyPlan
          ? {
              planId: companyPlan.id,
              planName: companyPlan.name,
              durationDays: companyPlan.days,
            }
          : {}),
      },
    },
  });

  // Automatically post receipt message into the user's SupportThread so Admin sees it in Support Chat too
  const thread = await ensureSupportThread(user.id);
  const serviceLabel = companyPlan
    ? `Kompaniya Obunasi — ${companyPlan.name} (${companyPlan.days} kun)`
    : PURPOSE_LABELS[input.purpose];
  const supportText = [
    `💳 To'lov cheki yuborildi (#${externalId})`,
    `Xizmat: ${serviceLabel}`,
    `Summa: ${amount.toLocaleString("en-US")} so'm`,
    `Karta: ${MANUAL_CARD_NUMBER} (${MANUAL_CARD_HOLDER})`,
    input.note ? `Izoh: ${input.note}` : "",
    `[PAYMENT_RECEIPT:${payment.id}]`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendSupportMessage({
    threadId: thread.id,
    senderId: user.id,
    senderRole: user.role,
    text: supportText,
  });

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    externalId,
  });
});
