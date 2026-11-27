import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { CandidateActions } from "@/frontend/components/company/candidate-actions";
import { CompanySubscribeButton } from "@/frontend/components/company/company-subscription-plans";
import { SparkIcon } from "@/frontend/components/icons";
import { DecisionButtons } from "@/frontend/components/match/decision-buttons";
import { FormAlert } from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { getCvDocumentLabels } from "@/backend/cv-document/labels";
import { loadVisibleCvDocument } from "@/backend/cv-document/load";
import { evaluateCvQuality } from "@/backend/cv/quality";
import { cvDataSchema } from "@/backend/cv/schema";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { getDecision } from "@/backend/match/decision";
import { isCvLockedForCompany } from "@/backend/payment/service";

/**
 * Nomzod CV si (ism va aloqa bilan). Ruxsat API bilan bir xil:
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
    select: { id: true, title: true, companyId: true },
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

  const [isLocked, rawCv, match, stageRecord, likesCount, hasLiked, conv] =
    await Promise.all([
      isCvLockedForCompany(cvId, company.id, vacancy.id),
      db.cv.findFirst({
        where: {
          id: cvId,
          savedAt: { not: null },
          user: { status: "ACTIVE" },
          OR: [
            { isVisible: true },
            { applications: { some: { vacancy: { companyId: company.id } } } },
          ],
        },
        select: { title: true, data: true },
      }),
      db.match.findUnique({
        where: {
          vacancyId_cvId: {
            vacancyId: vacancy.id,
            cvId,
          },
        },
      }),
      db.candidateStage.findUnique({
        where: {
          vacancyId_cvId: {
            vacancyId: vacancy.id,
            cvId,
          },
        },
      }),
      db.candidateLike.count({ where: { cvId } }),
      db.candidateLike.findUnique({
        where: {
          companyId_cvId: {
            companyId: company.id,
            cvId,
          },
        },
      }),
      db.conversation.findFirst({
        where: {
          companyId: company.id,
          vacancyId: vacancy.id,
          studentCvId: cvId,
        },
      }),
    ]);

  const parsedRaw = rawCv ? cvDataSchema.safeParse(rawCv.data) : null;
  const quality =
    parsedRaw && parsedRaw.success
      ? evaluateCvQuality(parsedRaw.data, {
          title: rawCv?.title,
          aiMatchScore: match?.score ?? null,
          aiReason: match?.reason ?? null,
        })
      : null;

  const cv = await loadVisibleCvDocument(cvId, {
    isLocked,
    appliedCompanyId: company.id,
  });
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

  const qualityBadgeLabel = quality
    ? quality.isMukammal
      ? `🌟 Mukammal CV (${quality.score}%)`
      : `📄 AI bahosi: ${quality.score}%`
    : null;
  const lockedPdfLabel = "🔒 Obuna bilan PDF yuklash";

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        {qualityBadgeLabel ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold ${
              quality?.isMukammal
                ? "bg-primary text-on-primary shadow-primary"
                : "border-line bg-canvas text-text border"
            }`}
          >
            <SparkIcon size={13} />
            {qualityBadgeLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words">
            {cv.data.fullName ?? t("noName")}
          </h1>
          <p className="text-muted mt-1 text-sm break-words">
            {t("forVacancy", { title: vacancy.title })}
          </p>
        </div>
        {isLocked ? (
          <CompanySubscribeButton
            label={lockedPdfLabel}
            vacancyId={vacancy.id}
            cvId={cv.id}
          />
        ) : (
          <a
            href={`/api/cv/${cv.id}/pdf?vacancyId=${vacancy.id}`}
            className="bg-brand text-brand-foreground rounded-lg px-4 py-2 font-semibold shadow hover:opacity-95"
          >
            {t("download")}
          </a>
        )}
      </div>

      {quality ? (
        <div className="border-primary/25 bg-primary-soft/60 text-text rounded-2xl border p-3.5 text-xs font-medium leading-relaxed">
          {quality.aiSummary}
        </div>
      ) : null}

      {/* HeadHunter Candidate Actions: Stages, Like bonus, Chat & Unlock */}
      <CandidateActions
        vacancyId={vacancy.id}
        cvId={cv.id}
        initialStage={stageRecord?.stage ?? "NEW"}
        initialLikes={likesCount}
        initialLiked={Boolean(hasLiked)}
        isLocked={isLocked}
        candidateName={cv.data.fullName ?? undefined}
        conversationId={conv?.id ?? null}
      />

      <DecisionButtons vacancyId={vacancy.id} cvId={cv.id} initial={decision} />

      <div className="border-border overflow-hidden rounded-2xl border bg-white p-6 shadow-sm sm:p-[16mm]">
        <CvDocument cv={cv} labels={labels} />
      </div>
    </div>
  );
}
