import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { PaymentPurpose, PaymentProvider, PaymentStatus } from "@prisma/client";

export const CV_CREATION_PRICE_UZS = 5_000;
export const WEEKLY_PASS_PRICE_UZS = 5_000;
export const WEEKLY_PASS_DAYS = 7;
export const VACANCY_UNLOCK_PRICE_UZS = 14_999;
export const UNLOCK_DURATION_DAYS = 15;

export type CreatePaymentInput = {
  userId: string;
  purpose: PaymentPurpose;
  provider: PaymentProvider;
  vacancyId?: string;
  cvId?: string;
  companyId?: string;
};

export async function createPaymentOrder(input: CreatePaymentInput) {
  const amount =
    input.purpose === PaymentPurpose.VACANCY_UNLOCK
      ? VACANCY_UNLOCK_PRICE_UZS
      : input.purpose === PaymentPurpose.WEEKLY_APPLY_PASS
        ? WEEKLY_PASS_PRICE_UZS
        : CV_CREATION_PRICE_UZS;

  const payment = await db.payment.create({
    data: {
      userId: input.userId,
      companyId: input.companyId,
      vacancyId: input.vacancyId,
      cvId: input.cvId,
      amount,
      purpose: input.purpose,
      provider: input.provider,
      status: PaymentStatus.PENDING,
      externalId: `CAND-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    },
  });

  return payment;
}

/**
 * Marks payment as completed and fulfills the benefit:
 * - If CV_CREATION: marks Cv.isPaid = true
 * - If VACANCY_UNLOCK: creates or updates VacancyUnlock with 15 days validity
 */
export async function completePayment(
  paymentId: string,
  externalTransactionId?: string,
) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new ApiError(404, "PAYMENT_NOT_FOUND");
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return payment;
  }

  const updatedPayment = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.COMPLETED,
      externalId: externalTransactionId ?? payment.externalId,
    },
  });

  if (payment.purpose === PaymentPurpose.CV_CREATION && payment.cvId) {
    await db.cv.update({
      where: { id: payment.cvId },
      data: { isPaid: true },
    });
  } else if (
    payment.purpose === PaymentPurpose.VACANCY_UNLOCK &&
    payment.vacancyId &&
    payment.companyId
  ) {
    const expiresAt = new Date(
      Date.now() + UNLOCK_DURATION_DAYS * 24 * 60 * 60 * 1000,
    );
    await db.vacancyUnlock.upsert({
      where: {
        vacancyId_companyId: {
          vacancyId: payment.vacancyId,
          companyId: payment.companyId,
        },
      },
      create: {
        vacancyId: payment.vacancyId,
        companyId: payment.companyId,
        paymentId: payment.id,
        paidAt: new Date(),
        expiresAt,
      },
      update: {
        paymentId: payment.id,
        paidAt: new Date(),
        expiresAt,
      },
    });
  } else if (payment.purpose === PaymentPurpose.WEEKLY_APPLY_PASS) {
    const user = await db.user.findUnique({
      where: { id: payment.userId },
      select: { applyPassUntil: true },
    });
    const now = new Date();
    const base =
      user?.applyPassUntil && user.applyPassUntil > now
        ? user.applyPassUntil
        : now;
    const nextUntil = new Date(
      base.getTime() + WEEKLY_PASS_DAYS * 24 * 60 * 60 * 1000,
    );
    await db.user.update({
      where: { id: payment.userId },
      data: { applyPassUntil: nextUntil },
    });
  }

  return updatedPayment;
}

/**
 * Checks whether a student can apply to vacancies (1 free trial application, or active 7-day weekly pass).
 */
export async function getApplyPassStatus(userId: string) {
  const [user, applicationCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { applyPassUntil: true },
    }),
    db.vacancyApplication.count({ where: { studentId: userId } }),
  ]);
  const now = new Date();
  const hasActivePass = Boolean(
    user?.applyPassUntil && user.applyPassUntil > now,
  );
  const freeTrialAvailable = applicationCount === 0;
  return {
    canApply: hasActivePass || freeTrialAvailable,
    hasActivePass,
    freeTrialAvailable,
    applyPassUntil: user?.applyPassUntil ?? null,
  };
}

/**
 * Check whether a company has an active, valid unlock for a vacancy's 80-100% matched candidates.
 */
export async function isVacancyUnlocked(
  companyId: string,
  vacancyId: string,
): Promise<boolean> {
  const unlock = await db.vacancyUnlock.findUnique({
    where: {
      vacancyId_companyId: {
        vacancyId,
        companyId,
      },
    },
  });

  if (!unlock) return false;
  return unlock.expiresAt > new Date();
}

/**
 * Click / Payme / Test checkout URL or payload generator.
 */
export function getCheckoutRedirect(
  payment: {
    id: string;
    amount: number;
    provider: PaymentProvider;
    externalId: string | null;
  },
  returnUrl: string,
) {
  const serviceId = process.env.CLICK_SERVICE_ID || "10001";
  const merchantId = process.env.CLICK_MERCHANT_ID || "10001";
  const paymeMerchantId = process.env.PAYME_MERCHANT_ID || "payme_demo_id";

  if (payment.provider === PaymentProvider.CLICK) {
    // Standard Click Web redirect URL:
    // https://my.click.uz/services/pay?service_id=...&merchant_id=...&amount=...&transaction_param=...&return_url=...
    const url = new URL("https://my.click.uz/services/pay");
    url.searchParams.set("service_id", serviceId);
    url.searchParams.set("merchant_id", merchantId);
    url.searchParams.set("amount", String(payment.amount));
    url.searchParams.set("transaction_param", payment.id);
    url.searchParams.set("return_url", returnUrl);
    return url.toString();
  }

  if (payment.provider === PaymentProvider.PAYME) {
    // Payme standard base64 checkout:
    // m={merchant_id};ac.order_id={id};a={amount_tiyin};c={return_url}
    const params = `m=${paymeMerchantId};ac.order_id=${payment.id};a=${payment.amount * 100};c=${encodeURIComponent(returnUrl)}`;
    const base64 = Buffer.from(params).toString("base64");
    return `https://checkout.paycom.uz/${base64}`;
  }

  // TEST sandbox provider: direct redirect to local confirmation handler
  return `/api/payments/test-complete?paymentId=${payment.id}&returnUrl=${encodeURIComponent(returnUrl)}`;
}
