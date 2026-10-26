import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone =
  "neutral" | "primary" | "success" | "warning" | "danger" | "violet" | "dark";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-card-cool text-text",
  primary: "bg-primary-soft text-primary-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  violet: "bg-violet/12 text-text",
  dark: "bg-ink text-on-ink",
};

/** Kichik holat belgisi (pill). `dot` holat rangidagi nuqta qoʻshadi. */
export function Badge({
  tone = "neutral",
  dot = false,
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-ui inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            tone === "violet" ? "bg-violet" : "bg-current",
          )}
        />
      ) : null}
      {icon}
      {children}
    </span>
  );
}
