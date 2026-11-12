import Image from "next/image";
import { getTranslations } from "next-intl/server";

type Partner = {
  name: string;
  logo: string;
  /** Logoning oʻz rangli foni bor: plitkani toʻliq egallaydi (ichki chetsiz). */
  bleed?: boolean;
};

// Logolar public/partners/ da: faqat IT Park va QMU (Karsu).
const PARTNERS: Partner[] = [
  { name: "IT Park", logo: "/partners/it-park.webp" },
  { name: "QMU (Karsu)", logo: "/partners/karsu.webp" },
];

/*
 * Toʻlqin yoʻli: davri 1440, kengligi 2880 (ikki davr). SVG 200% kenglikda chiziladi va
 * -50% ga siljiydi, shuning uchun toʻlqin uzilishsiz aylanadi.
 */
function wavePath(y: number, amp: number) {
  return `M0 ${y} Q360 ${y - amp} 720 ${y} T1440 ${y} T2160 ${y} T2880 ${y} V240 H0 Z`;
}

function PartnerItem({ partner }: { partner: Partner }) {
  return (
    <li className="bg-card/85 shadow-soft flex min-w-0 items-center gap-2.5 rounded-2xl p-2 pr-3 backdrop-blur-sm sm:gap-3 sm:p-2.5 sm:pr-4">
      {/* Plitka har ikkala rejimda oq: brend ranglari tungi fonda ham oʻzgarmay koʻrinadi. */}
      <span
        className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5 sm:size-11 ${
          partner.bleed ? "" : "p-1.5"
        }`}
      >
        {/* Nom yonida matn bilan yozilgan, shuning uchun logo ekran oʻquvchida takrorlanmaydi. */}
        <Image
          src={partner.logo}
          alt=""
          width={128}
          height={128}
          sizes="(min-width: 640px) 44px, 36px"
          className="size-full object-contain"
        />
      </span>
      <span className="font-ui text-text min-w-0 text-sm leading-tight font-bold tracking-tight break-words sm:text-[0.9375rem]">
        {partner.name}
      </span>
    </li>
  );
}

/** Fon: pastda uch qavat toʻlqin, oʻngda apelsin doira va suzuvchi shakllar. Ranglar mavzu tokenlaridan. */
function WaveBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <svg
        viewBox="0 0 2880 240"
        preserveAspectRatio="none"
        className="ds-wave ds-wave-slow absolute bottom-0 left-0 h-40 w-[200%] sm:h-48"
      >
        <path
          d={wavePath(70, 46)}
          className="fill-primary"
          fillOpacity={0.07}
        />
      </svg>
      <svg
        viewBox="0 0 2880 240"
        preserveAspectRatio="none"
        className="ds-wave ds-wave-reverse absolute bottom-0 left-0 h-32 w-[200%] sm:h-36"
      >
        <path
          d={wavePath(110, 38)}
          className="fill-primary"
          fillOpacity={0.1}
        />
      </svg>
      <svg
        viewBox="0 0 2880 240"
        preserveAspectRatio="none"
        className="ds-wave absolute bottom-0 left-0 h-20 w-[200%] sm:h-24"
      >
        <path
          d={wavePath(140, 30)}
          className="fill-primary"
          fillOpacity={0.18}
        />
      </svg>

      <svg
        viewBox="0 0 400 400"
        className="absolute top-1/2 -right-24 hidden size-[26rem] -translate-y-1/2 lg:-right-28 lg:block"
      >
        <defs>
          <radialGradient id="partners-sun" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0" stopColor="var(--ds-primary-hover)" />
            <stop offset="1" stopColor="var(--ds-primary)" />
          </radialGradient>
        </defs>
        <g className="ds-drift-b">
          <circle
            cx="250"
            cy="200"
            r="150"
            fill="url(#partners-sun)"
            opacity={0.9}
          />
          <circle
            cx="250"
            cy="200"
            r="176"
            fill="none"
            className="stroke-primary"
            strokeOpacity={0.25}
            strokeWidth="2"
            strokeDasharray="4 10"
          />
        </g>
        <circle
          cx="62"
          cy="300"
          r="24"
          fill="none"
          className="stroke-primary ds-drift-a"
          strokeWidth="9"
        />
        <rect
          x="74"
          y="26"
          width="30"
          height="30"
          rx="6"
          className="fill-violet ds-drift-c"
        />
        <circle
          cx="96"
          cy="128"
          r="8"
          className="fill-violet ds-drift-a ds-drift-delay"
        />
        <circle
          cx="40"
          cy="200"
          r="4"
          className="fill-primary ds-drift-c ds-drift-delay"
        />
        <circle
          cx="150"
          cy="370"
          r="5"
          className="fill-text ds-drift-b ds-drift-delay"
        />
      </svg>
    </div>
  );
}

export async function Partners() {
  const t = await getTranslations("Landing.partners");

  return (
    <section
      id="companies"
      aria-labelledby="partners-title"
      className="bg-canvas font-ui pb-4"
    >
      <div className="page-x">
        <div className="bg-peach rounded-card relative isolate overflow-hidden px-5 pt-12 pb-16 sm:px-10 sm:pt-14 sm:pb-20">
          <WaveBackdrop />
          <h2
            id="partners-title"
            className="font-ui text-text mx-auto max-w-2xl text-center text-xl font-extrabold tracking-tight text-balance sm:text-2xl md:mx-0 md:max-w-[34rem] md:text-left"
          >
            {t.rich("title", {
              accent: (chunks) => (
                <span className="text-primary-text">{chunks}</span>
              ),
            })}
          </h2>
          <ul
            aria-label={t("listLabel")}
            className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 lg:max-w-[78%] lg:grid-cols-4"
          >
            {PARTNERS.map((p) => (
              <PartnerItem key={p.name} partner={p} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
