import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import type { LandingStats } from "@/backend/landing-stats";
import { Link } from "@/i18n/navigation";
import {
  ArrowRightIcon,
  BookmarkIcon,
  BriefcaseIcon,
  ChartIcon,
  GraduationCapIcon,
  MapPinIcon,
  SearchIcon,
} from "@/frontend/components/icons";
import styles from "./opportunities.module.css";

export async function Opportunities({ stats }: { stats: LandingStats }) {
  const [t, jobs, work, locale] = await Promise.all([
    getTranslations("Landing.opportunities"),
    getTranslations("Landing.liveJobs"),
    getTranslations("VacancyDetail.workTypes"),
    getLocale(),
  ]);
  const workTypes: Record<string, string> = {
    FULL_TIME: work("FULL_TIME"),
    PART_TIME: work("PART_TIME"),
    REMOTE: work("REMOTE"),
    INTERNSHIP: work("INTERNSHIP"),
  };
  const number = new Intl.NumberFormat(locale === "kk" ? "uz-UZ" : locale);
  const tzPartners = [
    { name: "QMU (KarSU)", logo: "/partners/karsu.webp", q: "QMU" },
    { name: "IT Park", logo: "/partners/it-park.webp", q: "IT Park" },
  ];
  const partnerLogoFor = (companyName: string): string | null => {
    const lower = companyName.toLowerCase();
    if (/qmu|karsu|qdu|universitet/.test(lower)) return "/partners/karsu.webp";
    if (/it[\s-]*park/.test(lower)) return "/partners/it-park.webp";
    return null;
  };
  const steps = [
    { label: t("discover"), Icon: SearchIcon, href: "/vacancies" },
    { label: t("profile"), Icon: GraduationCapIcon, href: "/student/cv" },
    { label: t("skills"), Icon: ChartIcon, href: "/student/personality" },
    { label: t("hired"), Icon: BriefcaseIcon, href: "/student/applications" },
  ];
  return (
    <div className={styles.section}>
      <section
        id="companies"
        className={styles.vacancies}
        aria-labelledby="opportunities-title"
      >
        <div className={styles.heading}>
          <div className={styles.headingLeft}>
            <h2 id="opportunities-title">{t("recent")}</h2>
            <div className={styles.partnerPills}>
              {tzPartners.map((partner) => (
                <Link
                  key={partner.name}
                  href={`/vacancies?q=${encodeURIComponent(partner.q)}`}
                  className={styles.partnerPill}
                >
                  <Image
                    src={partner.logo}
                    width={22}
                    height={22}
                    alt=""
                    unoptimized
                  />
                  <span>{partner.name}</span>
                </Link>
              ))}
              {stats.approvedCompanyList
                .filter(
                  (c) =>
                    !/qmu|karsu|qdu|it[\s-]*park/i.test(c.name),
                )
                .slice(0, 4)
                .map((company) => (
                  <Link
                    key={company.id}
                    href={`/vacancies?q=${encodeURIComponent(company.name)}`}
                    className={styles.partnerPill}
                  >
                    {company.hasLogo ? (
                      <Image
                        src={`/api/companies/${company.id}/logo`}
                        width={22}
                        height={22}
                        alt=""
                        unoptimized
                      />
                    ) : (
                      <span className={styles.partnerInitial} aria-hidden>
                        {company.name.slice(0, 1)}
                      </span>
                    )}
                    <span>{company.name}</span>
                  </Link>
                ))}
            </div>
          </div>
          <Link href="/vacancies">
            {t("viewAll")} <ArrowRightIcon size={14} />
          </Link>
        </div>
        <div className={styles.jobs}>
          {stats.featuredVacancies.slice(0, 4).map((job) => {
            const salary = [job.salaryFrom, job.salaryTo]
              .filter((value): value is number => value !== null)
              .map((value) => number.format(value))
              .join(" – ");
            const staticLogo = partnerLogoFor(job.companyName);
            return (
              <Link
                key={job.id}
                href={`/vacancies/${job.id}`}
                className={styles.job}
              >
                <div className={styles.jobTop}>
                  <div className={styles.company}>
                    {job.hasLogo ? (
                      <Image
                        src={`/api/companies/${job.companyId}/logo`}
                        width={30}
                        height={30}
                        alt=""
                        unoptimized
                      />
                    ) : staticLogo ? (
                      <Image
                        src={staticLogo}
                        width={30}
                        height={30}
                        alt=""
                        unoptimized
                      />
                    ) : (
                      <span className={styles.initial} aria-hidden>
                        {job.companyName.slice(0, 1)}
                      </span>
                    )}
                    <span>{job.companyName}</span>
                  </div>
                  <span className={styles.bookmark} aria-hidden>
                    <BookmarkIcon size={14} />
                  </span>
                </div>
                <h3>{job.title}</h3>
                <div className={styles.meta}>
                  {job.location && (
                    <span>
                      <MapPinIcon size={12} />
                      {job.location}
                    </span>
                  )}
                  {job.workType && (
                    <span>
                      <BriefcaseIcon size={12} />
                      {workTypes[job.workType] ?? job.workType}
                    </span>
                  )}
                </div>
                <div className={styles.jobBottom}>
                  <span className={styles.salary}>
                    {salary ? `${salary} ${job.currency}` : jobs("negotiable")}
                  </span>
                  <span className={styles.view}>
                    {t("view")} <ArrowRightIcon size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
          {stats.featuredVacancies.length === 0 && (
            <div className={styles.empty}>
              <SearchIcon size={20} />
              <p>{jobs("empty")}</p>
              <Link href="/vacancies">
                {t("viewAll")} <ArrowRightIcon size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>
      <section
        id="showcase"
        className={styles.student}
        aria-labelledby="student-journey-title"
      >
        <div className={styles.portrait} aria-hidden>
          <Image
            src="/orbit-student.webp"
            alt=""
            fill
            sizes="(min-width: 800px) 30vw, 45vw"
          />
        </div>
        <div className={styles.journey}>
          <p className={styles.eyebrow}>{t("forStudents")}</p>
          <h2 id="student-journey-title">{t("journey")}</h2>
          <div className={styles.flow}>
            <ol className={styles.steps}>
              {steps.map(({ label, Icon, href }, index) => (
                <li key={href}>
                  <Link className={styles.step} href={href}>
                    <span className={styles.stepIcon}>
                      <Icon size={21} />
                    </span>
                    <span>{label}</span>
                  </Link>
                  {index < steps.length - 1 && (
                    <ArrowRightIcon size={15} className={styles.connector} />
                  )}
                </li>
              ))}
            </ol>
            <div className={styles.start}>
              <Link href="/register?role=STUDENT">
                {t("getStarted")} <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
