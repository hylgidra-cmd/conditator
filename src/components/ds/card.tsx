import type { HTMLAttributes, ReactNode } from "react";
import { Avatar } from "./avatar";
import { FOCUS_RING, cn } from "./cn";

export type CardTone = "surface" | "peach" | "cool" | "primary" | "night";

const TONES: Record<CardTone, string> = {
  surface: "bg-card text-text shadow-soft",
  peach: "bg-peach text-text",
  cool: "bg-card-cool text-text",
  primary: "bg-primary text-on-primary shadow-primary",
  night: "bg-night text-on-night",
};

/** Asosiy karta: katta yumaloq burchak (24px), yumshoq soya. */
export function Card({
  tone = "surface",
  padding = "md",
  className,
  children,
  ...rest
}: {
  tone?: CardTone;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card",
        TONES[tone],
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Yoʻnalish kartasi: ikon, nom, vakansiyalar soni. Faol karta toʻliq apelsin.
 * Havola boʻlishi uchun `as="a"` emas, tashqaridan <Link> bilan oʻraladi.
 */
export function CategoryCard({
  icon,
  title,
  meta,
  active = false,
  className,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-card flex h-full flex-col gap-6 p-6 transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1",
        active
          ? "bg-primary text-on-primary shadow-primary"
          : "bg-card text-text shadow-soft hover:shadow-float",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-xl",
          active ? "bg-on-primary/10" : "bg-primary-soft text-primary-text",
        )}
      >
        {icon}
      </span>
      <span className="mt-auto flex flex-col gap-1.5">
        <span className="font-ui text-h3 font-bold">{title}</span>
        <span
          className={cn(
            "text-caption",
            active ? "text-on-primary/80" : "text-subtle",
          )}
        >
          {meta}
        </span>
      </span>
    </div>
  );
}

/** Fikr kartasi (karusel uchun). Faol karta apelsin, qolganlari sovuq kulrang. */
export function TestimonialCard({
  name,
  role,
  quote,
  initials,
  active = false,
  className,
}: {
  name: string;
  role: string;
  quote: string;
  initials: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "rounded-card flex h-full flex-col gap-5 p-7 transition-colors duration-200",
        active ? "bg-primary text-on-primary" : "bg-card-cool text-text",
        className,
      )}
    >
      <figcaption className="flex items-center gap-4">
        <Avatar
          initials={initials}
          size="lg"
          tone={active ? "night" : "violet"}
        />
        <span className="flex flex-col">
          <span className="font-ui text-lg font-bold">{name}</span>
          <span
            className={cn(
              "text-sm font-medium",
              active ? "text-on-primary/80" : "text-subtle",
            )}
          >
            {role}
          </span>
        </span>
      </figcaption>
      <blockquote className="text-[0.9375rem] leading-relaxed italic">
        {quote}
      </blockquote>
    </figure>
  );
}

/** Raqamlangan qadam (masalan, "01. CV yuklash"). */
export function StepItem({
  index,
  title,
  text,
  className,
}: {
  index: string;
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4", className)}>
      <span className="font-ui text-primary-text text-lg font-extrabold tabular-nums">
        {index}
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-ui font-bold">{title}</span>
        <span className="text-subtle text-sm">{text}</span>
      </span>
    </div>
  );
}

/** Butun karta bosiladigan boʻlsa, shu sinf havolaga qoʻyiladi. */
export const CARD_LINK = cn("rounded-card block", FOCUS_RING);
