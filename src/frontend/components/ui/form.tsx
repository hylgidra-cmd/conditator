"use client";

import { useTranslations } from "next-intl";
import type { InputHTMLAttributes, ReactNode } from "react";

type ErrorKey = Parameters<ReturnType<typeof useTranslations<"Errors">>>[0];

/** Xato kodini tarjima qiladi; noma'lum kod umumiy server xatosi sifatida ko'rsatiladi. */
export function useErrorText() {
  const t = useTranslations("Errors");
  return (code: string | undefined) =>
    code
      ? t.has(code as ErrorKey)
        ? t(code as ErrorKey)
        : t("SERVER_ERROR")
      : undefined;
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({
  label,
  hint,
  error,
  id,
  className,
  ...input
}: FieldProps) {
  const inputId = id ?? input.name;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="text-text block text-sm font-semibold"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`border-line bg-canvas/80 text-text focus:border-primary focus:ring-primary/25 w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors outline-none focus:ring-2 ${className ?? ""}`}
        {...input}
      />
      {hint && !error ? <p className="text-subtle text-xs">{hint}</p> : null}
      {error ? (
        <p id={`${inputId}-error`} className="text-danger text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: ReactNode;
}) {
  if (!children) return null;
  const styles =
    tone === "error"
      ? "border-red-500/30 bg-danger-soft text-danger"
      : "border-emerald-500/30 bg-success-soft text-success";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}
    >
      {children}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Form");
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? t("submitting") : children}
    </button>
  );
}
