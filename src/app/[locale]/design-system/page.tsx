import "@fontsource-variable/inter";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AvatarProps } from "@/components/ds/avatar";
import { Avatar, AvatarGroup } from "@/components/ds/avatar";
import { Badge } from "@/components/ds/badge";
import { Button, IconButton } from "@/components/ds/button";
import {
  Card,
  CategoryCard,
  StepItem,
  TestimonialCard,
} from "@/components/ds/card";
import { cn } from "@/components/ds/cn";
import {
  Chevrons,
  ConcentricArcs,
  CornerBracket,
  DashedArrow,
  Dot,
  DotGrid,
  HalfCircle,
  HeroBackdrop,
  Ring,
  SoftBlob,
  Spiral,
  Square,
  SquiggleArrow,
  Triangle,
} from "@/components/ds/decor";
import {
  CounterCard,
  NotificationCard,
  ProfileCard,
  StatSquareCard,
} from "@/components/ds/floating-card";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  CodeWindowIcon,
  FolderIcon,
  MegaphoneIcon,
  PaletteIcon,
  PenToolIcon,
  SearchIcon,
  SendIcon,
  SparkIcon,
} from "@/components/ds/icons";
import {
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  describedBy,
} from "@/components/ds/input";
import { Logo } from "@/components/ds/logo";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "DesignSystem",
  });
  // Ichki namuna sahifasi: qidiruv tizimlariga koʻrsatilmaydi.
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const SWATCHES = [
  { key: "primary", token: "--ds-primary", cls: "bg-primary" },
  { key: "primaryText", token: "--ds-primary-text", cls: "bg-primary-text" },
  { key: "primarySoft", token: "--ds-primary-soft", cls: "bg-primary-soft" },
  { key: "ink", token: "--ds-ink", cls: "bg-ink" },
  { key: "night", token: "--ds-night", cls: "bg-night" },
  { key: "bg", token: "--ds-bg", cls: "bg-canvas" },
  { key: "peach", token: "--ds-peach-bg", cls: "bg-peach" },
  { key: "surface", token: "--ds-surface", cls: "bg-card" },
  { key: "surfaceCool", token: "--ds-surface-cool", cls: "bg-card-cool" },
  { key: "textColor", token: "--ds-text", cls: "bg-text" },
  { key: "muted", token: "--ds-muted", cls: "bg-subtle" },
  { key: "line", token: "--ds-line", cls: "bg-line" },
  { key: "violet", token: "--ds-violet", cls: "bg-violet" },
  { key: "success", token: "--ds-success", cls: "bg-success" },
  { key: "warning", token: "--ds-warning", cls: "bg-warning" },
  { key: "danger", token: "--ds-danger", cls: "bg-danger" },
] as const;

// Yorugʻ / tungi qiymatlar (globals.css bilan bir xil). Namuna jadvali uchun.
const HEX: Record<(typeof SWATCHES)[number]["key"], [string, string]> = {
  primary: ["#FF7A3D", "#FF7A3D"],
  primaryText: ["#C24A12", "#FF7A3D"],
  primarySoft: ["#FFE8DA", "#3A2216"],
  ink: ["#14232A", "#F2F4F5"],
  night: ["#14232A", "#080B0D"],
  bg: ["#FFFFFF", "#0E1215"],
  peach: ["#FFF4EC", "#1C1612"],
  surface: ["#FFFFFF", "#171C20"],
  surfaceCool: ["#F4F6FA", "#1B2228"],
  textColor: ["#14232A", "#F2F4F5"],
  muted: ["#5F6B74", "#9AA5AD"],
  line: ["#EBE5DF", "#273038"],
  violet: ["#7C5CFF", "#8F74FF"],
  success: ["#15803D", "#6EE7A0"],
  warning: ["#A16207", "#FCD34D"],
  danger: ["#C2262B", "#FCA5A5"],
};

const SPACING = [1, 2, 3, 4, 6, 8, 12, 16, 20, 30] as const;

