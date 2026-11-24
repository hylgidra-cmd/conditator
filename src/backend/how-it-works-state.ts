import type { Role } from "@prisma/client";
import { db } from "@/backend/db";

export interface HowItWorksUserProgress {
  studentHasCv: boolean;
  studentApplicationCount: number;
  companyVacancyCount: number;
  companyActiveChatCount: number;
}

const EMPTY_PROGRESS: HowItWorksUserProgress = {
  studentHasCv: false,
  studentApplicationCount: 0,
  companyVacancyCount: 0,
  companyActiveChatCount: 0,
};

/**
 * Loads real authenticated user workflow progress for Section 5 ("How CANDIDATOR works").
 * Never throws on transient DB errors — falls back cleanly to zeroed progress.
 */
export async function getHowItWorksUserProgress(
  userId?: string,
  userRole?: Role,
): Promise<HowItWorksUserProgress> {
  if (!userId || !userRole) {
    return EMPTY_PROGRESS;
  }

  try {
    if (userRole === "STUDENT") {
      const [cvCount, applicationCount] = await Promise.all([
        db.cv.count({
          where: { userId, savedAt: { not: null } },
        }),
        db.vacancyApplication.count({
          where: { studentId: userId },
        }),
      ]);

      return {
        ...EMPTY_PROGRESS,
        studentHasCv: cvCount > 0,
        studentApplicationCount: applicationCount,
      };
    }

    if (userRole === "COMPANY") {
      const company = await db.company.findFirst({
        where: {
          OR: [{ userId }, { members: { some: { userId } } }],
        },
        select: { id: true },
      });

      if (!company) {
        return EMPTY_PROGRESS;
      }

      const [vacancyCount, chatCount] = await Promise.all([
        db.vacancy.count({
          where: { companyId: company.id, status: "ACTIVE" },
        }),
        db.conversation.count({
          where: { companyId: company.id, status: "ACTIVE" },
        }),
      ]);

      return {
        ...EMPTY_PROGRESS,
        companyVacancyCount: vacancyCount,
        companyActiveChatCount: chatCount,
      };
    }

    return EMPTY_PROGRESS;
  } catch {
    return EMPTY_PROGRESS;
  }
}
