import type { Vacancy } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { VACANCY_PAGE_SIZE, type VacancyInput } from "./schema";

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

function invalidateLandingCache() {
  try {
    revalidateTag("landing-stats");
  } catch {
    // Tests and standalone scripts run without a Next.js cache store.
  }
}

/** Brauzerga yuboriladigan ko'rinish. */
export function vacancyView(vacancy: Vacancy) {
  return {
    id: vacancy.id,
    title: vacancy.title,
    rawText: vacancy.rawText,
    skills: vacancy.skills,
    languages: vacancy.languages,
    minExperienceYears: vacancy.minExperienceYears,
    location: vacancy.location,
    workType: vacancy.workType,
    salaryFrom: vacancy.salaryFrom,
    salaryTo: vacancy.salaryTo,
    currency: vacancy.currency,
    status: vacancy.status,
    professionId: vacancy.professionId,
    wantedTypes: vacancy.wantedTypes,
    wantedGroups: vacancy.wantedGroups,
    expiresAt: vacancy.expiresAt?.toISOString() ?? null,
    createdAt: vacancy.createdAt.toISOString(),
    updatedAt: vacancy.updatedAt.toISOString(),
  };
}

export type VacancyView = ReturnType<typeof vacancyView>;

/** Faqat erkin matn yozilgan bo'lsa, ro'yxatda ko'rinadigan sarlavha matnning birinchi qatoridan olinadi. */
function titleFrom(input: VacancyInput): string {
  if (input.title) return input.title;
  const firstLine = (input.rawText ?? "").split("\n")[0].trim();
  const chars = Array.from(firstLine);
  return chars.length > 120 ? `${chars.slice(0, 119).join("")}…` : firstLine;
}

function toData(input: VacancyInput) {
  return {
    title: titleFrom(input),
    rawText: input.rawText,
    skills: input.skills,
    languages: input.languages,
    minExperienceYears: input.minExperienceYears,
    location: input.location,
    workType: input.workType,
    ...(input.salaryFrom !== undefined ? { salaryFrom: input.salaryFrom } : {}),
    ...(input.salaryTo !== undefined ? { salaryTo: input.salaryTo } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.professionId !== undefined
      ? { professionId: input.professionId || null }
      : {}),
    ...(input.wantedTypes !== undefined
      ? { wantedTypes: [...new Set(input.wantedTypes)] }
      : {}),
    ...(input.wantedGroups !== undefined
      ? { wantedGroups: [...new Set(input.wantedGroups)] }
      : {}),
  };
}

export async function createVacancy(companyId: string, input: VacancyInput) {
  const created = await db.vacancy.create({
    data: {
      companyId,
      ...toData(input),
      status: input.status ?? "ACTIVE",
      expiresAt: new Date(Date.now() + FIFTEEN_DAYS_MS),
    },
  });
  invalidateLandingCache();
  return created;
}

/** Faqat o'z talabi. Boshqa kompaniyaniki bo'lsa ham "topilmadi" (borligi oshkor qilinmaydi). */
export async function getOwnVacancy(companyId: string, id: string) {
  const vacancy = await db.vacancy.findFirst({ where: { id, companyId } });
  if (!vacancy) throw new ApiError(404, "NOT_FOUND");
  return vacancy;
}

export async function updateVacancy(
  companyId: string,
  id: string,
  input: VacancyInput,
) {
  const existing = await getOwnVacancy(companyId, id);
  const now = new Date();
  const shouldRefreshExpiry =
    input.status === "ACTIVE" &&
    (!existing.expiresAt || existing.expiresAt <= now);

  const { count } = await db.vacancy.updateMany({
    where: { id, companyId },
    data: {
      ...toData(input),
      ...(shouldRefreshExpiry
        ? { expiresAt: new Date(now.getTime() + FIFTEEN_DAYS_MS) }
        : {}),
    },
  });
  if (count === 0) throw new ApiError(404, "NOT_FOUND");
  invalidateLandingCache();
  return getOwnVacancy(companyId, id);
}

export async function deleteVacancy(companyId: string, id: string) {
  const { count } = await db.vacancy.deleteMany({
    where: { id, companyId },
  });
  if (count === 0) throw new ApiError(404, "NOT_FOUND");
  invalidateLandingCache();
}

/** Talablar tarixi: yangilari birinchi, server tomonda sahifalanadi. */
export async function listVacancies(companyId: string, page: number) {
  const [total, items] = await db.$transaction([
    db.vacancy.count({ where: { companyId } }),
    db.vacancy.findMany({
      where: { companyId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * VACANCY_PAGE_SIZE,
      take: VACANCY_PAGE_SIZE,
    }),
  ]);
  return {
    items: items.map(vacancyView),
    page,
    pageSize: VACANCY_PAGE_SIZE,
    total,
    pageCount: Math.max(1, Math.ceil(total / VACANCY_PAGE_SIZE)),
  };
}
