import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";
import { getApplyPassStatus } from "@/backend/payment/service";
import {
  CANONICAL_SITE_URL,
  OG_LOCALE,
  buildAlternates,
  safeJsonLd,
} from "@/backend/seo";
import { Reveal } from "@/frontend/components/ds/motion";
import { ArrowLeftIcon } from "@/frontend/components/icons";
import { ApplyModal } from "@/frontend/components/vacancy/apply-modal";
import { Link } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  REMOTE: "FULL_TIME",
  INTERNSHIP: "INTERN",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const validLocale: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const vacancy = await db.vacancy.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      rawText: true,
      location: true,
      salaryFrom: true,
      salaryTo: true,
      currency: true,
      skills: true,
      status: true,
      expiresAt: true,
      company: {
        select: {
          name: true,
          approval: true,
          user: { select: { status: true } },
        },
      },
    },
  });

  if (
    !vacancy ||
    vacancy.status !== "ACTIVE" ||
    vacancy.company.approval !== "APPROVED" ||
    vacancy.company.user.status !== "ACTIVE" ||
    (vacancy.expiresAt && vacancy.expiresAt <= new Date())
  ) {
    return { robots: { index: false, follow: false } };
  }

  const companyName = vacancy.company.name?.trim() || "Candidator";
  const pageTitle = `${vacancy.title} — ${companyName}`;
  const salaryPart =
    vacancy.salaryFrom || vacancy.salaryTo
      ? `${vacancy.salaryFrom ? vacancy.salaryFrom.toLocaleString("en-US") : ""}${vacancy.salaryTo ? `–${vacancy.salaryTo.toLocaleString("en-US")}` : ""} ${vacancy.currency}`
      : "";
  const description = [
    `${vacancy.title} (${companyName})`,
    vacancy.location,
    salaryPart,
    vacancy.rawText?.replace(/\s+/g, " ").slice(0, 140),
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 160);

  return {
    title: pageTitle,
    description,
    keywords: [
      vacancy.title,
      companyName,
      "vakansiya",
      "ish",
      "Candidator",
      ...(vacancy.location ? [vacancy.location] : []),
      ...vacancy.skills.slice(0, 8),
    ],
    alternates: buildAlternates(validLocale, `/vacancies/${vacancy.id}`),
    openGraph: {
      type: "article",
      siteName: "Candidator",
      locale: OG_LOCALE[validLocale],
      url: `${CANONICAL_SITE_URL}/${validLocale}/vacancies/${vacancy.id}`,
      title: `${pageTitle} — Candidator`,
      description,
      images: [
        {
          url: `${CANONICAL_SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
  };
}

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const validLocale: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const user = await currentUser();
  const t = await getTranslations("VacancyDetail");

  const vacancy = await db.vacancy.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoPath: true,
          industry: true,
          size: true,
          country: true,
          approval: true,
          user: { select: { status: true } },
        },
      },
    },
  });

  if (
    !vacancy ||
    vacancy.status !== "ACTIVE" ||
    vacancy.company.approval !== "APPROVED" ||
    vacancy.company.user.status !== "ACTIVE" ||
    (vacancy.expiresAt && vacancy.expiresAt <= new Date())
  ) {
    notFound();
  }

  // If student, check if they have CVs and if already applied
  let studentCvs: {
    id: string;
    title: string;
    savedAt: string | null;
    isPaid: boolean;
  }[] = [];
  let existingApplication = null;
  let existingConversation = null;
  let passStatus: {
    canApply: boolean;
    hasActivePass: boolean;
    freeTrialAvailable: boolean;
    applyPassUntil: string | null;
  } = {
    canApply: false,
    hasActivePass: false,
    freeTrialAvailable: false,
    applyPassUntil: null,
  };

  if (user && user.role === "STUDENT") {
    const [cvs, app, conv, pass] = await Promise.all([
      db.cv.findMany({
        where: { userId: user.id, savedAt: { not: null } },
        select: { id: true, title: true, savedAt: true, isPaid: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.vacancyApplication.findFirst({
        where: { vacancyId: vacancy.id, studentId: user.id },
      }),
      db.conversation.findFirst({
        where: {
          vacancyId: vacancy.id,
          studentId: user.id,
          companyId: vacancy.companyId,
        },
      }),
      getApplyPassStatus(user.id),
    ]);
    studentCvs = cvs.map((c) => ({
      id: c.id,
      title: c.title,
      savedAt: c.savedAt?.toISOString() ?? null,
      isPaid: c.isPaid,
    }));
    existingApplication = app;
    existingConversation = conv;
    passStatus = {
      canApply: pass.canApply,
      hasActivePass: pass.hasActivePass,
      freeTrialAvailable: pass.freeTrialAvailable,
      applyPassUntil: pass.applyPassUntil?.toISOString() ?? null,
    };
  }

  // Google Jobs (Schema.org JobPosting) structured data
  const companyDisplay = vacancy.company.name?.trim() || "Candidator";
  const jobPostingLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: vacancy.title,
    description:
      vacancy.rawText?.trim() ||
      `${vacancy.title} — ${companyDisplay}. ${vacancy.skills.join(", ")}`,
    datePosted: vacancy.createdAt.toISOString(),
    ...(vacancy.expiresAt
      ? { validThrough: vacancy.expiresAt.toISOString() }
      : {}),
    ...(vacancy.workType
      ? { employmentType: EMPLOYMENT_TYPE_MAP[vacancy.workType] ?? "FULL_TIME" }
      : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: companyDisplay,
      ...(vacancy.company.logoPath
        ? { logo: `${CANONICAL_SITE_URL}/api/companies/${vacancy.company.id}/logo` }
        : {}),
    },
    ...(vacancy.workType === "REMOTE"
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: vacancy.company.country || "Uzbekistan",
          },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: vacancy.location || "Tashkent",
              addressCountry: vacancy.company.country || "UZ",
            },
          },
        }),
    ...(vacancy.salaryFrom || vacancy.salaryTo
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: vacancy.currency || "UZS",
            value: {
              "@type": "QuantitativeValue",
              ...(vacancy.salaryFrom ? { minValue: vacancy.salaryFrom } : {}),
              ...(vacancy.salaryTo ? { maxValue: vacancy.salaryTo } : {}),
              unitText: "MONTH",
            },
          },
        }
      : {}),
    ...(vacancy.skills.length > 0 ? { skills: vacancy.skills.join(", ") } : {}),
    url: `${CANONICAL_SITE_URL}/${validLocale}/vacancies/${vacancy.id}`,
  };

  return (
    <div className="page-x font-ui max-w-4xl space-y-6 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jobPostingLd) }}
      />
      {/* Back button */}
      <Reveal>
        <div>
          <Link
            href="/vacancies"
            className="border-line bg-card/85 text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-colors"
          >
            <ArrowLeftIcon size={14} />
            {t("back")}
          </Link>
        </div>
      </Reveal>

      {/* Main Vacancy Card */}
      <Reveal delay={75}>
        <div className="border-line bg-card/90 shadow-float relative space-y-6 overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />

          <div className="border-line relative z-10 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-subtle text-xs font-bold tracking-wider uppercase">
                  {vacancy.company.name ?? ""}
                </span>
                {vacancy.company.industry && (
                  <span className="text-subtle text-xs">
                    {"· "}
                    {vacancy.company.industry}
                  </span>
                )}
              </div>
              <h1 className="text-h2 text-text font-extrabold tracking-tight">
                {vacancy.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {vacancy.workType && (
                  <span className="bg-primary/10 text-primary rounded-full px-3 py-1 font-bold">
                    {t(`workTypes.${vacancy.workType}` as "workTypes.FULL_TIME")}
                  </span>
                )}
                {vacancy.location && (
                  <span className="border-line bg-canvas text-text rounded-full border px-3 py-1 font-semibold">
                    {t("location", { location: vacancy.location })}
                  </span>
                )}
                {vacancy.minExperienceYears !== null && (
                  <span className="border-line bg-canvas text-text rounded-full border px-3 py-1 font-semibold">
                    {vacancy.minExperienceYears > 0
                      ? t("experience", { years: vacancy.minExperienceYears })
                      : t("noExperience")}
                  </span>
                )}
                <span className="text-subtle ml-auto font-medium">
                  {t("postedAt", { date: formatDate(vacancy.createdAt) })}
                </span>
              </div>
            </div>

            {/* Salary */}
            <div className="text-left sm:text-right">
              {vacancy.salaryFrom || vacancy.salaryTo ? (
                <div className="border-primary/25 bg-primary/8 rounded-2xl border px-4 py-2.5">
                  <span className="text-primary block text-xs font-bold tracking-wider uppercase">
                    {t("salary")}
                  </span>
                  <span className="text-text text-xl font-black">
                    {vacancy.salaryFrom
                      ? `${vacancy.salaryFrom.toLocaleString()} `
                      : ""}
                    {vacancy.salaryTo
                      ? `– ${vacancy.salaryTo.toLocaleString()} `
                      : ""}
                    {vacancy.currency}
                  </span>
                </div>
              ) : (
                <span className="text-subtle text-sm font-medium">
                  {t("salaryNegotiable")}
                </span>
              )}
            </div>
          </div>

          {/* Application CTA for Students */}
          {user?.role === "STUDENT" && (
            <div className="border-line bg-canvas/70 relative z-10 rounded-2xl border p-5">
              <ApplyModal
                vacancyId={vacancy.id}
                studentCvs={studentCvs}
                alreadyApplied={Boolean(existingApplication)}
                applicationStatus={existingApplication?.status}
                conversationId={existingConversation?.id}
                canApply={passStatus.canApply}
                hasActivePass={passStatus.hasActivePass}
                freeTrialAvailable={passStatus.freeTrialAvailable}
                applyPassUntil={passStatus.applyPassUntil}
              />
            </div>
          )}

          {!user && (
            <div className="border-line bg-canvas/70 relative z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5">
              <div>
                <h4 className="text-text font-extrabold">
                  {t("loginPromptTitle")}
                </h4>
                <p className="text-subtle text-xs">{t("loginPromptDesc")}</p>
              </div>
              <Link
                href="/login"
                className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-2xl px-5 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
              >
                {t("login")}
              </Link>
            </div>
          )}

          {/* Requirements / Description */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-text text-lg font-extrabold">
              {t("descTitle")}
            </h2>
            {vacancy.rawText ? (
              <div className="text-text/90 text-sm leading-relaxed whitespace-pre-line">
                {vacancy.rawText}
              </div>
            ) : (
              <p className="text-subtle text-sm">{t("noDesc")}</p>
            )}
          </div>

          {/* Skills */}
          {vacancy.skills.length > 0 && (
            <div className="border-line relative z-10 space-y-2.5 border-t pt-4">
              <h3 className="text-subtle text-xs font-bold tracking-wider uppercase">
                {t("skillsTitle")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {vacancy.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {vacancy.languages.length > 0 && (
            <div className="border-line relative z-10 space-y-2.5 border-t pt-4">
              <h3 className="text-subtle text-xs font-bold tracking-wider uppercase">
                {t("languagesTitle")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {vacancy.languages.map((lang) => (
                  <span
                    key={lang}
                    className="border-line bg-canvas text-text rounded-full border px-3 py-1 text-xs font-semibold"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
