import { getLocale, getTranslations } from "next-intl/server";
import { CvDocument } from "@/components/cv-document/cv-document";
import { Link, redirect } from "@/i18n/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { getCvDocumentLabels } from "@/lib/cv-document/labels";
import { loadSavedCvDocument } from "@/lib/cv-document/load";

export default async function StudentCvPreviewPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "STUDENT") return redirect({ href: "/account", locale });

  const cv = await loadSavedCvDocument(user.id);
  if (!cv) return redirect({ href: "/student/cv", locale });

  const t = await getTranslations("StudentCv.preview");
  const labels = await getCvDocumentLabels(cv.language);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted mt-1 text-sm">{t("note")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/student/cv"
            className="border-border rounded-lg border px-4 py-2 font-medium"
          >
            {t("back")}
          </Link>
          {/* Fayl yuklab olish (API), sahifaga o'tish emas. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/cv/me/pdf"
            className="bg-brand text-brand-foreground rounded-lg px-4 py-2 font-semibold"
          >
            {t("download")}
          </a>
        </div>
      </div>
      {/* A4 qog'oz ko'rinishi; ichidagi hujjat PDF dagi bilan bir xil. */}
      <div className="border-border overflow-hidden rounded-lg border bg-white p-6 shadow-sm sm:p-[16mm]">
        <CvDocument cv={cv} labels={labels} />
      </div>
    </div>
  );
}
