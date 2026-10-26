import type { ReactNode } from "react";
import { Avatar, AvatarGroup, type AvatarProps } from "./avatar";
import { buttonClass } from "./button";
import { CornerBracket, Ring } from "./decor";
import { BellIcon } from "./icons";
import { cn } from "./cn";
import { Link } from "@/i18n/navigation";

/**
 * Rasm ustida suzib turadigan karta asosi. `float` sekin tebranish beradi
 * (prefers-reduced-motion da oʻchadi). Joylashuvni chaqiruvchi beradi (absolute).
 */
export function FloatingCard({
  children,
  className,
  float = false,
  glass = false,
}: {
  children: ReactNode;
  className?: string;
  float?: boolean;
  /** Yarim shaffof fon (rasm ustida). */
  glass?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card shadow-float text-text",
        glass ? "bg-card/85 backdrop-blur-md" : "bg-card",
        float && "ds-float",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** "300k / Faol foydalanuvchilar": qora kvadrat + avatarlar + izoh (PDF hero chap pasti). */
export function StatSquareCard({
  value,
  title,
  text,
  people,
  peopleLabel,
  className,
}: {
  value: string;
  title: string;
  text: string;
  people: Omit<AvatarProps, "size" | "className">[];
  peopleLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-5", className)}>
      <div className="relative">
        <Ring className="absolute -top-5 -left-5 size-14" thickness={7} />
        <div className="bg-night text-on-night font-ui relative flex size-28 items-center justify-center text-3xl font-bold sm:size-32">
          {value}
        </div>
      </div>
      <div className="flex max-w-60 flex-col gap-2 pb-1">
        <AvatarGroup people={people} label={peopleLabel} size="md" />
        <p className="font-ui flex items-center gap-3 font-bold">
          {title}
          <span aria-hidden className="bg-primary h-0.5 w-8" />
        </p>
        <p className="text-subtle text-sm">{text}</p>
      </div>
    </div>
  );
}

/** "+100 000 / mavjud vakansiyalar" karta, burchaklarida qavslar. */
export function CounterCard({
  value,
  label,
  className,
  float,
}: {
  value: string;
  label: string;
  className?: string;
  float?: boolean;
}) {
  return (
    <FloatingCard
      float={float}
      className={cn("relative px-10 py-8 text-center", className)}
    >
      <CornerBracket
        corner="top-left"
        className="absolute -top-0.5 -left-0.5 size-7"
      />
      <CornerBracket
        corner="bottom-right"
        className="absolute -right-0.5 -bottom-0.5 size-7"
      />
      <p className="font-ui text-primary-text text-4xl font-extrabold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium">{label}</p>
    </FloatingCard>
  );
}

/** "Yangi intervyu" kabi bildirishnoma kartasi. */
export function NotificationCard({
  title,
  text,
  icon,
  className,
  float,
}: {
  title: string;
  text: string;
  icon?: ReactNode;
  className?: string;
  float?: boolean;
}) {
  return (
    <FloatingCard
      glass
      float={float}
      className={cn("flex max-w-72 items-center gap-4 px-5 py-4", className)}
    >
      <span className="bg-primary-soft text-primary-text inline-flex size-12 shrink-0 items-center justify-center rounded-full">
        {icon ?? <BellIcon size={22} />}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-ui font-bold">{title}</span>
        <span className="text-subtle text-sm leading-snug">{text}</span>
      </span>
    </FloatingCard>
  );
}

/** Profil kartasi: avatar, ism, kasb va pill tugma ("Ishga taklif qilish"). */
export function ProfileCard({
  avatar,
  name,
  role,
  actionLabel,
  actionHref,
  className,
  float,
}: {
  avatar: Omit<AvatarProps, "size" | "className">;
  name: string;
  role: string;
  actionLabel: string;
  actionHref?: string;
  className?: string;
  float?: boolean;
}) {
  const action = cn(
    buttonClass({ variant: "dark", size: "sm" }),
    "rounded-full px-5",
  );
  return (
    <FloatingCard
      float={float}
      className={cn(
        "flex w-44 flex-col items-center gap-1 px-5 py-6 text-center",
        className,
      )}
    >
      <Avatar {...avatar} size="xl" className="mb-2" />
      <p className="font-ui font-bold">{name}</p>
      <p className="text-subtle text-xs">{role}</p>
      {actionHref ? (
        <Link href={actionHref} className={cn(action, "mt-3")}>
          {actionLabel}
        </Link>
      ) : (
        <button type="button" className={cn(action, "mt-3")}>
          {actionLabel}
        </button>
      )}
    </FloatingCard>
  );
}
