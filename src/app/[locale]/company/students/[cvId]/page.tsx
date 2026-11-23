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
import { ApiError } from "@/backend/http/errors";
import { isCvLockedForCompany } from "@/backend/payment/service";
import { CompanySubscribeButton } from "@/frontend/components/company/company-subscription-plans";
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

  const [rawCv, matches, isLocked] = await Promise.all([
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
  const lockedPdfLabel = "🔓 Obuna sotib olish (15 000 so'mdan)";
  const lockedBannerTitle =
    "🔒 Nomzodning F.I.Sh, kontaktlari va PDF rezyumesi qulflangan";
  const lockedBannerDesc =
    "Kompaniya obunasini faollashtiring — ushbu va boshqa barcha nomzodlarning telefon raqami, Telegram, emaili, PDF hujjati hamda chat darhol ochiladi.";

  return (
    <div className="page-x font-ui max-w-4xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card shadow-soft space-y-4 rounded-2xl border p-6">
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
          <div className="border-primary/25 bg-primary-soft/60 text-text rounded-2xl border p-3.5 text-xs leading-relaxed font-medium">
            {quality.aiSummary}
          </div>
        ) : null}
      </div>

      {isLocked ? (
        <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-[#051812] via-[#08261D] to-[#0D3D31] p-5 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl space-y-1">
              <h2 className="text-sm font-black text-white sm:text-base">
                {lockedBannerTitle}
              </h2>
              <p className="text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                {lockedBannerDesc}
              </p>
            </div>
            <CompanySubscribeButton label={lockedPdfLabel} cvId={cv.id} />
          </div>
        </div>
      ) : null}

      <div className="border-line overflow-hidden rounded-2xl border bg-white p-6 shadow-sm sm:p-[16mm]">
        <CvDocument cv={cv} labels={labels} />
      </div>
    </div>
  );
}
