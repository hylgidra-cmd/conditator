import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  BriefcaseIcon,
  GraduationCapIcon,
  NetworkIcon,
} from "@/frontend/components/icons";
import { HeroSearch } from "./hero-terminal";
import styles from "./hero.module.css";

export async function Hero() {
  const [t, hero] = await Promise.all([
    getTranslations("Landing.referenceHero"),
    getTranslations("Landing.hero"),
  ]);
  return (
    <section
      className={`orbit-hero ${styles.hero}`}
      aria-labelledby="hero-title"
    >
      <div aria-hidden className={styles.ribbonLeft} />
      <div aria-hidden className={styles.ribbonRight} />
      <div className={styles.inner}>
        <div className={styles.stage}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>{t("badge")}</p>
            <h1 id="hero-title">{t("title")}</h1>
            <p className={styles.description}>{t("description")}</p>
            <div className={styles.actions}>
              <Link href="/vacancies">
                {t("findJob")} <span aria-hidden>→</span>
              </Link>
              <Link href="/register?role=COMPANY">{t("hireTalent")}</Link>
            </div>
            <div className={styles.audience}>
              <Link href="/register?role=STUDENT">
                <GraduationCapIcon size={17} />
                {t("students")}
              </Link>
              <Link href="/register?role=COMPANY">
                <BriefcaseIcon size={17} />
                {t("employers")}
              </Link>
              <Link href="/#showcase">
                <NetworkIcon size={17} />
                {t("ecosystem")}
              </Link>
            </div>
          </div>
          <div className={`orbit-art ${styles.art}`}>
            <Image
              src="/hero-people.png"
              alt=""
              width={1802}
              height={873}
              priority
              sizes="(min-width: 800px) 65vw, 100vw"
            />
            <div aria-hidden className="orbit-track">
              <i />
              <i />
            </div>
          </div>
        </div>
        <div className={styles.search}>
          <HeroSearch
            placeholder={t("search")}
            buttonLabel={hero("searchButton")}
            quickLabel={hero("quickLabel")}
            tags={[
              hero("tag1"),
              hero("tag2"),
              hero("tag3"),
              hero("tag4"),
              hero("tag5"),
            ]}
            locationLabel={t("location")}
            countryLabel={t("country")}
          />
        </div>
      </div>
    </section>
  );
}
