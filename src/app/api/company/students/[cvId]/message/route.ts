import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/backend/auth/rate-limit";
import { sendMessage } from "@/backend/chat/service";
import { requireApprovedCompany } from "@/backend/company/access";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { isCompanySubscribedOrUnlocked } from "@/backend/payment/service";

const directMessageSchema = z.object({
  vacancyId: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined)),
  text: z.string().trim().max(2000).optional(),
});

export const POST = route<{ params: Promise<{ cvId: string }> }>(
  async (request, context) => {
    const { user, company } = await requireApprovedCompany(request);
    rateLimit(`company-dm:${company.id}`, { max: 30, windowMs: 10 * 60_000 });

    const { cvId } = await context.params;
    const input = await parseJson(request, directMessageSchema);

    const hasAccess = await isCompanySubscribedOrUnlocked(
      company.id,
      input.vacancyId ?? null,
    );
    if (!hasAccess) {
      throw new ApiError(402, "SUBSCRIPTION_REQUIRED");
    }

    const [cv, vacancy] = await Promise.all([
      db.cv.findFirst({
        where: {
          id: cvId,
          isVisible: true,
          savedAt: { not: null },
          user: { status: "ACTIVE" },
        },
        select: { id: true, userId: true },
      }),
      input.vacancyId
        ? db.vacancy.findFirst({
            where: { id: input.vacancyId, companyId: company.id },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!cv) {
      throw new ApiError(404, "NOT_FOUND");
    }
    if (input.vacancyId && !vacancy) {
      throw new ApiError(404, "VACANCY_NOT_FOUND");
    }

    const existing = await db.conversation.findFirst({
      where: {
        companyId: company.id,
        studentId: cv.userId,
        vacancyId: vacancy?.id ?? null,
      },
      select: { id: true, status: true },
    });

    const conversation = existing
      ? await db.conversation.update({
          where: { id: existing.id },
          data: { studentCvId: cv.id },
          select: { id: true },
        })
      : await db.conversation.create({
          data: {
            companyId: company.id,
            studentId: cv.userId,
            vacancyId: vacancy?.id ?? null,
            studentCvId: cv.id,
          },
          select: { id: true },
        });

    if (input.text && input.text.trim().length > 0) {
      await sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        senderRole: "COMPANY",
        text: input.text.trim(),
      });
    }

    return NextResponse.json({
      ok: true,
      conversationId: conversation.id,
    });
  },
);
