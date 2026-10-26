import Image from "next/image";
import { getTranslations } from "next-intl/server";

// TODO: real maʼlumot — hamkorlik shartnomasi boʻlgan kompaniyalar logotiplari (ruxsat bilan).
const SLOTS = [1, 2, 3, 4, 5] as const;

/** Neytral logo oʻrni: haqiqiy brend logotiplari ishlatilmaydi. */
function LogoSlot({ label }: { label: string }) {
  return (
    <li className="text-subtle flex items-center gap-2.5">
      <svg aria-hidden viewBox="0 0 24 24" className="size-7 shrink-0">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="6"
          className="fill-current opacity-25"
        />
        <circle cx="12" cy="12" r="4" className="fill-current opacity-60" />
      </svg>
      <span className="font-ui text-lg font-bold tracking-tight">{label}</span>
    </li>
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
        <div className="bg-peach rounded-card relative isolate overflow-hidden px-6 py-12 text-center sm:px-10 sm:py-14 md:text-left">
          {/* Oʻng tomonda apelsin doira va shakllar (faqat yorugʻ rejim, md dan katta ekranda). */}
          <div className="theme-light-only absolute inset-0 -z-10 max-md:!hidden">
            <Image
              src="/images/orange-shapes.webp"
              alt=""
              fill
              sizes="1152px"
              className="object-cover object-right"
            />
          </div>
          <h2
            id="partners-title"
            className="font-ui text-text mx-auto max-w-2xl text-xl font-extrabold tracking-tight text-balance sm:text-2xl md:mx-0 md:max-w-[34rem]"
          >
            {t.rich("title", {
              accent: (chunks) => (
                <span className="text-primary-text">{chunks}</span>
              ),
            })}
          </h2>
          <ul
            aria-label={t("listLabel")}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14 md:max-w-[62%] md:justify-start md:gap-x-10"
          >
            {SLOTS.map((n) => (
              <LogoSlot key={n} label={t("placeholder", { n })} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
