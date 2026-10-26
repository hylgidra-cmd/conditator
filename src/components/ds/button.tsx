import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "@/components/icons";
import { FOCUS_RING, cn } from "./cn";

export type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "soft";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  // Apelsin fondagi matn toʻq (#14232A): oq matn bu fonda AA dan oʻtmaydi.
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover shadow-primary active:translate-y-px",
  dark: "bg-ink text-on-ink hover:bg-ink-hover active:translate-y-px",
  outline: "border border-line bg-card text-text hover:border-ink",
  ghost: "text-text hover:bg-peach",
  soft: "bg-primary-soft text-primary-text hover:brightness-95",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.9375rem] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "font-ui inline-flex shrink-0 items-center justify-center rounded-btn font-semibold whitespace-nowrap transition-[background-color,border-color,filter,transform] duration-150 select-none",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    FOCUS_RING,
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** PDF dagidek oxirida "→" strelka. */
  arrow?: boolean;
  /** Yuklanish holati: tugma bosilmaydi, ekran oʻquvchiga busy deb aytiladi. */
  loading?: boolean;
  children: ReactNode;
  className?: string;
};

function Inner({ arrow, loading, children }: Common) {
  return (
    <>
      {loading ? (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      {children}
      {arrow ? <ArrowRightIcon size={18} /> : null}
    </>
  );
}

export function Button({
  variant,
  size,
  arrow,
  loading,
  children,
  className,
  type = "button",
  disabled,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, className })}
      {...rest}
    >
      <Inner arrow={arrow} loading={loading}>
        {children}
      </Inner>
    </button>
  );
}

/** Tugma koʻrinishidagi havola (sahifalar orasida yoki tashqi manzilga). */
export function ButtonLink({
  variant,
  size,
  arrow,
  children,
  className,
  ...rest
}: Omit<Common, "loading"> & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...rest}>
      <Inner arrow={arrow}>{children}</Inner>
    </Link>
  );
}

/** Doira shaklidagi ikon tugma (karusel strelkalari, rejim almashtirgich). */
export function IconButton({
  label,
  tone = "surface",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: {
  label: string;
  tone?: "primary" | "surface" | "dark";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,transform,opacity] duration-150 active:scale-95 disabled:opacity-40",
        FOCUS_RING,
        tone === "primary" &&
          "bg-primary text-on-primary hover:bg-primary-hover shadow-primary",
        tone === "surface" && "bg-card text-text shadow-soft hover:bg-peach",
        tone === "dark" && "bg-ink text-on-ink hover:bg-ink-hover",
        size === "sm" && "size-9",
        size === "md" && "size-12",
        size === "lg" && "size-16",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
