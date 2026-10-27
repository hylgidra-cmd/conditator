import { getTranslations } from "next-intl/server";
import { type Testimonial, TestimonialCarousel } from "./testimonial-carousel";

// TODO: real maʼlumot — hozircha namuna ism va fikrlar (jumis-ai-fikrlar.md). Ommaga ochishdan oldin
// haqiqiy foydalanuvchilar fikri bilan, ism va rasm ularning ruxsati bilan almashtiriladi.
const ITEMS = [
  { key: "1", initials: "SY", avatarSrc: "/images/avatar-young-man.webp" },
  { key: "2", initials: "DR", avatarSrc: "/images/avatar-woman-blazer.webp" },
  { key: "3", initials: "GH", avatarSrc: "/images/avatar-older-woman.webp" },
  {
    key: "4",
    initials: "NY",
    avatarSrc: "/images/avatar-woman-black-blazer.webp",
  },
  {
    key: "5",
    initials: "BT",
    avatarSrc: "/images/avatar-man-beige-blazer.webp",
  },
] as const;

export async function Testimonials() {
  const t = await getTranslations("Landing.testimonials");

  const items: Testimonial[] = ITEMS.map(({ key, ...rest }) => ({
    ...rest,
    name: t(`name${key}`),
    role: t(`role${key}`),
    quote: t(`quote${key}`),
  }));

  return (
    <section
      id="community"
      aria-labelledby="testimonials-title"
      className="bg-peach font-ui section-y overflow-hidden"
    >
      <TestimonialCarousel
        items={items}
        labels={{
          region: t("region"),
          prev: t("prev"),
          next: t("next"),
          // Shablon xom holda: {index} va {total} ni karusel oʻzi toʻldiradi.
          slide: t.raw("slide") as string,
        }}
        title={
          <div>
            <h2
              id="testimonials-title"
              className="text-h2 text-text max-w-xl font-extrabold lg:max-w-3xl"
            >
              {t("title")}
            </h2>
            <p className="text-subtle mt-3">{t("text")}</p>
          </div>
        }
      />
    </section>
  );
}
