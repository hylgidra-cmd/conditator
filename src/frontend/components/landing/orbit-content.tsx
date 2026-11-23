import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { LandingStats } from "@/backend/landing-stats";
import { Link } from "@/i18n/navigation";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  ChartIcon,
  CheckIcon,
  LayersIcon,
  ShieldCheckIcon,
  UsersIcon,
  ZapIcon,
} from "@/frontend/components/icons";
import { AnimatedNumber, Reveal } from "@/frontend/components/ds/motion";
import { Opportunities } from "./opportunities";
import styles from "./orbit-content.module.css";

export async function OrbitContent({ stats }: { stats: LandingStats }) {
  const t = await getTranslations("Landing.opportunities");

  const defaultCandidates = [
    {
      id: "sample-1",
      name: t("sample1Name"),
      role: t("sample1Role"),
      matchScore: 97,
    },
    {
      id: "sample-2",
      name: t("sample2Name"),
      role: t("sample2Role"),
      matchScore: 95,
    },
    {
      id: "sample-3",
      name: t("sample3Name"),
      role: t("sample3Role"),
      matchScore: 93,
    },
  ];

  const defaultAvatars = [
    "/images/avatar-young-man.webp",
    "/images/avatar-woman-blazer.webp",
    "/images/avatar-man-beige-blazer.webp",
  ];

  const candidateCards = [0, 1, 2].map((idx) => {
    const item = stats.candidatePreviews[idx] ?? defaultCandidates[idx];
    return {
      ...item,
      avatar: defaultAvatars[idx] ?? defaultAvatars[0],
    };
  });

  const whyItems = [
    {
      title: t("why1Title"),
      desc: t("why1Desc"),
      Icon: ZapIcon,
    },
    {
      title: t("why2Title"),
      desc: t("why2Desc"),
      Icon: LayersIcon,
    },
    {
      title: t("why3Title"),
      desc: t("why3Desc"),
      Icon: UsersIcon,
    },
    {
      title: t("why4Title"),
      desc: t("why4Desc"),
      Icon: ShieldCheckIcon,
    },
  ];

  const statItems = [
    {
      value: stats.visibleCvs,
      suffix: "+",
      label: t("statStudents"),
      Icon: UsersIcon,
    },
    {
      value: stats.approvedCompanies,
      suffix: "+",
      label: t("statEmployers"),
      Icon: BriefcaseIcon,
    },
    {
      value: stats.activeVacancies,
      suffix: "+",
      label: t("statVacancies"),
      Icon: BriefcaseIcon,
    },
    {
      value: stats.hiredRate,
      suffix: "%",
      label: t("statHired"),
      Icon: ChartIcon,
    },
  ];

  return (
    <div className="orbit-content font-ui">
      <Opportunities stats={stats} />

      {/* 3-rasm: FOR EMPLOYERS — Find and hire ready talent */}
      <section
        id="employers"
        className={styles.employerWrap}
        aria-labelledby="employer-section-title"
      >
        <Reveal>
          <div className={styles.employerBand}>
            <div aria-hidden className={styles.employerRibbonLeft} />
            <div className={styles.employerCopy}>
              <p className={styles.eyebrow}>{t("forEmployers")}</p>
              <h2 id="employer-section-title">{t("employerTitle")}</h2>
              <p className={styles.employerDesc}>{t("employerDesc")}</p>
              <Link
                href="/register?role=COMPANY"
                className={styles.employerCta}
              >
                {t("employerCta")} <ArrowRightIcon size={15} />
              </Link>
            </div>

            <div className={styles.candidateStack}>
              {candidateCards.map((cand, index) => (
                <div
                  key={cand.id}
                  className={`${styles.candidateCard} ${
                    index === 0
                      ? styles.candidateTop
                      : index === 1
                        ? styles.candidateMid
                        : styles.candidateBot
                  }`}
                >
                  <span className={styles.candidateAvatar} aria-hidden>
                    <Image
                      src={cand.avatar}
                      alt=""
                      width={38}
                      height={38}
                    />
                  </span>
                  <div className={styles.candidateInfo}>
                    <strong>{cand.name}</strong>
                    <span>{cand.role}</span>
                  </div>
                  <span className={styles.matchPill}>
                    <span className={styles.matchCheck} aria-hidden>
                      <CheckIcon size={11} />
                    </span>
                    {index === 0
                      ? t("matchBadge", { score: cand.matchScore })
                      : `${cand.matchScore}%`}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.employerVisual} aria-hidden>
              <Image
                src="/orbit-employer.webp"
                alt=""
                fill
                sizes="(min-width: 900px) 38vw, 100vw"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* 3–4-rasm: Why CANDIDATOR + 4 ustun + Xarita va 4 ko'rsatkich */}
      <section
        id="categories"
        className={styles.whySection}
        aria-labelledby="why-candidator-title"
      >
        <Reveal>
          <h2 id="why-candidator-title" className={styles.whyHeading}>
            {t("whyTitle")}
          </h2>

          <div className={styles.whyGrid}>
            {whyItems.map(({ title, desc, Icon }) => (
              <div key={title} className={styles.whyItem}>
                <span className={styles.whyIcon} aria-hidden>
                  <Icon size={21} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.statsBar}>
            <div className={styles.statsMap} aria-hidden>
              <Image
                src="/orbit-map.webp"
                alt=""
                width={318}
                height={120}
                className={styles.mapImg}
              />
              <span className={styles.mapPulse} />
            </div>

            <div className={styles.statsGrid}>
              {statItems.map(({ value, suffix, label, Icon }) => (
                <div key={label} className={styles.statBox}>
                  <span className={styles.statIcon} aria-hidden>
                    <Icon size={18} />
                  </span>
                  <strong className={styles.statValue}>
                    <AnimatedNumber value={value} suffix={suffix} />
                  </strong>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4-rasm: Join Uzbekistan's talent ecosystem */}
      <section
        id="profile"
        className={styles.joinSection}
        aria-labelledby="join-ecosystem-title"
      >
        <Reveal>
          <div className={styles.joinBanner}>
            <div className={styles.joinArt} aria-hidden>
              <Image
                src="/orbit-banner.webp"
                alt=""
                fill
                sizes="(min-width: 800px) 55vw, 100vw"
              />
              <div className={styles.joinOrbitRing}>
                <i />
              </div>
            </div>

            <div className={styles.joinCopy}>
              <h2 id="join-ecosystem-title">{t("joinTitle")}</h2>
              <p>{t("joinSubtitle")}</p>
              <div className={styles.joinActions}>
                <Link
                  href="/register?role=STUDENT"
                  className={styles.joinBtnPrimary}
                >
                  {t("joinStudent")} <ArrowRightIcon size={15} />
                </Link>
                <Link
                  href="/register?role=COMPANY"
                  className={styles.joinBtnSecondary}
                >
                  {t("joinEmployer")} <ArrowRightIcon size={15} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
