import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { AvatarProps } from "@/components/ds/avatar";
import { ButtonLink } from "@/components/ds/button";
import {
  Chevrons,
  Dot,
  HalfCircle,
  Square,
  SquiggleArrow,
  Triangle,
} from "@/components/ds/decor";
import { StatSquareCard } from "@/components/ds/floating-card";

/**
 * Hero rasmi: `public/images/` dagi kesilgan (shaffof fonli) rasm, 4:5 nisbat.
 * TODO: Gemini rasmi tayyor boʻlgach shu yerga yoʻlini yozing, masalan "/images/hero.png".
 */
const HERO_IMAGE: string | null = null;

// TODO: real maʼlumot — faol foydalanuvchilar soni va avatarlar (hozircha bosh harflar).
const PEOPLE: Omit<AvatarProps, "size" | "className">[] = [
  { initials: "AK", tone: "teal" },
  { initials: "DM", tone: "sun" },
  { initials: "SR", tone: "primary" },
];

/** Rasm kelguncha neytral siluet (odam rasmi koʻchirilmaydi). Nisbat 4:5. */
function HeroPlaceholder({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 400 500"
      className="size-full"
      preserveAspectRatio="xMidYMax meet"
    >
      <g className="fill-white/55">
        <circle cx="200" cy="140" r="78" />
        <path d="M60 500c0-110 62-196 140-196s140 86 140 196Z" />
      </g>
      <rect
        x="92"
        y="352"
        width="216"
        height="128"
        rx="14"
        className="fill-white/70"
        transform="rotate(-8 200 416)"
      />
    </svg>
  );
}

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
            className="text-display text-text max-w-[12ch] font-extrabold text-balance"
          >
            {t("title")}
          </h1>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
            <ButtonLink href="/#companies" size="lg" arrow>
              {t("cta")}
            </ButtonLink>
            <p className="text-subtle max-w-64 text-[0.9375rem] leading-relaxed">
              {t("text")}
            </p>
          </div>
        </div>

        {/* Rasm kompozitsiyasi */}
        <div className="relative mx-auto aspect-[10/11] w-full max-w-md sm:max-w-lg lg:col-start-2 lg:row-span-2 lg:max-w-none">
          <Square className="absolute top-[6%] left-[4%] size-11 sm:size-14" />
          <Dot className="absolute top-[52%] -left-[1%]" />
          <Chevrons className="absolute top-[58%] -right-[1%] hidden sm:block" />
          <Triangle className="absolute right-[2%] bottom-[3%] size-12 sm:size-16" />
          <Dot className="text-violet absolute bottom-[-2%] left-[48%]" />

          {/* Katta gradient doira */}
          <div
            aria-hidden
            className="from-primary via-primary/80 to-glow ring-canvas/70 absolute bottom-[8%] left-1/2 aspect-square w-[84%] -translate-x-1/2 rounded-full bg-gradient-to-bl ring-[10px]"
          />
          <HalfCircle className="absolute bottom-[22%] left-[2%] h-24 w-12 sm:h-32 sm:w-16" />

          {/* Rasm: pasti doira boʻyicha kesiladi, boshi doiradan chiqib turadi. */}
          <div className="absolute bottom-[8%] left-1/2 h-[105%] w-[84%] -translate-x-1/2 overflow-hidden [border-bottom-right-radius:50%_40%] [border-bottom-left-radius:50%_40%]">
            <div className="absolute bottom-0 left-1/2 aspect-[4/5] w-[86%] -translate-x-1/2">
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
                <HeroPlaceholder label={t("imageAlt")} />
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
