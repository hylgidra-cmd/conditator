import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { VacancyForm } from "@/components/vacancy/vacancy-form";
import { requireCompanyPage } from "@/lib/company/page";
import { db } from "@/lib/db";
import { formValuesFrom } from "@/lib/vacancy/form";
import { vacancyView } from "@/lib/vacancy/service";

export default async function EditVacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Vacancies.form");
  const { id } = await params;
  // Faqat o'z talabi: boshqa kompaniyaniki "topilmadi".
  const vacancy = await db.vacancy.findFirst({
    where: { id, companyId: company.id },
  });
  if (!vacancy) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("editTitle")}</h1>
      <div className="border-border bg-surface rounded-2xl border p-5 shadow-sm">
        <VacancyForm
          initial={formValuesFrom(vacancyView(vacancy))}
          vacancyId={vacancy.id}
        />
      </div>
    </div>
  );
}
