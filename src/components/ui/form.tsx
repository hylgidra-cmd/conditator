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
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`border-border bg-surface focus:border-brand focus:ring-brand-soft w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${className ?? ""}`}
        {...input}
      />
      {hint && !error ? <p className="text-muted text-xs">{hint}</p> : null}
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
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
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${styles}`}
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
      className="bg-brand w-full rounded-lg px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? t("submitting") : children}
    </button>
  );
}
