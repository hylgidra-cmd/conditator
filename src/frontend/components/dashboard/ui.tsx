import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/frontend/components/ds/badge";
import { buttonClass } from "@/frontend/components/ds/button";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Link } from "@/i18n/navigation";
import type {
  CandidateAppStatus,
  EmployerAppStatus,
  VacancyStatus,
} from "@/backend/dashboard/mock";

/** Topbar dagi dumaloq tugmalar (bildirishnoma, rejim, menyu). */
export const ROUND_BUTTON =
  "bg-card text-text hover:bg-peach shadow-soft relative inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors";

/** Dashboard kartasi: landing kartalari bilan bir xil radius va soya, biroz ixchamroq. */
export const PANEL = "bg-card text-text shadow-soft rounded-panel";

export function PageHeader({
  title,
  lead,
  actions,
}: {
  title: string;
  lead?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-h2 font-extrabold">{title}</h1>
        {lead ? <p className="text-subtle mt-2">{lead}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({
  id,
  children,
  action,
}: {
  id?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-bold">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-primary-text rounded-btn inline-block py-1 text-sm font-semibold hover:underline",
        FOCUS_RING,
      )}
    >
      {children}
    </Link>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-panel flex h-full flex-col gap-3 p-4 sm:gap-4 sm:p-5",
        accent
          ? "bg-primary text-on-primary shadow-primary"
          : "bg-card text-text shadow-soft",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-sm font-medium",
            accent ? "text-on-primary" : "text-subtle",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "hidden size-10 shrink-0 items-center justify-center rounded-full sm:inline-flex",
            accent ? "bg-on-primary/10" : "bg-primary-soft text-primary-text",
          )}
        >
          {icon}
        </span>
      </div>
      <p className="text-[1.75rem] leading-none font-extrabold tracking-tight sm:text-[2rem]">
        {value}
      </p>
      <p
        className={cn(
          "text-xs font-medium",
          accent ? "text-on-primary" : "text-subtle",
        )}
      >
        {delta}
      </p>
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn("bg-card-cool h-2 overflow-hidden rounded-full", className)}
    >
      <div
        className="bg-primary h-full rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/** Moslik foizi: kichik chiziq + raqam. Rang faqat qoʻshimcha, raqam asosiy. */
export function MatchMeter({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="bg-card-cool h-1.5 w-12 overflow-hidden rounded-full"
      >
        <span
          className={cn(
            "block h-full rounded-full",
            value >= 80
              ? "bg-success"
              : value >= 70
                ? "bg-primary"
                : "bg-subtle",
          )}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
    </span>
  );
}

const CANDIDATE_TONES: Record<CandidateAppStatus, BadgeTone> = {
  sent: "neutral",
  viewed: "violet",
  interview: "primary",
  offer: "success",
  rejected: "danger",
};
const EMPLOYER_TONES: Record<EmployerAppStatus, BadgeTone> = {
  new: "primary",
  review: "neutral",
  interview: "violet",
  offer: "success",
  rejected: "danger",
};
const VACANCY_TONES: Record<VacancyStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  closed: "neutral",
};

export function StatusBadge(
  props:
    | { kind: "candidate"; status: CandidateAppStatus; label: string }
    | { kind: "employer"; status: EmployerAppStatus; label: string }
    | { kind: "vacancy"; status: VacancyStatus; label: string },
) {
  const tone =
    props.kind === "candidate"
      ? CANDIDATE_TONES[props.status]
      : props.kind === "employer"
        ? EMPLOYER_TONES[props.status]
        : VACANCY_TONES[props.status];
  return (
    <Badge tone={tone} dot>
      {props.label}
    </Badge>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  compact,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: { href: string; label: string };
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
      )}
    >
      <span className="bg-primary-soft text-primary-text relative inline-flex size-14 items-center justify-center rounded-full">
        {icon}
        <span
          aria-hidden
          className="border-primary/40 absolute -inset-2 rounded-full border border-dashed"
        />
      </span>
      <p className="mt-2 font-bold">{title}</p>
      {text ? <p className="text-subtle max-w-sm text-sm">{text}</p> : null}
      {action ? (
        <Link
          href={action.href}
          className={buttonClass({ size: "sm", className: "mt-2" })}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-line block animate-pulse rounded-lg motion-reduce:animate-none",
        className,
      )}
    />
  );
}
