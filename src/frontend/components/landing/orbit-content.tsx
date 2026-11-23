import { getTranslations } from "next-intl/server";
import type { LandingStats } from "@/backend/landing-stats";
import { Link } from "@/i18n/navigation";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  SparkIcon,
  UserIcon,
  FileTextIcon,
} from "@/frontend/components/icons";
import { Reveal } from "@/frontend/components/ds/motion";

export async function OrbitContent({ stats }: { stats: LandingStats }) {
  const [jobs, show, cta, detail] = await Promise.all([
    getTranslations("Landing.liveJobs"),
    getTranslations("Landing.showcase"),
    getTranslations("Landing.ctaBand"),
    getTranslations("VacancyDetail.workTypes"),
  ]);
  const types: Record<string, string> = {
    FULL_TIME: detail("FULL_TIME"),
    PART_TIME: detail("PART_TIME"),
    REMOTE: detail("REMOTE"),
    INTERNSHIP: detail("INTERNSHIP"),
  };
  const roles = [
    {
      badge: cta("studentBadge"),
      title: cta("studentTitle"),
      desc: cta("studentDesc"),
      steps: [
        show("studentStep1"),
        show("studentStep2"),
        show("studentStep3"),
        show("studentStep4"),
      ],
      href: "/register?role=STUDENT",
      action: cta("studentPrimary"),
      Icon: UserIcon,
    },
    {
      badge: cta("companyBadge"),
      title: cta("companyTitle"),
      desc: cta("companyDesc"),
      steps: [
        show("companyStep1"),
        show("companyStep2"),
        show("companyStep3"),
        show("companyStep4"),
      ],
      href: "/register?role=COMPANY",
      action: cta("companyPrimary"),
      Icon: BriefcaseIcon,
    },
  ];
  return (
    <div className="orbit-content font-ui">
      <section className="page-x py-8" id="companies">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="orbit-kicker">{jobs("badge")}</span>
              <h2 className="orbit-title mt-3">{jobs("title")}</h2>
              <p className="text-subtle mt-3 max-w-2xl">{jobs("subtitle")}</p>
            </div>
            <Link href="/vacancies" className="orbit-text-link">
              {jobs("viewAll")} <ArrowRightIcon size={17} />
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.featuredVacancies.slice(0, 4).map((job) => (
            <Link
              href={`/vacancies/${job.id}`}
              key={job.id}
              className="orbit-job group"
            >
              <span className="orbit-job-icon">
                <BriefcaseIcon size={20} />
              </span>
              <p className="text-subtle mt-4 text-sm font-semibold">
                {job.companyName}
              </p>
              <h3 className="text-text mt-2 text-lg font-bold">{job.title}</h3>
              <p className="text-subtle mt-3 text-sm">
                {[job.location, job.workType ? types[job.workType] : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-text mt-3 text-sm">
                {[job.salaryFrom, job.salaryTo]
                  .filter((value) => value !== null)
                  .map((value) => value?.toLocaleString("uz-UZ"))
                  .join(" – ")}{" "}
                {job.salaryFrom !== null || job.salaryTo !== null
                  ? job.currency
                  : jobs("negotiable")}
              </p>
              <span className="orbit-text-link mt-4">
                {jobs("applyBtn")} <ArrowRightIcon size={16} />
              </span>
            </Link>
          ))}
          {stats.featuredVacancies.length === 0 && (
            <p className="text-subtle">{jobs("empty")}</p>
          )}
        </div>
      </section>
      <section id="showcase" className="page-x orbit-stories">
        {roles.map(({ badge, title, desc, steps, href, action, Icon }, i) => (
          <Reveal key={badge}>
            <div className={`orbit-role orbit-role-${i}`}>
              <div>
                <span className="orbit-kicker">{badge}</span>
                <h2 className="orbit-title mt-4">{title}</h2>
                <p className="text-subtle mt-4 max-w-xl leading-relaxed">
                  {desc}
                </p>
                <Link href={href} className="orbit-cta mt-6">
                  {action} <ArrowRightIcon size={17} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {steps.map((step, n) => (
                  <div key={step} className="orbit-step">
                    <span className="orbit-step-icon">
                      {n === 0 ? (
                        <Icon size={20} />
                      ) : n === 1 ? (
                        <FileTextIcon size={20} />
                      ) : (
                        <SparkIcon size={20} />
                      )}
                    </span>
                    <span className="mt-5 block text-sm font-bold">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </section>
      <section id="categories" className="page-x py-7">
        <div className="orbit-feature-band">
          <div>
            <h2 className="orbit-title mt-3">{show("title")}</h2>
            <div className="orbit-benefits">
              {[
                show("studentPipelineTitle"),
                show("companyPipelineTitle"),
                show("langTitle"),
                show("privacyTitle"),
              ].map((label) => (
                <div key={label}>
                  <SparkIcon size={20} />
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              [stats.activeVacancies, show("liveVacancies")],
              [stats.visibleCvs, show("liveCvs")],
              [stats.approvedCompanies, show("liveCompanies")],
            ].map(([value, label]) => (
              <div key={label} className="orbit-metric">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="profile" className="page-x pb-6">
        <div className="orbit-final">
          <div>
            <span className="text-sm font-bold tracking-widest uppercase">
              {show("badge")}
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              {show("title")}
            </h2>
            <p className="mt-3 max-w-xl text-white/80">{show("subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="orbit-final-link" href="/register?role=STUDENT">
              {cta("studentPrimary")} <ArrowRightIcon size={17} />
            </Link>
            <Link className="orbit-final-link" href="/register?role=COMPANY">
              {cta("companyPrimary")} <ArrowRightIcon size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
