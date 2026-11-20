import { Prisma, VacancyStatus } from "@prisma/client";
import { db } from "@/backend/db";

/**
 * Kunlik baza texnik xizmati va 15 kunlik vakansiya qoidasi:
 * - 15 kundan oshgan faol vakansiyalarni CLOSED qilish
 * - Muddati o'tgan VacancyUnlock, Session va EmailCode yozuvlarini o'chirish
 * - 90 kundan eski o'qilgan Notification va AiLog yozuvlarini tozalash
 * - 90 kundan eski yakunlangan to'lovlardagi og'ir receiptDataUrl Base64 tasvirini tozalash
 *   (to'lov summasi, holati, izohi va ID to'liq saqlanib qoladi)
 */
export async function runFifteenDaysCron() {
  const now = new Date();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // 1. 15 kundan oshgan yoki muddati tugagan faol vakansiyalarni yopish
  const closedVacancies = await db.vacancy.updateMany({
    where: {
      status: VacancyStatus.ACTIVE,
      OR: [
        { expiresAt: { lte: now } },
        { createdAt: { lte: fifteenDaysAgo }, expiresAt: null },
      ],
    },
    data: {
      status: VacancyStatus.CLOSED,
      closeReason: "15_DAYS_AUTO_EXPIRY",
    },
  });

  // 2. Muddati o'tgan sessiya, kod, unlock va 90 kundan eski log/bildirishnomalarni tozalash
  const [
    deletedUnlocks,
    deletedSessions,
    deletedCodes,
    deletedNotifications,
    deletedAiLogs,
    prunedPaymentReceipts,
  ] = await Promise.all([
    db.vacancyUnlock.deleteMany({
      where: { expiresAt: { lte: now } },
    }),
    db.session.deleteMany({
      where: { expiresAt: { lte: now } },
    }),
    db.emailCode.deleteMany({
      where: { expiresAt: { lte: now } },
    }),
    db.notification.deleteMany({
      where: { isRead: true, createdAt: { lte: ninetyDaysAgo } },
    }),
    db.aiLog.deleteMany({
      where: { createdAt: { lte: ninetyDaysAgo } },
    }),
    db.$executeRaw(Prisma.sql`
      UPDATE "Payment"
      SET "transactionDetails" = ("transactionDetails"::jsonb - 'receiptDataUrl')
      WHERE status IN ('COMPLETED', 'FAILED', 'CANCELLED')
        AND "createdAt" <= ${ninetyDaysAgo}
        AND "transactionDetails"::jsonb ? 'receiptDataUrl'
    `),
  ]);

  return {
    closedVacanciesCount: closedVacancies.count,
    deletedUnlocksCount: deletedUnlocks.count,
    deletedSessionsCount: deletedSessions.count,
    deletedEmailCodesCount: deletedCodes.count,
    deletedNotificationsCount: deletedNotifications.count,
    deletedAiLogsCount: deletedAiLogs.count,
    prunedPaymentReceiptsCount: Number(prunedPaymentReceipts),
    timestamp: now.toISOString(),
  };
}
