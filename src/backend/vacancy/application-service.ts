import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { getApplyPassStatus } from "@/backend/payment/service";
import { ApplicationStatus, CandidateStageType } from "@prisma/client";

export async function applyToVacancy(params: {
  studentId: string;
  vacancyId: string;
  cvId: string;
  note?: string;
}) {
  const vacancy = await db.vacancy.findUnique({
    where: { id: params.vacancyId },
    include: {
      company: {
        select: {
          id: true,
          approval: true,
          user: { select: { status: true } },
        },
      },
    },
  });

  if (
    !vacancy ||
    vacancy.company.approval !== "APPROVED" ||
    vacancy.company.user.status !== "ACTIVE"
  ) {
    throw new ApiError(404, "VACANCY_NOT_FOUND");
  }

  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const expired = vacancy.expiresAt
    ? vacancy.expiresAt < new Date()
    : vacancy.createdAt < fifteenDaysAgo;

  if (vacancy.status !== "ACTIVE" || expired) {
    throw new ApiError(400, "VACANCY_INACTIVE_OR_EXPIRED");
  }

  const cv = await db.cv.findFirst({
    where: { id: params.cvId, userId: params.studentId },
  });

  if (!cv || !cv.savedAt) {
    throw new ApiError(400, "INVALID_OR_UNSAVED_CV");
  }

  if (!cv.isPaid) {
    throw new ApiError(402, "CV_PAYMENT_REQUIRED");
  }

  const passStatus = await getApplyPassStatus(params.studentId);
  if (!passStatus.canApply) {
    throw new ApiError(402, "APPLY_PASS_REQUIRED");
  }

  // Check if already applied
  const existingApp = await db.vacancyApplication.findUnique({
    where: {
      vacancyId_cvId: {
        vacancyId: params.vacancyId,
        cvId: params.cvId,
      },
    },
  });

  if (existingApp) {
    throw new ApiError(409, "ALREADY_APPLIED");
  }

  const application = await db.vacancyApplication.create({
    data: {
      vacancyId: params.vacancyId,
      cvId: params.cvId,
      studentId: params.studentId,
      status: ApplicationStatus.SUBMITTED,
      note: params.note,
    },
  });

  // Initialize stage as NEW (chat is opened later only after company reviews the CV)
  await db.candidateStage.upsert({
    where: {
      vacancyId_cvId: {
        vacancyId: params.vacancyId,
        cvId: params.cvId,
      },
    },
    create: {
      vacancyId: params.vacancyId,
      cvId: params.cvId,
      companyId: vacancy.companyId,
      stage: CandidateStageType.NEW,
    },
    update: {},
  });

  return application;
}

export async function updateCandidateStage(params: {
  companyId: string;
  vacancyId: string;
  cvId: string;
  stage: CandidateStageType;
  note?: string;
}) {
  const [vacancy, accessibleCv] = await Promise.all([
    db.vacancy.findFirst({
      where: { id: params.vacancyId, companyId: params.companyId },
      select: { id: true },
    }),
    db.cv.findFirst({
      where: {
        id: params.cvId,
        savedAt: { not: null },
        user: { status: "ACTIVE" },
        OR: [
          { isVisible: true },
          { applications: { some: { vacancyId: params.vacancyId } } },
        ],
      },
      select: { id: true },
    }),
  ]);
  if (!vacancy) {
    throw new ApiError(404, "VACANCY_NOT_FOUND");
  }
  if (!accessibleCv) {
    throw new ApiError(404, "NOT_FOUND");
  }

  const stage = await db.candidateStage.upsert({
    where: {
      vacancyId_cvId: {
        vacancyId: params.vacancyId,
        cvId: params.cvId,
      },
    },
    create: {
      companyId: params.companyId,
      vacancyId: params.vacancyId,
      cvId: params.cvId,
      stage: params.stage,
      note: params.note,
    },
    update: {
      stage: params.stage,
      ...(params.note !== undefined ? { note: params.note } : {}),
    },
  });

  // Also update application status if an application exists
  const statusMap: Record<CandidateStageType, ApplicationStatus> = {
    NEW: ApplicationStatus.SUBMITTED,
    REVIEWING: ApplicationStatus.VIEWED,
    LIKED: ApplicationStatus.INTERESTED,
    INTERVIEW: ApplicationStatus.INTERESTED,
    ACCEPTED: ApplicationStatus.ACCEPTED,
    REJECTED: ApplicationStatus.REJECTED,
  };

  await db.vacancyApplication.updateMany({
    where: { vacancyId: params.vacancyId, cvId: params.cvId },
    data: { status: statusMap[params.stage] },
  });

  return stage;
}

export async function toggleCandidateLike(params: {
  companyId: string;
  cvId: string;
}) {
  const visibleCv = await db.cv.findFirst({
    where: {
      id: params.cvId,
      isVisible: true,
      savedAt: { not: null },
      user: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  if (!visibleCv) {
    throw new ApiError(404, "NOT_FOUND");
  }

  const existing = await db.candidateLike.findUnique({
    where: {
      companyId_cvId: {
        companyId: params.companyId,
        cvId: params.cvId,
      },
    },
  });

  if (existing) {
    await db.candidateLike.deleteMany({
      where: { id: existing.id },
    });
    const totalLikes = await db.candidateLike.count({
      where: { cvId: params.cvId },
    });
    return { liked: false, totalLikes };
  }

  await db.candidateLike.upsert({
    where: {
      companyId_cvId: {
        companyId: params.companyId,
        cvId: params.cvId,
      },
    },
    create: {
      companyId: params.companyId,
      cvId: params.cvId,
    },
    update: {},
  });

  const totalLikes = await db.candidateLike.count({
    where: { cvId: params.cvId },
  });
  return { liked: true, totalLikes };
}

export async function getCandidateLikes(cvId: string) {
  return db.candidateLike.count({ where: { cvId } });
}
