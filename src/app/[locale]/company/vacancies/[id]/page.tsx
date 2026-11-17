import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/frontend/components/ds/motion";
import { ArrowRightIcon } from "@/frontend/components/icons";
import { VacancyForm } from "@/frontend/components/vacancy/vacancy-form";
import { Link } from "@/i18n/navigation";
import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { formValuesFrom } from "@/backend/vacancy/form";
import { vacancyView } from "@/backend/vacancy/service";

export default async function EditVacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Vacancies");
  const { id } = await params;
  // Faqat o'z talabi: boshqa kompaniyaniki "topilmadi".
  const vacancy = await db.vacancy.findFirst({
    where: { id, companyId: company.id },
  });
  if (!vacancy) notFound();

  return (
    <div className="page-x font-ui max-w-3xl space-y-6 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-h2 text-text font-extrabold tracking-tight">
              {t("form.editTitle")}
            </h1>
            <Link
              href={`/company/vacancies/${vacancy.id}/matches`}
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
            >
              {t("list.candidates")}
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      </Reveal>
      <Reveal delay={75}>
        <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-6 backdrop-blur-md">
          <VacancyForm
            initial={formValuesFrom(vacancyView(vacancy))}
            vacancyId={vacancy.id}
          />
        </div>
      </Reveal>
    </div>
  );
}
