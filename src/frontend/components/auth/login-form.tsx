"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { getJson, postJson } from "@/backend/client/api";

function safeNextTarget(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /[\r\n]/.test(trimmed)
  ) {
    return null;
  }
  const stripped = trimmed.replace(/^\/(kk|uz|ru|en)(?=\/|$)/, "");
  return stripped || "/";
}

export function LoginForm({
  resetDone,
  registered,
  email: initialEmail,
  nextPath,
}: {
  resetDone: boolean;
  registered: boolean;
  email?: string;
  nextPath?: string;
}) {
  const t = useTranslations("Auth.login");
  const errorText = useErrorText();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  async function completeLoginRedirect(role?: string) {
    const explicitNext = safeNextTarget(nextPath);
    if (explicitNext) {
      setPending(false);
      router.replace(explicitNext);
      router.refresh();
      return;
    }

    let target = role === "ADMIN" ? "/admin" : "/account";

    if (role === "STUDENT") {
      const statusRes = await getJson<{ testComplete: boolean }>(
        "/api/onboarding/status",
      );
      target =
        statusRes.ok && !statusRes.data.testComplete
          ? "/student/personality"
          : "/student/cv";
    }

    setPending(false);
    router.replace(target);
    router.refresh();
  }

  async function onSubmitTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeToken) return;
    const trimmed = twoFactorCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError(undefined);
      setFields({ code: "CODE_FORMAT" });
      return;
    }
    setPending(true);
    setError(undefined);
    setFields({});
    const result = await postJson<{ ok: boolean; role?: string }>(
      "/api/auth/login/verify-2fa",
      { challengeToken, code: trimmed },
    );
    if (result.ok) {
      await completeLoginRedirect(result.data.role);
      return;
    }
    setPending(false);
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    const localErrors: Record<string, string> = {};
    if (!email) localErrors.email = "FIELD_REQUIRED";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      localErrors.email = "INVALID_EMAIL";
    if (!password) localErrors.password = "FIELD_REQUIRED";
    if (Object.keys(localErrors).length > 0) {
      setError(undefined);
      setFields(localErrors);
      return;
    }

    setPending(true);
    setError(undefined);
    setFields({});
    const result = await postJson<{
      ok: boolean;
      role?: string;
      requiresTwoFactor?: boolean;
      challengeToken?: string;
    }>("/api/auth/login", {
      email,
      password,
    });
    if (result.ok) {
      if (result.data.requiresTwoFactor && result.data.challengeToken) {
        setPending(false);
        setChallengeToken(result.data.challengeToken);
        setTwoFactorCode("");
        return;
      }
      await completeLoginRedirect(result.data.role);
      return;
    }
    setPending(false);
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  if (challengeToken) {
    return (
      <form
        method="post"
        onSubmit={onSubmitTwoFactor}
        className="space-y-5 lg:space-y-6"
        noValidate
      >
        <div className="space-y-1">
          <h2 className="text-text text-lg font-bold">{t("twoFactorTitle")}</h2>
          <p className="text-muted text-sm">{t("twoFactorHint")}</p>
        </div>
        <FormAlert>{errorText(error)}</FormAlert>
        <div className="space-y-2">
          <label
            htmlFor="login-2fa-code"
            className="text-text block text-sm font-bold lg:text-[15.5px]"
          >
            {t("twoFactorCode")}
          </label>
          <input
            id="login-2fa-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            className="h-12 w-full rounded-xl border border-[#e3e5e4] bg-[#efefef] px-4 text-center text-lg font-bold tracking-[0.35em] text-slate-900 outline-none transition-all focus:border-[#058b57] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 lg:h-[54px] dark:border-emerald-200/25 dark:bg-white/[0.04] dark:text-white dark:focus:border-emerald-400 dark:focus:bg-white/[0.06]"
          />
          {fields.code ? (
            <p className="text-danger text-xs font-medium">
              {errorText(fields.code)}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#068955] px-6 text-base font-bold text-white shadow-[0_12px_26px_-10px_rgba(6,137,85,0.62)] transition-all hover:bg-[#057448] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 lg:h-[58px] lg:text-[18px] dark:bg-gradient-to-r dark:from-[#0aa66c] dark:to-[#058755] dark:hover:brightness-105"
        >
          <span>{t("twoFactorVerify")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setChallengeToken(null);
            setTwoFactorCode("");
            setError(undefined);
            setFields({});
          }}
          className="text-subtle hover:text-text w-full text-center text-sm font-semibold underline"
        >
          {t("twoFactorBack")}
        </button>
      </form>
    );
  }

  return (
    // method="post": JS yuklanmasa ham parol/kod URL ga (va loglarga) tushmaydi.
    <form
      method="post"
      onSubmit={onSubmit}
      className="space-y-5 lg:space-y-6"
      noValidate
    >
      {resetDone ? (
        <FormAlert tone="success">{t("resetDone")}</FormAlert>
      ) : null}
      {registered ? (
        <FormAlert tone="success">{t("registered")}</FormAlert>
      ) : null}
      <FormAlert>{errorText(error)}</FormAlert>
      <div className="space-y-2">
        <label
          htmlFor="login-email"
          className="text-text block text-sm font-bold lg:text-[15.5px]"
        >
          {t("email")}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={initialEmail}
          className="h-12 w-full rounded-xl border border-[#e3e5e4] bg-[#efefef] px-4 text-[15px] text-slate-900 outline-none transition-all focus:border-[#058b57] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 lg:h-[54px] dark:border-emerald-200/25 dark:bg-white/[0.04] dark:text-white dark:focus:border-emerald-400 dark:focus:bg-white/[0.06]"
        />
        {fields.email ? (
          <p className="text-danger text-xs font-medium">
            {errorText(fields.email)}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="login-password"
          className="text-text block text-sm font-bold lg:text-[15.5px]"
        >
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-xl border border-[#e3e5e4] bg-[#efefef] pr-12 pl-4 text-[15px] text-slate-900 outline-none transition-all focus:border-[#058b57] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 lg:h-[54px] dark:border-emerald-200/25 dark:bg-white/[0.04] dark:text-white dark:focus:border-emerald-400 dark:focus:bg-white/[0.06]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
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
        {fields.password ? (
          <p className="text-danger text-xs font-medium">
            {errorText(fields.password)}
          </p>
        ) : null}
      </div>
      <div className="!mt-3 text-right text-sm lg:text-[15px]">
        <Link
          href="/forgot"
          className="font-semibold text-[#058b57] hover:underline dark:text-emerald-300"
        >
          {t("forgot")}
        </Link>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#068955] px-6 text-base font-bold text-white shadow-[0_12px_26px_-10px_rgba(6,137,85,0.62)] transition-all hover:bg-[#057448] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 lg:h-[58px] lg:text-[18px] dark:bg-gradient-to-r dark:from-[#0aa66c] dark:to-[#058755] dark:hover:brightness-105"
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
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="font-semibold text-[#058b57] underline dark:text-emerald-300"
        >
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
