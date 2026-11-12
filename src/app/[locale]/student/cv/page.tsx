import { getLocale, getTranslations } from "next-intl/server";
import {
  emptyCvData,
  type CvDraft,
  type CvTemplateId,
  draftFromData,
  type WorkTypeValue,
  type CvPrivacyState,
} from "@/frontend/components/cv/types";
import { CvWorkspace } from "@/frontend/components/cv/cv-workspace";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import { cvDataSchema } from "@/backend/cv/schema";
import { getOwnCv } from "@/backend/cv/service";
import { getCvDocumentLabels } from "@/backend/cv-document/labels";
import type {
  CvDocumentLabels,
  CvDocumentLanguage,
} from "@/backend/cv-document/types";

export default async function StudentCvPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "STUDENT") return redirect({ href: "/account", locale });

  const t = await getTranslations("StudentCv");
  const cv = await getOwnCv(user.id);
  const parsed = cv ? cvDataSchema.safeParse(cv.data) : null;
  const data = parsed?.success ? parsed.data : emptyCvData(user.email);
  const routeLang = (
    ["kk", "uz", "ru", "en"].includes(locale) ? locale : "uz"
  ) as CvDocumentLanguage;
  const draftLang: CvDocumentLanguage =
    (cv?.language && cv.language !== "en"
      ? (cv.language as CvDocumentLanguage)
      : routeLang) || routeLang;

  const draft: CvDraft = draftFromData(data, {
    title: cv?.title ?? "",
    templateId: (cv?.templateId as CvTemplateId) || "modern-1",
    privacy:
      typeof cv?.privacy === "object" && cv?.privacy !== null
        ? (cv.privacy as Partial<CvPrivacyState>)
        : undefined,
    language: draftLang,
    workTypes: (cv?.workTypes ?? []) as WorkTypeValue[],
    sourceText: cv?.sourceText ?? "",
  });

  const [kkLabels, uzLabels, ruLabels, enLabels] = await Promise.all([
    getCvDocumentLabels("kk"),
    getCvDocumentLabels("uz"),
    getCvDocumentLabels("ru"),
    getCvDocumentLabels("en"),
  ]);
  const allLabels: Record<CvDocumentLanguage, CvDocumentLabels> = {
    kk: kkLabels,
    uz: uzLabels,
    ru: ruLabels,
    en: enLabels,
  };

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 px-3 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {!cv ? <p className="text-muted mt-1 text-sm">{t("empty")}</p> : null}
      </div>
      <CvWorkspace
        initialDraft={draft}
        initialMeta={{
          savedAt: cv?.savedAt?.toISOString() ?? null,
          isVisible: cv?.isVisible ?? false,
        }}
        labelsMap={allLabels}
      />
    </div>
  );
}
