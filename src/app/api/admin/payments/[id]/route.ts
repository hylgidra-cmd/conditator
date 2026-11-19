import { PaymentStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import {
  ensureSupportThread,
  sendSupportMessage,
} from "@/backend/chat/support-service";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { completePayment } from "@/backend/payment/service";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(400).optional(),
});

export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    rateLimit(`admin-pay:${admin.id}`, { max: 60, windowMs: 60_000 });
    const { id } = await params;
    const { action, reason } = await parseJson(request, reviewSchema);

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        companyId: true,
        status: true,
        purpose: true,
        amount: true,
        externalId: true,
      },
    });

    if (!payment) {
      throw new ApiError(404, "PAYMENT_NOT_FOUND");
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ApiError(409, "VALIDATION");
    }

    const label = payment.externalId ?? payment.id.slice(-6);
    const thread = await ensureSupportThread(payment.userId);

    if (action === "APPROVE") {
      const updated = await completePayment(payment.id);
      if (updated.status !== PaymentStatus.COMPLETED) {
        throw new ApiError(409, "VALIDATION");
      }
      await writeAdminLog({
        adminId: admin.id,
        action: "SUBSCRIPTION_SET",
        targetType: "Payment",
        targetId: payment.id,
        details: {
          decision: "APPROVE",
          purpose: payment.purpose,
          amount: payment.amount,
          externalId: payment.externalId,
        },
      });
      await sendSupportMessage({
        threadId: thread.id,
        senderId: admin.id,
        senderRole: Role.ADMIN,
        text: `✅ To'lovingiz (#${label} — ${payment.amount.toLocaleString("en-US")} so'm) admin tomonidan qabul qilindi! Xizmat darhol faollashtirildi.`,
      });
      return NextResponse.json({ ok: true, status: updated.status });
    }

    const rejected = await db.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED },
    });
    if (rejected.count === 0) {
      throw new ApiError(409, "VALIDATION");
    }

    await writeAdminLog({
      adminId: admin.id,
      action: "SUBSCRIPTION_OFF",
      targetType: "Payment",
      targetId: payment.id,
      details: {
        decision: "REJECT",
        purpose: payment.purpose,
        amount: payment.amount,
        reason: reason ?? null,
      },
    });

    await sendSupportMessage({
      threadId: thread.id,
      senderId: admin.id,
      senderRole: Role.ADMIN,
      text: `❌ To'lov cheki (#${label}) rad etildi.${reason ? ` Sabab: ${reason}` : " Iltimos, to'g'ri to'lov cheki rasmini qayta yuboring."}`,
    });

    return NextResponse.json({ ok: true, status: PaymentStatus.FAILED });
  },
);
