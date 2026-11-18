import { PaymentStatus, Role } from "@prisma/client";
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
import { completePayment } from "@/backend/payment/service";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(400).optional(),
});

export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const { id } = await params;
    const { action, reason } = await parseJson(request, reviewSchema);

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        purpose: true,
        amount: true,
        externalId: true,
      },
    });

    if (!payment) {
      throw new ApiError(404, "PAYMENT_NOT_FOUND");
    }

    const label = payment.externalId ?? payment.id.slice(-6);
    const thread = await ensureSupportThread(payment.userId);

    if (action === "APPROVE") {
      const updated = await completePayment(payment.id);
      await sendSupportMessage({
        threadId: thread.id,
        senderId: admin.id,
        senderRole: Role.ADMIN,
        text: `✅ To'lovingiz (#${label} — ${payment.amount.toLocaleString("en-US")} so'm) admin tomonidan qabul qilindi! CV va xizmat faollashtirildi.`,
      });
      return NextResponse.json({ ok: true, status: updated.status });
    }

    const rejected = await db.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    await sendSupportMessage({
      threadId: thread.id,
      senderId: admin.id,
      senderRole: Role.ADMIN,
      text: `❌ To'lov cheki (#${label}) rad etildi.${reason ? ` Sabab: ${reason}` : " Iltimos, to'g'ri to'lov cheki rasmini qayta yuboring."}`,
    });

    return NextResponse.json({ ok: true, status: rejected.status });
  },
);
