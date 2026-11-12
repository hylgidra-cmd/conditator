import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { DecisionButtons } from "@/frontend/components/match/decision-buttons";
import { FormAlert } from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { getCvDocumentLabels } from "@/backend/cv-document/labels";
import { loadVisibleCvDocument } from "@/backend/cv-document/load";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { getDecision } from "@/backend/match/decision";

/**
 * Nomzod CV si (ism va aloqa bilan, PLAN qaror 6). Ruxsat API bilan bir xil:
 * tasdiqlangan kompaniya, o'z talabi, ochiq va saqlangan CV. Har ochish CvView ga yoziladi.
 */
export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string; cvId: string }>;
}) {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Candidate");
  const tStatus = await getTranslations("Company.status");
  const tErrors = await getTranslations("Errors");
  const { id, cvId } = await params;
  const vacancy = await db.vacancy.findFirst({
    where: { id, companyId: company.id },
    select: { id: true, title: true },
  });
  if (!vacancy) notFound();

  const back = (
    <Link
      href={`/company/vacancies/${vacancy.id}/matches`}
      className="text-brand text-sm font-medium hover:underline"
    >
      {t("back")}
    </Link>
  );

  if (!companyAccess(company).canViewCvs) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {back}
        <FormAlert>
          {tStatus(company.approval === "REJECTED" ? "REJECTED" : "PENDING")}
        </FormAlert>
      </div>
    );
  }

  const cv = await loadVisibleCvDocument(cvId);
  if (!cv) notFound();
  try {
    rateLimit(`company-cv:${company.id}`, LIMITS.companyCvView);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {back}
        <FormAlert>{tErrors("RATE_LIMITED")}</FormAlert>
      </div>
    );
  }
  await db.cvView.create({ data: { cvId: cv.id, companyId: company.id } });
  const [labels, decision] = await Promise.all([
    getCvDocumentLabels(cv.language),
    getDecision(vacancy.id, cv.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words">
            {cv.data.fullName ?? t("noName")}
          </h1>
          <p className="text-muted mt-1 text-sm break-words">
            {t("forVacancy", { title: vacancy.title })}
          </p>
        </div>
        {/* Fayl yuklab olish (API), sahifaga o'tish emas. */}
        {}
        <a
          href={`/api/cv/${cv.id}/pdf`}
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2 font-semibold"
        >
          {t("download")}
        </a>
      </div>
      <DecisionButtons vacancyId={vacancy.id} cvId={cv.id} initial={decision} />
      <div className="border-border overflow-hidden rounded-lg border bg-white p-6 shadow-sm sm:p-[16mm]">
        <CvDocument cv={cv} labels={labels} />
      </div>
    </div>
  );
}
