import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { formValuesFrom } from "@/backend/vacancy/form";
import { vacancyView } from "@/backend/vacancy/service";
import {
  EMPTY_VACANCY,
  VacancyForm,
} from "@/frontend/components/vacancy/vacancy-form";

/** Yangi talab. `?from=<id>` bo'lsa, o'z talabining nusxasi bilan to'ldiriladi. */
export default async function NewVacancyPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { company } = await requireCompanyPage();
  const { from } = await searchParams;
  const source = from
    ? await db.vacancy.findFirst({ where: { id: from, companyId: company.id } })
    : null;

  return (
    <VacancyForm
      initial={source ? formValuesFrom(vacancyView(source)) : EMPTY_VACANCY}
    />
  );
}