// TODO: real maʼlumot — vakansiyalar soni bazadan olinadi.
const CATEGORIES = [
  { key: "marketing", icon: <MegaphoneIcon size={22} />, count: 58 },
  { key: "design", icon: <PenToolIcon size={22} />, count: 120, active: true },
  { key: "pm", icon: <FolderIcon size={22} />, count: 87 },
  { key: "business", icon: <BriefcaseIcon size={22} />, count: 23 },
  { key: "graphic", icon: <PaletteIcon size={22} />, count: 65 },
  { key: "web", icon: <CodeWindowIcon size={22} />, count: 100 },
] as const;

// Bosh harflar namunasi: haqiqiy odamlar emas.
const PEOPLE: Omit<AvatarProps, "size" | "className">[] = [
  { initials: "AK", tone: "teal" },
  { initials: "DM", tone: "sun" },
  { initials: "SR", tone: "primary" },
  { initials: "NY", tone: "violet" },
  { initials: "BT", tone: "cool" },
];

const CITIES = [
  "tashkent",
  "samarkand",
  "bukhara",
  "andijan",
  "namangan",
  "fergana",
] as const;

function Section({
  id,
  title,
  text,
  tone = "canvas",
  children,
}: {
  id: string;
  title: string;
  text?: string;
  tone?: "canvas" | "peach";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "py-16 sm:py-20",
        tone === "peach" ? "bg-peach" : "bg-canvas",
      )}
    >
      <div className="page-x">
        <header className="mb-10 max-w-2xl">
          <h2 id={`${id}-title`} className="text-h2 font-extrabold">
            {title}
          </h2>
          {text ? <p className="text-subtle text-lead mt-3">{text}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-h3 mt-12 mb-5 font-bold first:mt-0">{children}</h3>
  );
}

function DecorTile({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <figure className="rounded-card bg-card shadow-soft flex flex-col items-center gap-4 p-5">
      <div className="relative flex h-28 w-full items-center justify-center overflow-hidden">
        {children}
      </div>
      <figcaption className="text-subtle text-caption text-center font-medium">
        {label}
      </figcaption>
    </figure>
  );
}

