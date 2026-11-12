import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("form.editTitle")}</h1>
        <Link
          href={`/company/vacancies/${vacancy.id}/matches`}
          className="text-brand text-sm font-semibold hover:underline"
        >
          {t("list.candidates")}
        </Link>
      </div>
      <div className="border-border bg-surface rounded-2xl border p-5 shadow-sm">
        <VacancyForm
          initial={formValuesFrom(vacancyView(vacancy))}
          vacancyId={vacancy.id}
        />
      </div>
    </div>
  );
}
