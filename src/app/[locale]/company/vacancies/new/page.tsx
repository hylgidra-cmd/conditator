import { getTranslations } from "next-intl/server";
import {
  EMPTY_VACANCY,
  VacancyForm,
} from "@/frontend/components/vacancy/vacancy-form";
import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { formValuesFrom } from "@/backend/vacancy/form";
import { vacancyView } from "@/backend/vacancy/service";

/** Yangi talab. `?from=<id>` bo'lsa, o'z talabining nusxasi bilan to'ldiriladi. */
export default async function NewVacancyPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Vacancies.form");
  const { from } = await searchParams;
  const source = from
    ? await db.vacancy.findFirst({ where: { id: from, companyId: company.id } })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">
        {source ? t("copyTitle") : t("newTitle")}
      </h1>
      <div className="border-border bg-surface rounded-2xl border p-5 shadow-sm">
        <VacancyForm
          initial={source ? formValuesFrom(vacancyView(source)) : EMPTY_VACANCY}
        />
      </div>
    </div>
  );
}
