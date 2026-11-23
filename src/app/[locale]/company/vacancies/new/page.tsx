import { getTranslations } from "next-intl/server";
import { Reveal } from "@/frontend/components/ds/motion";
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
    <div className="page-x font-ui max-w-3xl space-y-6 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <h1 className="text-h2 text-text relative z-10 font-extrabold tracking-tight">
            {source ? t("copyTitle") : t("newTitle")}
          </h1>
        </div>
      </Reveal>
      <Reveal delay={75}>
        <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-6 backdrop-blur-md">
          <VacancyForm
            initial={
              source ? formValuesFrom(vacancyView(source)) : EMPTY_VACANCY
            }
          />
        </div>
      </Reveal>
    </div>
  );
}
