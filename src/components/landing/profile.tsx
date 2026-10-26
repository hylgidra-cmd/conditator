import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { StepItem } from "@/components/ds/card";
import {
  ConcentricArcs,
  DashedArrow,
  SoftBlob,
  Spiral,
} from "@/components/ds/decor";
import { NotificationCard, ProfileCard } from "@/components/ds/floating-card";
import { FigurePlaceholder } from "./figure-placeholder";

/** Profil boʻlimi rasmi (kesilgan, shaffof fonli). `null` boʻlsa siluet chiziladi. */
const PROFILE_IMAGE: string | null = "/images/profile-woman-sitting.webp";

export async function Profile() {
  const t = await getTranslations("Landing.profile");

  return (
    <section
      id="profile"
      aria-labelledby="profile-title"
      className="bg-canvas font-ui section-y overflow-hidden"
    >
      <div className="page-x grid items-center gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
        <div className="relative">
          <h2
            id="profile-title"
            className="text-h2 text-text max-w-md font-extrabold"
          >
            {t("title")}
          </h2>
          <p className="text-subtle text-lead mt-5 max-w-md">{t("text")}</p>
          <ol
            aria-label={t("stepsLabel")}
            className="mt-10 flex max-w-sm flex-col gap-7"
          >
            <li>
              <StepItem
                index={t("step1")}
                title={t("step1Title")}
                text={t("step1Text")}
              />
            </li>
            <li>
              <StepItem
                index={t("step2")}
                title={t("step2Title")}
                text={t("step2Text")}
              />
            </li>
          </ol>
          {/* Qadamlardan "Yangi intervyu" kartasiga uzuq strelka (faqat keng ekranda). */}
          <DashedArrow className="absolute -right-24 bottom-2 hidden w-56 lg:block" />
        </div>

        <div className="relative mx-auto aspect-[5/6] w-full max-w-md sm:aspect-[10/9] sm:max-w-lg lg:max-w-none">
          <ConcentricArcs
            className="absolute top-1/2 left-[56%] size-[100%] -translate-x-1/2 -translate-y-1/2"
            count={7}
          />
          <SoftBlob className="top-1/2 left-[56%] w-[70%] -translate-x-1/2 -translate-y-1/2" />
          <Spiral className="absolute top-[6%] left-[4%] h-14 w-28" />
          <div
            aria-hidden
            className="bg-primary absolute top-[18%] left-[56%] aspect-square w-[62%] -translate-x-1/2 rounded-full"
          />
          <div className="absolute bottom-[4%] left-[56%] aspect-[4/5] w-[62%] -translate-x-1/2">
            {PROFILE_IMAGE ? (
              <Image
                src={PROFILE_IMAGE}
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 1024px) 400px, 70vw"
                className="object-contain object-bottom"
              />
            ) : (
              <FigurePlaceholder label={t("imageAlt")} pose="sitting" />
            )}
          </div>

          <ProfileCard
            float
            avatar={{
              initials: "IF",
              tone: "violet",
              src: "/images/avatar-woman-blazer.webp",
            }}
            name={t("profileName")}
            role={t("profileRole")}
            actionLabel={t("profileAction")}
            actionHref="/register"
            className="absolute top-[2%] right-0 origin-top-right max-sm:scale-[0.85]"
          />
          <NotificationCard
            float
            title={t("notifyTitle")}
            text={t("notifyText")}
            className="absolute bottom-[4%] left-0 origin-bottom-left max-sm:scale-[0.9]"
          />
        </div>
      </div>
    </section>
  );
}
