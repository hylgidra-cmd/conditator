import { db } from "@/backend/db";
import { VacancyStatus } from "@prisma/client";

/**
 * 15-day rule cron task:
 * - Automatically marks vacancies older than 15 days as CLOSED if not already closed
 * - Cleans up or identifies expired candidate unlocks
 */
export async function runFifteenDaysCron() {
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // 1. Close active vacancies whose createdAt was > 15 days ago OR expiresAt < now
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

  // 2. Delete expired vacancy unlocks, expired sessions, and expired email codes
  const [deletedUnlocks, deletedSessions, deletedCodes] = await Promise.all([
    db.vacancyUnlock.deleteMany({
      where: { expiresAt: { lte: now } },
    }),
    db.session.deleteMany({
      where: { expiresAt: { lte: now } },
    }),
    db.emailCode.deleteMany({
      where: { expiresAt: { lte: now } },
    }),
  ]);

  return {
    closedVacanciesCount: closedVacancies.count,
    deletedUnlocksCount: deletedUnlocks.count,
    deletedSessionsCount: deletedSessions.count,
    deletedEmailCodesCount: deletedCodes.count,
    timestamp: now.toISOString(),
  };
}
