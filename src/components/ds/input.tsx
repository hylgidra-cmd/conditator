import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { FOCUS_RING, cn } from "./cn";

const FIELD =
  "font-ui w-full rounded-field border bg-card text-text placeholder:text-subtle/80 transition-[border-color,box-shadow] duration-150 outline-none focus:border-ink focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

function fieldClass(invalid?: boolean, className?: string) {
  return cn(
    FIELD,
    invalid ? "border-danger" : "border-line hover:border-subtle/60",
    className,
  );
}

/** Yorliq, yordamchi matn va xato bilan oʻralgan maydon. Xato aria-describedby orqali bogʻlanadi. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-ui text-text text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-danger text-caption font-medium">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-subtle text-caption">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Field ichidagi kirish elementi uchun aria atributlari. */
export function describedBy(
  id: string,
  { hint, error }: { hint?: string; error?: string },
) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export function Input({
  invalid,
  icon,
  className,
  ...rest
}: {
  invalid?: boolean;
  icon?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  if (!icon)
    return (
      <input
        className={fieldClass(invalid, cn("h-12 px-4", className))}
        {...rest}
      />
    );
  return (
    <div className="relative">
      <span className="text-subtle pointer-events-none absolute inset-y-0 left-4 flex items-center">
        {icon}
      </span>
      <input
        className={fieldClass(invalid, cn("h-12 pr-4 pl-11", className))}
        {...rest}
      />
    </div>
  );
}

export function Textarea({
  invalid,
  className,
  ...rest
}: { invalid?: boolean } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={fieldClass(
        invalid,
        cn("min-h-28 px-4 py-3 leading-relaxed", className),
      )}
      {...rest}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...rest
}: { invalid?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={fieldClass(
          invalid,
          cn("h-12 appearance-none pr-11 pl-4", className),
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-subtle pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

/** Belgilash katakchasi (filtrlar uchun). */
export function Checkbox({
  label,
  className,
  ...rest
}: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label
      className={cn(
        "font-ui text-text inline-flex cursor-pointer items-center gap-2.5 text-sm",
        className,
      )}
    >
      <input
        type="checkbox"
        className={cn("accent-primary size-4.5 rounded", FOCUS_RING)}
        {...rest}
      />
      {label}
    </label>
  );
}
