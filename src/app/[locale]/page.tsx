import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Categories } from "@/components/landing/categories";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Partners } from "@/components/landing/partners";
import { Profile } from "@/components/landing/profile";
import { Testimonials } from "@/components/landing/testimonials";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

/** Bosh sahifa (Jobly uslubi, PDF tartibida). Footer umumiy layoutda. */
export default function HomePage({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Partners />
      <Features />
      <Categories />
      <Profile />
      <Testimonials />
    </>
  );
}
