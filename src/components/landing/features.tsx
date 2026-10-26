import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Avatar, type AvatarProps } from "@/components/ds/avatar";
import { ButtonLink } from "@/components/ds/button";
import { cn } from "@/components/ds/cn";
import { DotGrid } from "@/components/ds/decor";
import { CounterCard } from "@/components/ds/floating-card";

// Atrofda suzib yurgan avatar pufakchalari (PDF dagidek turli oʻlchamda). Bosh harflar, haqiqiy odamlar emas.
const BUBBLES: (Omit<AvatarProps, "className"> & { pos: string })[] = [
  {
    initials: "AK",
    tone: "cool",
    size: "lg",
    src: "/images/avatar-young-man.webp",
    pos: "top-[4%] left-[22%]",
  },
  {
    initials: "DM",
    tone: "teal",
    size: "xl",
    src: "/images/avatar-woman-blazer.webp",
    pos: "top-[0%] left-[62%]",
  },
  { initials: "NY", tone: "primary", size: "sm", pos: "top-[24%] left-[2%]" },
  { initials: "BT", tone: "violet", size: "sm", pos: "top-[56%] right-[2%]" },
  {
    initials: "SR",
    tone: "sun",
    size: "xl",
    src: "/images/avatar-older-woman.webp",
    pos: "bottom-[2%] left-[4%]",
  },
  { initials: "OR", tone: "night", size: "md", pos: "bottom-[8%] left-[52%]" },
];

export async function Features() {
  const t = await getTranslations("Landing.features");

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="bg-canvas font-ui section-y"
    >
      <div className="page-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Kompozitsiya: nuqtali xarita naqshi, avatarlar va +100 000 karta */}
        <div className="relative mx-auto aspect-[6/5] w-full max-w-lg lg:max-w-none">
          {/* Yorugʻ rejimda dunyo xaritasi (Oʻzbekiston belgilangan), tungida nuqtali naqsh: xarita oq fonli. */}
          <div className="theme-light-only absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_72%)]">
            <Image
              src="/images/world-map.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 560px, 90vw"
              className="object-contain mix-blend-multiply"
            />
          </div>
          <div className="theme-dark-only absolute inset-0">
            <DotGrid className="[mask-image:radial-gradient(closest-side,black_40%,transparent)]" />
          </div>
          <div aria-hidden>
            {BUBBLES.map(({ pos, ...avatar }) => (
              <span key={avatar.initials} className={cn("absolute", pos)}>
                <Avatar
                  {...avatar}
                  className={cn(
                    "ring-canvas shadow-soft ring-4",
                    avatar.size === "xl" && "max-sm:size-16",
                  )}
                />
              </span>
            ))}
          </div>
          {/* TODO: real maʼlumot — vakansiyalar soni bazadan. */}
          <CounterCard
            float
            value={t("counterValue")}
            label={t("counterLabel")}
            className="absolute top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 px-8 sm:px-12 sm:py-10"
          />
        </div>

        <div>
          <h2
            id="features-title"
            className="text-h2 text-text max-w-md font-extrabold"
          >
            {t("title")}
          </h2>
          <p className="text-subtle text-lead mt-5 max-w-lg">{t("text")}</p>
          <ButtonLink
            href="/register"
            variant="dark"
            size="lg"
            arrow
            className="mt-8"
          >
            {t("cta")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