export default async function DesignSystemPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("DesignSystem");

  const sections = [
    ["logo", t("logo.title")],
    ["colors", t("colors.title")],
    ["type", t("type.title")],
    ["shape", t("shape.title")],
    ["buttons", t("buttons.title")],
    ["inputs", t("inputs.title")],
    ["badges", t("badges.title")],
    ["cards", t("cards.title")],
    ["floating", t("floating.title")],
    ["decor", t("decor.title")],
    ["themes", t("themes.title")],
  ] as const;

  const themePreview = (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        <Button arrow>{t("buttons.primary")}</Button>
        <Button variant="dark">{t("buttons.dark")}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="primary" dot>
          {t("badges.primary")}
        </Badge>
        <Badge tone="success">{t("badges.success")}</Badge>
        <Badge tone="violet" dot>
          {t("badges.violet")}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CategoryCard
          icon={<MegaphoneIcon size={22} />}
          title={t("categories.marketing")}
          meta={t("categories.count", { count: 58 })}
        />
        <CategoryCard
          active
          icon={<PenToolIcon size={22} />}
          title={t("categories.design")}
          meta={t("categories.count", { count: 120 })}
        />
      </div>
      <NotificationCard
        title={t("floating.notifyTitle")}
        text={t("floating.notifyText")}
      />
    </div>
  );

  return (
    <div className="bg-canvas text-text font-ui">
      {/* Kirish */}
      <div className="bg-peach relative overflow-hidden">
        <Square className="absolute top-10 right-[12%] size-12" />
        <Ring className="absolute right-[4%] bottom-8 size-12" thickness={6} />
        <Dot className="absolute top-1/2 right-[30%]" />
        <div className="page-x relative py-16 sm:py-24">
          <p className="text-primary-text text-sm font-bold tracking-wide uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-display mt-3 max-w-3xl font-extrabold">
            {t("title")}
          </h1>
          <p className="text-subtle text-lead mt-5 max-w-2xl">{t("lead")}</p>
          <nav aria-label={t("nav")} className="mt-8 flex flex-wrap gap-2">
            {sections.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="border-line bg-card hover:border-ink focus-visible:outline-ink rounded-full border px-3.5 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <Section id="logo" title={t("logo.title")} text={t("logo.text")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex items-center justify-center py-12">
            <Logo
              name={t("logo.name")}
              tag={t("logo.tag")}
              className="scale-150"
            />
          </Card>
          <Card tone="night" className="flex items-center justify-center py-12">
            <Logo
              name={t("logo.name")}
              tag={t("logo.tag")}
              tone="night"
              className="scale-150"
            />
          </Card>
        </div>
      </Section>

      <Section
        id="colors"
        title={t("colors.title")}
        text={t("colors.text")}
        tone="peach"
      >
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SWATCHES.map((s) => (
            <li
              key={s.key}
              className="rounded-card bg-card shadow-soft overflow-hidden"
            >
              <div className={cn("border-line h-20 border-b", s.cls)} />
              <div className="flex flex-col gap-0.5 p-4">
                <span className="text-sm font-bold">
                  {t(`colors.${s.key}`)}
                </span>
                <code className="text-subtle text-xs">{s.token}</code>
                <span className="text-subtle text-xs tabular-nums">
                  {HEX[s.key][0]} · {HEX[s.key][1]}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <Card className="mt-8">
          <h3 className="text-h3 font-bold">{t("colors.contrastTitle")}</h3>
          <ul className="text-subtle mt-3 flex list-disc flex-col gap-1.5 pl-5">
            <li>{t("colors.contrast1")}</li>
            <li>{t("colors.contrast2")}</li>
            <li>{t("colors.contrast3")}</li>
          </ul>
        </Card>
      </Section>

      <Section id="type" title={t("type.title")} text={t("type.text")}>
        <div className="flex flex-col gap-6">
          {(
            [
              [
                "display",
                "text-display font-extrabold",
                "Display · 72/1.05 · 800",
              ],
              ["h1", "text-h1 font-extrabold", "H1 · 52/1.1 · 800"],
              ["h2", "text-h2 font-extrabold", "H2 · 44/1.15 · 800"],
              ["h3", "text-h3 font-bold", "H3 · 20/1.3 · 700"],
              ["lead", "text-lead text-subtle", "Lead · 18/1.65 · 400"],
              ["body", "text-body", "Body · 16/1.6 · 400"],
              [
                "caption",
                "text-caption text-subtle",
                "Caption · 13/1.45 · 400",
              ],
            ] as const
          ).map(([key, cls, spec]) => (
            <div
              key={key}
              className="border-line grid gap-2 border-b pb-6 md:grid-cols-[12rem_1fr] md:gap-8"
            >
              <code className="text-subtle pt-2 text-xs">{spec}</code>
              <p className={cls}>{t(`type.${key}`)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="shape"
        title={t("shape.title")}
        text={t("shape.text")}
        tone="peach"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(
            [
              ["radiusBtn", "rounded-btn"],
              ["radiusField", "rounded-field"],
              ["radiusCard", "rounded-card"],
              ["radiusPanel", "rounded-panel"],
              ["radiusFull", "rounded-full"],
            ] as const
          ).map(([key, cls]) => (
            <div key={key} className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  "bg-card border-primary aspect-square w-full max-w-28 border-2",
                  cls,
                )}
              />
              <span className="text-caption text-center font-medium">
                {t(`shape.${key}`)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {(
            [
              ["shadowSoft", "shadow-soft bg-card"],
              ["shadowFloat", "shadow-float bg-card"],
              ["shadowPrimary", "shadow-primary bg-primary text-on-primary"],
            ] as const
          ).map(([key, cls]) => (
            <div
              key={key}
              className={cn(
                "rounded-card flex h-28 items-center justify-center text-sm font-semibold",
                cls,
              )}
            >
              {t(`shape.${key}`)}
            </div>
          ))}
        </div>
        <SubTitle>{t("shape.spacing")}</SubTitle>
        <div className="flex flex-wrap items-end gap-4">
          {SPACING.map((n) => (
            <div key={n} className="flex flex-col items-center gap-2">
              <div
                className="bg-primary rounded-[2px]"
                style={{ width: n * 4, height: n * 4 }}
              />
              <code className="text-subtle text-xs">{n * 4}</code>
            </div>
          ))}
        </div>
        <p className="text-subtle mt-6 text-sm">{t("shape.section")}</p>
      </Section>

      <Section id="buttons" title={t("buttons.title")} text={t("buttons.text")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button arrow>{t("buttons.primary")}</Button>
          <Button variant="dark" arrow>
            {t("buttons.dark")}
          </Button>
          <Button variant="outline">{t("buttons.outline")}</Button>
          <Button variant="ghost">{t("buttons.ghost")}</Button>
          <Button variant="soft">{t("buttons.soft")}</Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="sm">{t("buttons.small")}</Button>
          <Button size="md">{t("buttons.medium")}</Button>
          <Button size="lg">{t("buttons.large")}</Button>
          <Button loading>{t("buttons.loading")}</Button>
          <Button disabled variant="dark">
            {t("buttons.disabled")}
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <IconButton label={t("buttons.prev")} tone="surface">
            <ArrowLeftIcon size={22} />
          </IconButton>
          <IconButton label={t("buttons.next")} tone="primary">
            <ArrowRightIcon size={22} />
          </IconButton>
          <IconButton label={t("buttons.next")} tone="dark" size="sm">
            <ArrowRightIcon size={18} />
          </IconButton>
          <Button variant="outline">
            <SendIcon size={18} />
            {t("buttons.telegram")}
          </Button>
        </div>
      </Section>

      <Section
        id="inputs"
        title={t("inputs.title")}
        text={t("inputs.text")}
        tone="peach"
      >
        <Card padding="lg" className="grid gap-6 md:grid-cols-2">
          <Field id="ds-search" label={t("inputs.searchLabel")}>
            <Input
              id="ds-search"
              type="search"
              icon={<SearchIcon size={18} />}
              placeholder={t("inputs.searchPlaceholder")}
            />
          </Field>
          <Field id="ds-city" label={t("inputs.cityLabel")}>
            <Select id="ds-city" defaultValue="tashkent">
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {t(`cities.${c}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id="ds-phone"
            label={t("inputs.phoneLabel")}
            hint={t("inputs.phoneHint")}
          >
            <Input
              {...describedBy("ds-phone", { hint: t("inputs.phoneHint") })}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("inputs.phonePlaceholder")}
            />
          </Field>
          <Field
            id="ds-email"
            label={t("inputs.emailLabel")}
            error={t("inputs.emailError")}
          >
            <Input
              {...describedBy("ds-email", { error: t("inputs.emailError") })}
              invalid
              type="email"
              defaultValue="gulgina.erejepova@"
            />
          </Field>
          <Field id="ds-salary" label={t("inputs.salaryLabel")}>
            <Input
              id="ds-salary"
              inputMode="numeric"
              placeholder={t("inputs.salaryPlaceholder")}
            />
          </Field>
          <fieldset className="flex flex-col justify-end gap-3 pb-1">
            <Checkbox label={t("inputs.remote")} defaultChecked />
            <Checkbox label={t("inputs.fullTime")} />
          </fieldset>
          <Field
            id="ds-about"
            label={t("inputs.aboutLabel")}
            className="md:col-span-2"
          >
            <Textarea
              id="ds-about"
              placeholder={t("inputs.aboutPlaceholder")}
            />
          </Field>
        </Card>
      </Section>

      <Section id="badges" title={t("badges.title")}>
        <div className="flex flex-wrap gap-2.5">
          <Badge>{t("badges.neutral")}</Badge>
          <Badge tone="primary" dot>
            {t("badges.primary")}
          </Badge>
          <Badge tone="success" dot>
            {t("badges.success")}
          </Badge>
          <Badge tone="warning" dot>
            {t("badges.warning")}
          </Badge>
          <Badge tone="danger" dot>
            {t("badges.danger")}
          </Badge>
          <Badge tone="violet" icon={<SparkIcon size={14} />}>
            {t("badges.violet")}
          </Badge>
          <Badge tone="dark">{t("badges.dark")}</Badge>
        </div>
        <SubTitle>{t("avatars.title")}</SubTitle>
        <p className="text-subtle -mt-3 mb-5 text-sm">{t("avatars.text")}</p>
        <div className="flex flex-wrap items-center gap-6">
          <Avatar initials="AK" tone="teal" size="sm" />
          <Avatar initials="DM" tone="sun" size="md" />
          <Avatar initials="SR" tone="primary" size="lg" />
          <Avatar initials="NY" tone="violet" size="xl" />
          <AvatarGroup people={PEOPLE} label={t("avatars.groupLabel")} />
          <AvatarGroup
            people={PEOPLE}
            label={t("avatars.groupLabel")}
            max={4}
            moreLabel={t("avatars.more")}
            size="lg"
          />
        </div>
      </Section>

      <Section
        id="cards"
        title={t("cards.title")}
        text={t("cards.text")}
        tone="peach"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(["surface", "peach", "cool", "primary", "night"] as const).map(
            (tone) => (
              <Card
                key={tone}
                tone={tone}
                className={tone === "peach" ? "ring-line ring-1" : undefined}
              >
                <p className="font-bold">
                  {t(`cards.${tone === "primary" ? "primaryCard" : tone}`)}
                </p>
                <p className="mt-1 text-sm opacity-80">{t("cards.cardText")}</p>
              </Card>
            ),
          )}
        </div>

        <SubTitle>{t("cards.categoriesTitle")}</SubTitle>
        <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {CATEGORIES.map((c) => (
            <li key={c.key}>
              <CategoryCard
                icon={c.icon}
                title={t(`categories.${c.key}`)}
                meta={t("categories.count", { count: c.count })}
                active={"active" in c && c.active}
              />
            </li>
          ))}
        </ul>

        <SubTitle>{t("cards.testimonialsTitle")}</SubTitle>
        {/* TODO: real maʼlumot — haqiqiy fikrlar va ruxsat bilan ismlar. */}
        <div className="grid gap-5 md:grid-cols-2">
          <TestimonialCard
            active
            initials="IF"
            name={t("testimonial.name1")}
            role={t("testimonial.role1")}
            quote={t("testimonial.quote")}
          />
          <TestimonialCard
            initials="IF"
            name={t("testimonial.name2")}
            role={t("testimonial.role2")}
            quote={t("testimonial.quote")}
          />
        </div>

        <SubTitle>{t("cards.stepsTitle")}</SubTitle>
        <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
          <StepItem
            index={t("steps.one")}
            title={t("steps.oneTitle")}
            text={t("steps.oneText")}
          />
          <StepItem
            index={t("steps.two")}
            title={t("steps.twoTitle")}
            text={t("steps.twoText")}
          />
        </div>
      </Section>

      <Section
        id="floating"
        title={t("floating.title")}
        text={t("floating.text")}
      >
        {/* TODO: real maʼlumot — statistika raqamlari namuna. */}
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-12">
            <StatSquareCard
              value={t("floating.statValue")}
              title={t("floating.statTitle")}
              text={t("floating.statText")}
              people={PEOPLE}
              peopleLabel={t("avatars.groupLabel")}
              className="pl-5"
            />
            <div className="relative w-fit">
              <DotGrid className="-inset-10 [mask-image:radial-gradient(closest-side,black,transparent)]" />
              <CounterCard
                value={t("floating.counterValue")}
                label={t("floating.counterLabel")}
                className="relative"
              />
            </div>
          </div>
          <div className="rounded-panel bg-peach relative isolate flex min-h-[26rem] items-center justify-center overflow-hidden p-6">
            <ConcentricArcs className="absolute -right-10 -bottom-16 size-80" />
            <SoftBlob className="top-1/2 left-1/2 w-72 -translate-x-1/2 -translate-y-1/2" />
            <div className="bg-primary absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <Spiral className="absolute top-8 left-8" />
            <ProfileCard
              float
              avatar={{ initials: "IF", tone: "violet" }}
              name={t("floating.profileName")}
              role={t("floating.profileRole")}
              actionLabel={t("floating.profileAction")}
              className="absolute top-6 right-6"
            />
            <NotificationCard
              float
              title={t("floating.notifyTitle")}
              text={t("floating.notifyText")}
              icon={<CalendarIcon size={22} />}
              className="absolute bottom-6 left-6"
            />
          </div>
        </div>
      </Section>

      <Section
        id="decor"
        title={t("decor.title")}
        text={t("decor.text")}
        tone="peach"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DecorTile label={t("decor.ring")}>
            <Ring />
          </DecorTile>
          <DecorTile label={t("decor.square")}>
            <Square className="size-14" />
          </DecorTile>
          <DecorTile label={t("decor.triangle")}>
            <Triangle />
          </DecorTile>
          <DecorTile label={t("decor.half")}>
            <HalfCircle />
          </DecorTile>
          <DecorTile label={t("decor.dot")}>
            <div className="flex gap-3">
              <Dot />
              <Dot className="text-violet" />
              <Dot className="text-ink" />
            </div>
          </DecorTile>
          <DecorTile label={t("decor.squiggle")}>
            <SquiggleArrow />
          </DecorTile>
          <DecorTile label={t("decor.spiral")}>
            <Spiral />
          </DecorTile>
          <DecorTile label={t("decor.dashed")}>
            <DashedArrow />
          </DecorTile>
          <DecorTile label={t("decor.arcs")}>
            <ConcentricArcs className="size-28" />
          </DecorTile>
          <DecorTile label={t("decor.bracket")}>
            <div className="flex gap-4">
              <CornerBracket corner="top-left" />
              <CornerBracket corner="bottom-right" />
            </div>
          </DecorTile>
          <DecorTile label={t("decor.chevrons")}>
            <Chevrons />
          </DecorTile>
          <DecorTile label={t("decor.dots")}>
            <DotGrid />
          </DecorTile>
        </div>
        <SubTitle>{t("decor.hero")}</SubTitle>
        <div className="rounded-panel bg-canvas relative isolate aspect-[16/10] overflow-hidden sm:aspect-[21/9]">
          <HeroBackdrop className="left-1/3" />
          <Square className="absolute top-[12%] left-[38%] size-12" />
          <HalfCircle className="absolute top-[45%] left-[40%] h-20 w-10" />
          <Triangle className="absolute right-[10%] bottom-[8%] size-12" />
          <Chevrons className="absolute top-1/2 right-[3%] -translate-y-1/2" />
          <Dot className="text-violet absolute bottom-[15%] left-[55%]" />
          <SquiggleArrow className="absolute bottom-[10%] left-[8%]" />
        </div>
      </Section>

      <Section id="themes" title={t("themes.title")} text={t("themes.text")}>
        <div className="grid gap-5 lg:grid-cols-2">
          {(["light", "dark"] as const).map((mode) => (
            <div
              key={mode}
              data-theme={mode}
              className="rounded-panel bg-peach border-line border p-6 sm:p-8"
            >
              <p className="text-subtle mb-5 text-sm font-bold tracking-wide uppercase">
                {t(`themes.${mode}`)}
              </p>
              {themePreview}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
