import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";

/** Lists saved vacancy IDs for a signed-in user. */
export async function listSavedVacancyIds(userId: string): Promise<string[]> {
  const rows = await db.savedVacancy.findMany({
    where: { userId },
    select: { vacancyId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map((row) => row.vacancyId);
}

/** Ensures the vacancy is published before bookmarking. */
async function ensureBookmarkableVacancy(vacancyId: string) {
  const now = new Date();
  const vacancy = await db.vacancy.findFirst({
    where: {
      id: vacancyId,
      status: "ACTIVE",
      company: {
        approval: "APPROVED",
        user: { status: "ACTIVE" },
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { id: true },
  });
  if (!vacancy) throw new ApiError(404, "NOT_FOUND");
}

/** Saves a vacancy bookmark idempotently for the given user. */
export async function saveVacancyBookmark(userId: string, vacancyId: string) {
  await ensureBookmarkableVacancy(vacancyId);
  await db.savedVacancy.upsert({
    where: { userId_vacancyId: { userId, vacancyId } },
    create: { userId, vacancyId },
    update: {},
  });
  return { saved: true as const };
}

/** Removes a vacancy bookmark idempotently for the given user. */
export async function removeVacancyBookmark(userId: string, vacancyId: string) {
  await db.savedVacancy.deleteMany({
    where: { userId, vacancyId },
  });
  return { saved: false as const };
}
