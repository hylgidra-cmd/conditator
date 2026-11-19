import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { getCvDocumentLabels } from "@/backend/cv-document/labels";
import { loadVisibleCvDocument } from "@/backend/cv-document/load";
import { evaluateCvQuality } from "@/backend/cv/quality";
import { cvDataSchema } from "@/backend/cv/schema";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";
import { ApiError } from "@/backend/http/errors";
import {
  isCompanySubscribedOrUnlocked,
  isCvLockedForCompany,
} from "@/backend/payment/service";
import { CompanySubscribeButton } from "@/frontend/components/company/company-subscription-plans";
import { StudentsSubscriptionBar } from "@/frontend/components/company/students-subscription-bar";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { ArrowLeftIcon, SparkIcon } from "@/frontend/components/icons";
import { FormAlert } from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";

export default async function CompanyStudentCvPage({
  params,
}: {
  params: Promise<{ cvId: string }>;
}) {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Candidate");
  const tStudents = await getTranslations("CompanyStudents");
  const tStatus = await getTranslations("Company.status");
  const tErrors = await getTranslations("Errors");
  const { cvId } = await params;

  const backLink = (
    <Link
      href="/company/students"
      className="border-line bg-canvas text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-colors"
    >
      <ArrowLeftIcon size={14} />
      {tStudents("title")}
    </Link>
  );

  if (!companyAccess(company).canViewCvs) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {backLink}
        <FormAlert>
          {tStatus(company.approval === "REJECTED" ? "REJECTED" : "PENDING")}
        </FormAlert>
      </div>
    );
  }

  const [rawCv, matches, hasActiveAbuna, isLocked] = await Promise.all([
    db.cv.findFirst({
      where: {
        id: cvId,
        isVisible: true,
        savedAt: { not: null },
        user: { status: "ACTIVE" },
      },
      select: { id: true, title: true, data: true },
    }),
    db.match.findMany({
      where: { cvId, vacancy: { companyId: company.id } },
      select: { score: true, reason: true },
      orderBy: { score: "desc" },
      take: 1,
    }),
    isCompanySubscribedOrUnlocked(company.id),
    isCvLockedForCompany(cvId, company.id),
  ]);

  if (!rawCv) notFound();

  const parsedRaw = cvDataSchema.safeParse(rawCv.data);
  const quality = parsedRaw.success
    ? evaluateCvQuality(parsedRaw.data, {
        title: rawCv.title,
        aiMatchScore: matches[0]?.score ?? null,
        aiReason: matches[0]?.reason ?? null,
      })
    : null;

  const cv = await loadVisibleCvDocument(cvId, { isLocked });
  if (!cv) notFound();

  try {
    rateLimit(`company-cv:${company.id}`, LIMITS.companyCvView);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {backLink}
        <FormAlert>{tErrors("RATE_LIMITED")}</FormAlert>
      </div>
    );
  }

  await db.cvView.create({ data: { cvId: cv.id, companyId: company.id } });
  const labels = await getCvDocumentLabels(cv.language);

  const mukammalBadge = quality
    ? quality.isMukammal
      ? `🌟 Mukammal CV (${quality.score}%)`
      : `📄 AI bahosi: ${quality.score}%`
    : null;
  const subUntilLabel =
    company.subscriptionUntil && company.subscriptionUntil > new Date()
      ? formatDate(company.subscriptionUntil)
      : null;
  const lockedPdfLabel = "🔒 Obuna bilan PDF va kontaktlarni ochish";

  return (
    <div className="page-x font-ui max-w-4xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card/90 shadow-soft space-y-4 rounded-3xl border p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {backLink}
          {mukammalBadge ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold ${
                quality?.isMukammal
                  ? "bg-primary text-on-primary shadow-primary"
                  : "border-line bg-canvas text-text border"
              }`}
            >
              <SparkIcon size={13} />
              {mukammalBadge}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-h2 text-text font-extrabold break-words">
              {cv.data.fullName ?? t("noName")}
            </h1>
            {rawCv.title ? (
              <p className="text-primary-text text-sm font-bold break-words">
                {rawCv.title}
              </p>
            ) : null}
          </div>

          {isLocked ? (
            <CompanySubscribeButton label={lockedPdfLabel} cvId={cv.id} />
          ) : (
            <a
              href={`/api/cv/${cv.id}/pdf`}
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-all"
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
      </div>

      {isLocked ? (
        <StudentsSubscriptionBar
          hasActiveAbuna={hasActiveAbuna}
          subscriptionUntilLabel={subUntilLabel}
          mukammalCount={quality?.isMukammal ? 1 : 0}
          openCount={quality?.isMukammal ? 0 : 1}
        />
      ) : null}

      <div className="border-line overflow-hidden rounded-3xl border bg-white p-6 shadow-sm sm:p-[16mm]">
        <CvDocument cv={cv} labels={labels} />
      </div>
    </div>
  );
}
