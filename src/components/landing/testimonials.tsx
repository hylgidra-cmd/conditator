import { getTranslations } from "next-intl/server";
import { type Testimonial, TestimonialCarousel } from "./testimonial-carousel";

// TODO: real maʼlumot — haqiqiy foydalanuvchilar fikrlari, ism va rasm ularning ruxsati bilan.
const ITEMS = [
  { key: "1", initials: "AK", avatarSrc: "/images/avatar-young-man.webp" },
  { key: "2", initials: "DM", avatarSrc: "/images/avatar-woman-blazer.webp" },
  { key: "3", initials: "SR", avatarSrc: "/images/avatar-older-woman.webp" },
  { key: "4", initials: "NY" },
  { key: "5", initials: "BT" },
] as const;

export async function Testimonials() {
  const t = await getTranslations("Landing.testimonials");

  const items: Testimonial[] = ITEMS.map(({ key, ...rest }) => ({
    ...rest,
    name: t("name"),
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
          slide: t("slide"),
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
