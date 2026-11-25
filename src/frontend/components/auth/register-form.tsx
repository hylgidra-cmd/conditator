"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { postJson } from "@/backend/client/api";

const ROLES = ["STUDENT", "COMPANY"] as const;

export function RegisterForm({
  defaultRole = "STUDENT",
}: {
  defaultRole?: (typeof ROLES)[number];
} = {}) {
  const t = useTranslations("Auth.register");
  const tLogin = useTranslations("Auth.login");
  const errorText = useErrorText();
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const consent = form.get("consent") === "on";

    const localErrors: Record<string, string> = {};
    if (!email) localErrors.email = "FIELD_REQUIRED";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      localErrors.email = "INVALID_EMAIL";
    if (!password) localErrors.password = "FIELD_REQUIRED";
    else if (password.length < 8) localErrors.password = "PASSWORD_TOO_SHORT";
    if (!consent) localErrors.consent = "CONSENT_REQUIRED";
    if (Object.keys(localErrors).length > 0) {
      setError(undefined);
      setFields(localErrors);
      return;
    }

    setPending(true);
    setError(undefined);
    setFields({});
    const result = await postJson("/api/auth/register", {
      email,
      password,
      role: form.get("role"),
      consent,
      locale,
    });
    setPending(false);
    if (result.ok) {
      router.push({
        pathname: "/login",
        query: { registered: "1", email: email.toLowerCase() },
      });
      return;
    }
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  return (
    // method="post": JS yuklanmasa ham parol/kod URL ga (va loglarga) tushmaydi.
    <form
      method="post"
      onSubmit={onSubmit}
      className="space-y-4 lg:space-y-5"
      noValidate
    >
      {error ? (
        <FormAlert>
          {errorText(error)}
          {error === "EMAIL_TAKEN" ? (
            <>
              {" "}
              <Link href="/login" className="font-semibold underline">
                {t("loginLink")}
              </Link>
            </>
          ) : null}
        </FormAlert>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="register-email"
          className="text-text block text-sm font-bold lg:text-[15px]"
        >
          {t("email")}
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 w-full rounded-xl border border-[#e3e5e4] bg-[#efefef] px-4 text-[15px] text-slate-900 outline-none transition-all focus:border-[#058b57] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 lg:h-[52px] dark:border-emerald-200/25 dark:bg-white/[0.04] dark:text-white dark:focus:border-emerald-400 dark:focus:bg-white/[0.06]"
        />
        {fields.email ? (
          <p className="text-danger text-xs font-medium">
            {errorText(fields.email)}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="register-password"
          className="text-text block text-sm font-bold lg:text-[15px]"
        >
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className="h-12 w-full rounded-xl border border-[#e3e5e4] bg-[#efefef] pr-12 pl-4 text-[15px] text-slate-900 outline-none transition-all focus:border-[#058b57] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 lg:h-[52px] dark:border-emerald-200/25 dark:bg-white/[0.04] dark:text-white dark:focus:border-emerald-400 dark:focus:bg-white/[0.06]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? tLogin("hidePassword") : tLogin("showPassword")
            }
            className="text-subtle hover:text-text absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            {showPassword ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-subtle text-xs">{t("passwordHint")}</p>
        {fields.password ? (
          <p className="text-danger text-xs font-medium">
            {errorText(fields.password)}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-text text-sm font-bold lg:text-[15px]">
          {t("role")}
        </legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ROLES.map((role) => (
            <label
              key={role}
              className="border-line bg-[#f4f6f5] text-text has-[:checked]:border-[#058b57] has-[:checked]:bg-[#e6f6ef] has-[:checked]:text-[#045d3a] flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-all dark:border-emerald-200/20 dark:bg-white/[0.04] dark:has-[:checked]:border-emerald-400 dark:has-[:checked]:bg-emerald-500/18 dark:has-[:checked]:text-emerald-200"
            >
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={role === defaultRole}
                className="accent-[#058b57]"
              />
              {role === "STUDENT" ? t("roleStudent") : t("roleCompany")}
            </label>
          ))}
        </div>
        {fields.role ? (
          <p className="text-danger text-xs font-medium">
            {errorText(fields.role)}
          </p>
        ) : null}
      </fieldset>

      <div>
        <label className="text-subtle flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed sm:text-sm">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 size-4 shrink-0 accent-[#058b57]"
          />
          <span>{t("consent")}</span>
        </label>
        {fields.consent ? (
          <p className="text-danger mt-1 text-xs font-medium">
            {errorText(fields.consent)}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#068955] px-6 text-base font-bold text-white shadow-[0_12px_26px_-10px_rgba(6,137,85,0.62)] transition-all hover:bg-[#057448] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 lg:h-[56px] lg:text-[17px] dark:bg-gradient-to-r dark:from-[#0aa66c] dark:to-[#058755] dark:hover:brightness-105"
      >
        {pending ? (
          <span
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden="true"
          />
        ) : null}
        <span>{t("submit")}</span>
      </button>

      <p className="text-muted pt-1 text-center text-sm lg:text-[15px]">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="font-semibold text-[#058b57] underline dark:text-emerald-300"
        >
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
