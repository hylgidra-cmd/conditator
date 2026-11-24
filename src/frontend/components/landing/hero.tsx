import type { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  LayersIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";
import { HeroRibbons } from "./hero-ribbons";
import { HeroSearch } from "./hero-search";
import { HeroStage } from "./hero-stage";
import styles from "./hero.module.css";

/** Hero section matching approved layout with independent orbital/card/ribbon motion. */
export async function Hero({ userRole }: { userRole?: Role }) {
  const t = await getTranslations("Landing.referenceHero");

  const hireHref =
    userRole === "COMPANY"
      ? "/company/vacancies/new"
      : userRole === "ADMIN"
        ? "/admin"
        : "/register?role=COMPANY";

  const locations = [
    { value: "Tashkent", label: t("cityTashkent") },
    { value: "Nukus", label: t("cityNukus") },
    { value: "Samarkand", label: t("citySamarkand") },
    { value: "Bukhara", label: t("cityBukhara") },
    { value: "Fergana", label: t("cityFergana") },
    { value: "Andijan", label: t("cityAndijan") },
    { value: "Namangan", label: t("cityNamangan") },
  ];

  const popularTags = [
    { label: t("tagInternship"), href: "/vacancies?workType=INTERNSHIP" },
    { label: t("tagIt"), href: "/vacancies?q=IT" },
    { label: t("tagMarketing"), href: "/vacancies?q=Marketing" },
    { label: t("tagFinance"), href: "/vacancies?q=Finance" },
    { label: t("tagEngineering"), href: "/vacancies?q=Engineering" },
  ];

  return (
    <section className={styles.hero}>
      <HeroRibbons />

      <div className={styles.inner}>
        <div className={styles.stage}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>{t("badge")}</p>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.subtitle}>{t("description")}</p>

            <div className={styles.actions}>
              <Link href="/vacancies" className={styles.btnPrimary}>
                <span>{t("findJob")}</span>
                <ArrowRightIcon size={16} />
              </Link>
              <Link href={hireHref} className={styles.btnSecondary}>
                {t("hireTalent")}
              </Link>
            </div>

            <div className={styles.pillars}>
              <Link href="/#student-journey" className={styles.pillarItem}>
                <GraduationCapIcon size={16} className={styles.pillarIcon} />
                <span>{t("students")}</span>
              </Link>
              <Link href="/#employer-section" className={styles.pillarItem}>
                <BriefcaseIcon size={16} className={styles.pillarIcon} />
                <span>{t("employers")}</span>
              </Link>
              <Link href="/#how-it-works" className={styles.pillarItem}>
                <LayersIcon size={16} className={styles.pillarIcon} />
                <span>{t("ecosystem")}</span>
              </Link>
            </div>
          </div>

          <HeroStage
            studentAlt={t("students")}
            employerAlt={t("employers")}
            globeAlt={t("country")}
          />
        </div>

        <HeroSearch
          searchPlaceholder={t("search")}
          searchLabel={t("searchButton")}
          locationLabel={t("location")}
          countryLabel={t("country")}
          locations={locations}
          popularLabel={t("popularLabel")}
          popularTags={popularTags}
        />
      </div>
    </section>
  );
}
