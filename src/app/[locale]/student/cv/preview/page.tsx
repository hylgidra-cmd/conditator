import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { getCvDocumentLabels } from "@/backend/cv-document/labels";
import { loadSavedCvDocument } from "@/backend/cv-document/load";
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

  const t = await getTranslations("StudentCv.preview");
  const labels = await getCvDocumentLabels(cv.language);

  const backHref = `/student/cv?cvId=${encodeURIComponent(cv.id)}`;
  const pdfHref = `/api/cv/me/pdf?cvId=${encodeURIComponent(cv.id)}`;
  const docxHref = `/api/cv/me/docx?cvId=${encodeURIComponent(cv.id)}`;
  const docxLabel = "Word (.docx)";
  const lockedBadgeLabel = "🔒 PDF va skrinshot to'lovdan so'ng ochiladi";
  const payTitle = "CV ni faollashtirish va toza PDF / DOCX yuklab olish (5 000 so'm)";
  const payDesc =
    "To'lov tasdiqlangach, skrinshot va ekran yozib olish cheklovi avtomatik o'chadi hamda toza PDF va Word (.docx) hujjatlar ochiladi.";

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
              {/* Fayl yuklab olish (API), sahifaga o'tish emas. */}
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

      {/* A4 qog'oz ko'rinishi; to'lanmagan bo'lsa skrinshot/ekran-zapis himoyasi bilan. */}
      <CvPaymentShield isPaid={cv.isPaid} watermarkTag={user.email}>
        <div className="border-border overflow-hidden rounded-lg border bg-white p-6 shadow-sm sm:p-[16mm]">
          <CvDocument cv={cv} labels={labels} />
        </div>
      </CvPaymentShield>
    </div>
  );
}
