import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { formValuesFrom } from "@/backend/vacancy/form";
import { vacancyView } from "@/backend/vacancy/service";
import { VacancyForm } from "@/frontend/components/vacancy/vacancy-form";

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
    <VacancyForm
      initial={formValuesFrom(vacancyView(vacancy))}
      vacancyId={vacancy.id}
      matchesHref={`/company/vacancies/${vacancy.id}/matches`}
      matchesLabel={t("list.candidates")}
    />
  );
}
