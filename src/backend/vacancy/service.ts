import type { Vacancy } from "@prisma/client";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { VACANCY_PAGE_SIZE, type VacancyInput } from "./schema";

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
  return { ...input, title: titleFrom(input) };
}

export function createVacancy(companyId: string, input: VacancyInput) {
  return db.vacancy.create({ data: { companyId, ...toData(input) } });
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
  const { count } = await db.vacancy.updateMany({
    where: { id, companyId },
    data: toData(input),
  });
  if (count === 0) throw new ApiError(404, "NOT_FOUND");
  return getOwnVacancy(companyId, id);
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
