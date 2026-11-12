import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { AvatarProps } from "@/frontend/components/ds/avatar";
import { ButtonLink } from "@/frontend/components/ds/button";
import {
  Chevrons,
  Dot,
  HalfCircle,
  Square,
  SquiggleArrow,
  Triangle,
} from "@/frontend/components/ds/decor";
import { StatSquareCard } from "@/frontend/components/ds/floating-card";
import { FigurePlaceholder } from "./figure-placeholder";

/** Hero rasmi: `public/images/` dagi kesilgan (shaffof fonli) rasm. `null` boʻlsa siluet chiziladi. */
const HERO_IMAGE: string | null = "/images/hero-woman-laptop.webp";

// TODO: real maʼlumot — faol foydalanuvchilar soni.
const PEOPLE: Omit<AvatarProps, "size" | "className">[] = [
  { initials: "AK", tone: "teal", src: "/images/avatar-young-man.webp" },
  { initials: "DM", tone: "sun", src: "/images/avatar-woman-blazer.webp" },
  { initials: "SR", tone: "primary", src: "/images/avatar-older-woman.webp" },
];

export async function Hero() {
  const t = await getTranslations("Landing.hero");

  return (
    <section
      aria-labelledby="hero-title"
      // Header (h-16 / lg:h-20) ostiga kiradi: diagonal shakl sahifaning eng tepasidan boshlanadi.
      className="bg-canvas font-ui relative isolate -mt-16 overflow-hidden pt-16 lg:-mt-20 lg:pt-20"
    >
      {/* Diagonal apelsin tasma: oʻng yuqori burchakdan pastga. */}
      <div
        aria-hidden
        className="from-primary/85 via-primary/45 pointer-events-none absolute -top-[12%] -right-[38%] -z-10 h-[150%] w-[72%] rotate-[35deg] rounded-[4rem] bg-gradient-to-b to-transparent sm:-right-[30%] lg:-right-[14%] lg:w-[46%]"
      />

      {/* Tasma pastda sahifa foniga silliq oʻtadi (keyingi boʻlim bilan keskin chegara boʻlmasin). */}
      <div
        aria-hidden
        className="from-canvas pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t to-transparent"
      />

      <div className="page-x grid items-center gap-x-10 gap-y-12 pt-8 pb-16 sm:pt-12 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[auto_auto] lg:pt-14 lg:pb-24">
        {/* Matn */}
        <div className="lg:self-end">
          <h1
            id="hero-title"
            className="text-display text-text max-w-[15ch] font-extrabold text-balance"
          >
            {t("title")}
          </h1>
          {/* Matn uzunroq boʻlgani uchun avval tavsif, keyin tugma. */}
          <div className="mt-6 flex flex-col items-start gap-7">
            <p className="text-subtle text-lead max-w-md">{t("text")}</p>
            <ButtonLink href="/register" size="lg" arrow>
              {t("cta")}
            </ButtonLink>
          </div>
        </div>

        {/* Rasm kompozitsiyasi */}
        <div className="relative mx-auto aspect-[10/11] w-full max-w-md sm:max-w-lg lg:col-start-2 lg:row-span-2 lg:max-w-none">
          <Square className="ds-drift-a absolute top-[6%] left-[4%] size-11 sm:size-14" />
          <Dot className="ds-drift-b absolute top-[52%] -left-[1%]" />
          <Chevrons className="ds-drift-b ds-drift-delay absolute top-[58%] -right-[1%] hidden sm:block" />
          <Triangle className="ds-drift-c absolute right-[2%] bottom-[3%] size-12 sm:size-16" />
          <Dot className="text-violet ds-drift-a ds-drift-delay absolute bottom-[-2%] left-[48%]" />

          {/* Katta gradient doira */}
          <div
            aria-hidden
            className="from-primary via-primary/80 to-glow ring-canvas/70 absolute bottom-[8%] left-1/2 aspect-square w-[84%] -translate-x-1/2 rounded-full bg-gradient-to-bl ring-[10px]"
          />
          <HalfCircle className="ds-drift-c ds-drift-delay absolute bottom-[22%] left-[2%] h-24 w-12 sm:h-32 sm:w-16" />

          {/* Rasm: pasti doira boʻyicha kesiladi, boshi doiradan chiqib turadi. */}
          <div className="absolute bottom-[8%] left-1/2 h-[105%] w-[84%] -translate-x-1/2 overflow-hidden [border-bottom-right-radius:50%_40%] [border-bottom-left-radius:50%_40%]">
            <div className="absolute bottom-0 left-1/2 aspect-[4/5] w-full -translate-x-1/2">
              {HERO_IMAGE ? (
                <Image
                  src={HERO_IMAGE}
                  alt={t("imageAlt")}
                  fill
                  priority
                  sizes="(min-width: 1024px) 480px, 80vw"
                  className="object-contain object-bottom"
                />
              ) : (
                <FigurePlaceholder label={t("imageAlt")} />
              )}
            </div>
          </div>
        </div>

        {/* Faol foydalanuvchilar */}
        <div className="relative lg:col-start-1 lg:row-start-2 lg:self-start">
          <StatSquareCard
            value={t("statValue")}
            title={t("statTitle")}
            text={t("statText")}
            people={PEOPLE}
            peopleLabel={t("peopleLabel")}
            className="pl-5"
          />
          <SquiggleArrow className="absolute -bottom-12 left-[40%] hidden xl:block" />
        </div>
      </div>
    </section>
  );
}
