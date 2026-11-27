import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { getCvDocumentLabels } from "@/backend/cv-document/labels";
import { loadSavedCvDocument } from "@/backend/cv-document/load";
import {
  getCvSkillFit,
  type SupportedLocale,
} from "@/backend/skill-templates/service";
import { CvPaymentShield } from "@/frontend/components/cv/cv-payment-shield";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";
import { Link, redirect } from "@/i18n/navigation";

export default async function StudentCvPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ cvId?: string }>;
}) {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "STUDENT") return redirect({ href: "/account", locale });

  const { cvId } = await searchParams;
  const cv = await loadSavedCvDocument(user.id, cvId);
  if (!cv) return redirect({ href: "/student/cv", locale });

  const lang: SupportedLocale =
    locale === "kk" || locale === "ru" || locale === "en" ? locale : "uz";

  const [t, labels, skillFit] = await Promise.all([
    getTranslations("StudentCv.preview"),
    getCvDocumentLabels(cv.language),
    getCvSkillFit({
      cvId: cv.id,
      locale: lang,
      includeMissing: true,
    }).catch(() => null),
  ]);

  const backHref = `/student/cv?cvId=${encodeURIComponent(cv.id)}`;
  const pdfHref = `/api/cv/me/pdf?cvId=${encodeURIComponent(cv.id)}`;
  const docxHref = `/api/cv/me/docx?cvId=${encodeURIComponent(cv.id)}`;
  const docxLabel = "Word (.docx)";
  const lockedBadgeLabel = "🔒 PDF va skrinshot to'lovdan so'ng ochiladi";
  const payTitle =
    "CV ni faollashtirish va toza PDF / DOCX yuklab olish (5 000 so'm)";
  const payDesc =
    "To'lov tasdiqlangach, skrinshot va ekran yozib olish cheklovi avtomatik o'chadi hamda toza PDF va Word (.docx) hujjatlar ochiladi.";
  const skillFitHeading = skillFit
    ? `Kasb talablariga mosligi: ${skillFit.matchedCount} / ${skillFit.totalCount}`
    : null;
  const skillFitRatio = skillFit
    ? `${skillFit.matchedCount} / ${skillFit.totalCount}`
    : "";
  const developHeading = "Rivojlantirish kerak (faqat sizga ko'rinadi)";

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted mt-1 text-sm">{t("note")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium"
          >
            {t("back")}
          </Link>
          {cv.isPaid ? (
            <>
              <a
                href={pdfHref}
                className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-semibold"
              >
                {t("download")}
              </a>
              {cv.templateId === "obyektivka" ? (
                <a
                  href={docxHref}
                  className="border-primary/40 bg-primary-soft text-primary-text rounded-lg border px-4 py-2 text-sm font-semibold"
                >
                  {docxLabel}
                </a>
              ) : null}
            </>
          ) : (
            <span className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-extrabold text-amber-800 dark:text-amber-300">
              {lockedBadgeLabel}
            </span>
          )}
        </div>
      </div>

      {/* TZ 3: Kasb talablariga mosligi (N / 6) va faqat talabaga ko'rinadigan "Rivojlantirish kerak" bloki */}
      {skillFit && skillFitHeading ? (
        <div className="border-line bg-card space-y-3 rounded-3xl border p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-primary-text text-xs font-bold">
                {skillFit.professionName}
              </p>
              <h2 className="text-text text-base font-extrabold">
                {skillFitHeading}
              </h2>
            </div>
            <span className="bg-primary-soft text-primary-text rounded-full px-3 py-1 text-xs font-extrabold">
              {skillFitRatio}
            </span>
          </div>

          {skillFit.missingSkills && skillFit.missingSkills.length > 0 ? (
            <div className="border-line bg-canvas/80 space-y-2 rounded-2xl border p-4">
              <p className="text-text text-xs font-extrabold">
                {developHeading}
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {skillFit.missingSkills.map((sk) => (
                  <li
                    key={sk.id}
                    className="border-line bg-card rounded-xl border p-2.5 text-xs"
                  >
                    <p className="text-text font-bold">{sk.name}</p>
                    <p className="text-subtle mt-0.5 text-[11px]">
                      {sk.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {!cv.isPaid ? (
        <div className="border-line bg-card rounded-3xl border p-5 shadow-sm">
          <ManualCardPaymentBox
            purpose="CV_CREATION"
            amountUzs={5000}
            cvId={cv.id}
            title={payTitle}
            description={payDesc}
          />
        </div>
      ) : null}

      <CvPaymentShield isPaid={cv.isPaid} watermarkTag={user.email}>
        <div className="border-border overflow-hidden rounded-lg border bg-white p-6 shadow-sm sm:p-[16mm]">
          <CvDocument cv={cv} labels={labels} />
        </div>
      </CvPaymentShield>
    </div>
  );
}
