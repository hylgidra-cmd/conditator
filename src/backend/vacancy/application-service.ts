import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { ApplicationStatus, CandidateStageType } from "@prisma/client";

export async function applyToVacancy(params: {
  studentId: string;
  vacancyId: string;
  cvId: string;
  note?: string;
}) {
  const vacancy = await db.vacancy.findUnique({
    where: { id: params.vacancyId },
    include: { company: true },
  });

  if (!vacancy) {
    throw new ApiError(404, "VACANCY_NOT_FOUND");
  }

  if (
    vacancy.status !== "ACTIVE" ||
    (vacancy.expiresAt && vacancy.expiresAt < new Date())
  ) {
    throw new ApiError(400, "VACANCY_INACTIVE_OR_EXPIRED");
  }

  const cv = await db.cv.findFirst({
    where: { id: params.cvId, userId: params.studentId },
  });

  if (!cv || !cv.savedAt) {
    throw new ApiError(400, "INVALID_OR_UNSAVED_CV");
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
  const existing = await db.candidateLike.findUnique({
    where: {
      companyId_cvId: {
        companyId: params.companyId,
        cvId: params.cvId,
      },
    },
  });

  if (existing) {
    await db.candidateLike.delete({
      where: { id: existing.id },
    });
    const totalLikes = await db.candidateLike.count({
      where: { cvId: params.cvId },
    });
    return { liked: false, totalLikes };
  }

  await db.candidateLike.create({
    data: {
      companyId: params.companyId,
      cvId: params.cvId,
    },
  });

  const totalLikes = await db.candidateLike.count({
    where: { cvId: params.cvId },
  });
  return { liked: true, totalLikes };
}

export async function getCandidateLikes(cvId: string) {
  return db.candidateLike.count({ where: { cvId } });
}
