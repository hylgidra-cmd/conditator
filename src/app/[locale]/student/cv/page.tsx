import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { cvDataSchema } from "@/backend/cv/schema";
import {
  getMatchingVacanciesForCv,
  getOwnCv,
  getOwnCvs,
} from "@/backend/cv/service";
import { getCvDocumentLabels } from "@/backend/cv-document/labels";
import type {
  CvDocumentLabels,
  CvDocumentLanguage,
} from "@/backend/cv-document/types";
import { activeResult } from "@/backend/personality/service";
import styles from "@/frontend/components/cv/cv-studio.module.css";
import { CvWorkspace } from "@/frontend/components/cv/cv-workspace";
import {
  type CvDraft,
  type CvPrivacyState,
  type CvTemplateId,
  draftFromData,
  emptyCvData,
  type WorkTypeValue,
} from "@/frontend/components/cv/types";
import { redirect } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("myCv") };
}

export default async function StudentCvPage({
  searchParams,
}: {
  searchParams: Promise<{ cvId?: string; new?: string; payment?: string }>;
}) {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "STUDENT") return redirect({ href: "/account", locale });
  if (!(await activeResult(user.id)))
    return redirect({ href: "/student/personality", locale });

  const { cvId, new: newParam, payment } = await searchParams;
  const isNew = newParam === "1";

  const tStudio = await getTranslations("CvStudio");
  const [cv, rawCvs] = await Promise.all([
    isNew ? Promise.resolve(null) : getOwnCv(user.id, cvId),
    getOwnCvs(user.id),
  ]);

  const parsed = cv ? cvDataSchema.safeParse(cv.data) : null;
  const data = parsed?.success ? parsed.data : emptyCvData(user.email);
  const routeLang = (
    ["kk", "uz", "ru", "en"].includes(locale) ? locale : "uz"
  ) as CvDocumentLanguage;
  const draftLang: CvDocumentLanguage =
    (cv?.language as CvDocumentLanguage | undefined) || routeLang;

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

  const [kkLabels, uzLabels, ruLabels, enLabels, matchingVacancies] =
    await Promise.all([
      getCvDocumentLabels("kk"),
      getCvDocumentLabels("uz"),
      getCvDocumentLabels("ru"),
      getCvDocumentLabels("en"),
      getMatchingVacanciesForCv(data, cv?.title ?? ""),
    ]);
  const allLabels: Record<CvDocumentLanguage, CvDocumentLabels> = {
    kk: kkLabels,
    uz: uzLabels,
    ru: ruLabels,
    en: enLabels,
  };

  const allCvs = rawCvs.map((item) => ({
    id: item.id,
    title: item.title,
    templateId: item.templateId,
    language: item.language,
    isVisible: item.isVisible,
    isPaid: item.isPaid,
    savedAt: item.savedAt?.toISOString() ?? null,
    applicationsCount: item._count.applications,
  }));

  return (
    <div className={`${styles.stage} font-ui`}>
      <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 pt-5 pb-16 sm:px-6 lg:px-10 lg:pt-6">
        {/* ================= STUDIO HERO BANNER (3D CV GLASS + PEN) ================= */}
        <section className={styles.heroWrap}>
          <div aria-hidden className={styles.heroArtwork} />
          <div aria-hidden className={styles.heroScrim} />
          <div className="relative z-10 flex min-h-[152px] flex-col justify-center px-6 py-6 sm:min-h-[178px] sm:px-10 lg:min-h-[196px] lg:px-12">
            <div className="max-w-xl">
              <h1 className="text-[28px] leading-[1.14] font-extrabold tracking-tight text-[#0b2017] sm:text-[36px] lg:text-[40px] dark:text-[#f4fbf8]">
                {tStudio("heroTitle")}
              </h1>
              <p className="mt-2 text-sm font-medium text-[#47675a] sm:text-base dark:text-[#9ec5b4]">
                {tStudio("heroSubtitle")}
              </p>
            </div>
          </div>
        </section>

        <CvWorkspace
          key={isNew ? "new-cv" : (cv?.id ?? "default-cv")}
          initialDraft={draft}
          initialMeta={{
            id: cv?.id,
            savedAt: cv?.savedAt?.toISOString() ?? null,
            isVisible: cv?.isVisible ?? false,
            isPaid: cv?.isPaid ?? false,
          }}
          labelsMap={allLabels}
          allCvs={allCvs}
          matchingVacancies={matchingVacancies}
          isNewCv={isNew}
          paymentSuccess={payment === "success"}
        />
      </div>
    </div>
  );
}
