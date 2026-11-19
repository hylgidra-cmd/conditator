import { randomBytes } from "node:crypto";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { PaymentPurpose, PaymentProvider, PaymentStatus } from "@prisma/client";

export const CV_CREATION_PRICE_UZS = 5_000;
export const WEEKLY_PASS_PRICE_UZS = 5_000;
export const WEEKLY_PASS_DAYS = 7;
export const VACANCY_UNLOCK_PRICE_UZS = 29_000;
export const UNLOCK_DURATION_DAYS = 15;

export const MANUAL_CARD_NUMBER = "9860 1301 6978 8069";
export const MANUAL_CARD_DIGITS = "9860130169788069";
export const MANUAL_CARD_HOLDER = "Gulgina E.";

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
      externalId: `CAND-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`,
    },
  });

  return payment;
}

/**
 * Marks payment as completed and fulfills the benefit:
 * - If CV_CREATION: marks Cv.isPaid = true
 * - If VACANCY_UNLOCK: extends Company.subscriptionUntil by selected plan durationDays (default 15 days)
 * - If WEEKLY_APPLY_PASS: extends User.applyPassUntil by 7 days
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

  return db.$transaction(async (tx) => {
    // Atomik o'tish: parallel webhook kelganda imtiyoz ikki marta qo'shilmasligi uchun.
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.COMPLETED,
        externalId: externalTransactionId ?? payment.externalId,
      },
    });

    if (claimed.count === 0) {
      const current = await tx.payment.findUnique({ where: { id: paymentId } });
      return current ?? payment;
    }

    const updatedPayment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });

    if (payment.purpose === PaymentPurpose.CV_CREATION && payment.cvId) {
      await tx.cv.update({
        where: { id: payment.cvId },
        data: { isPaid: true, isVisible: true },
      });
    } else if (
      payment.purpose === PaymentPurpose.VACANCY_UNLOCK &&
      payment.companyId
    ) {
      const details =
        typeof payment.transactionDetails === "object" &&
        payment.transactionDetails !== null
          ? (payment.transactionDetails as Record<string, unknown>)
          : null;
      const rawDays =
        typeof details?.durationDays === "number"
          ? Math.trunc(details.durationDays)
          : UNLOCK_DURATION_DAYS;
      const durationDays =
        rawDays >= 1 && rawDays <= 365 ? rawDays : UNLOCK_DURATION_DAYS;

      const company = await tx.company.findUnique({
        where: { id: payment.companyId },
        select: { subscriptionUntil: true },
      });
      const now = new Date();
      const baseDate =
        company?.subscriptionUntil && company.subscriptionUntil > now
          ? company.subscriptionUntil
          : now;
      const expiresAt = new Date(
        baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
      );

      await tx.company.update({
        where: { id: payment.companyId },
        data: { subscriptionUntil: expiresAt },
      });

      if (payment.vacancyId) {
        await tx.vacancyUnlock.upsert({
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
            paidAt: now,
            expiresAt,
          },
          update: {
            paymentId: payment.id,
            paidAt: now,
            expiresAt,
          },
        });
      }
    } else if (payment.purpose === PaymentPurpose.WEEKLY_APPLY_PASS) {
      const user = await tx.user.findUnique({
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
      await tx.user.update({
        where: { id: payment.userId },
        data: { applyPassUntil: nextUntil },
      });
    }

    return updatedPayment;
  });
}

/**
 * Checks whether a student can apply to vacancies (requires active 7-day prepaid pass, 5 000 UZS).
 */
export async function getApplyPassStatus(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { applyPassUntil: true },
  });
  const now = new Date();
  const hasActivePass = Boolean(
    user?.applyPassUntil && user.applyPassUntil > now,
  );
  return {
    canApply: hasActivePass,
    hasActivePass,
    freeTrialAvailable: false,
    applyPassUntil: user?.applyPassUntil ?? null,
  };
}

/**
 * Check whether a company has an active subscription (Abuna) or an active VacancyUnlock.
 */
export async function isCompanySubscribedOrUnlocked(
  companyId: string,
  vacancyId?: string | null,
): Promise<boolean> {
  const now = new Date();
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { subscriptionUntil: true },
  });
  if (company?.subscriptionUntil && company.subscriptionUntil > now) {
    return true;
  }

  if (vacancyId) {
    const unlock = await db.vacancyUnlock.findUnique({
      where: {
        vacancyId_companyId: {
          vacancyId,
          companyId,
        },
      },
    });
    if (unlock && unlock.expiresAt > now) return true;
  }

  const anyUnlock = await db.vacancyUnlock.findFirst({
    where: { companyId, expiresAt: { gt: now } },
    select: { id: true },
  });
  return Boolean(anyUnlock);
}

/**
 * Check whether a company has an active, valid unlock or subscription for a vacancy's 80-100% matched candidates.
 */
export async function isVacancyUnlocked(
  companyId: string,
  vacancyId: string,
): Promise<boolean> {
  return isCompanySubscribedOrUnlocked(companyId, vacancyId);
}

/**
 * Checks whether a CV is locked for a company (Variant 1 — Teaser + Full Subscription):
 * - If the company has an active subscription (Abuna) or active unlock -> NOT locked (false).
 * - If the company does NOT have an active subscription -> LOCKED (true):
 *   skills, experience, education & AI score remain visible as teaser,
 *   while fullName, phone, email, telegram, photo & PDF download are locked until subscription.
 */
export async function isCvLockedForCompany(
  _cvId: string,
  companyId: string,
  vacancyId?: string | null,
): Promise<boolean> {
  const hasAccess = await isCompanySubscribedOrUnlocked(companyId, vacancyId);
  return !hasAccess;
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
