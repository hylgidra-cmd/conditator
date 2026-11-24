"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import {
  Field,
  FormAlert,
  SubmitButton,
  useErrorText,
} from "@/frontend/components/ui/form";
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
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    setPending(true);
    setError(undefined);
    setFields({});
    const result = await postJson<{ ok: boolean; role?: string }>(
      "/api/auth/login",
      {
        email,
        password: form.get("password"),
      },
    );
    if (result.ok) {
      const explicitNext = safeNextTarget(nextPath);
      if (explicitNext) {
        setPending(false);
        router.replace(explicitNext);
        router.refresh();
        return;
      }

      let target =
        result.data.role === "COMPANY"
          ? "/company"
          : result.data.role === "ADMIN"
            ? "/admin"
            : "/account";

      if (result.data.role === "STUDENT") {
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
      return;
    }
    setPending(false);
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  return (
    // method="post": JS yuklanmasa ham parol/kod URL ga (va loglarga) tushmaydi.
    <form method="post" onSubmit={onSubmit} className="space-y-4" noValidate>
      {resetDone ? (
        <FormAlert tone="success">{t("resetDone")}</FormAlert>
      ) : null}
      {registered ? (
        <FormAlert tone="success">{t("registered")}</FormAlert>
      ) : null}
      <FormAlert>{errorText(error)}</FormAlert>
      <Field
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={initialEmail}
        label={t("email")}
        error={errorText(fields.email)}
      />
      <Field
        name="password"
        type="password"
        autoComplete="current-password"
        required
        label={t("password")}
        error={errorText(fields.password)}
      />
      <div className="text-right text-sm">
        <Link href="/forgot" className="text-brand underline">
          {t("forgot")}
        </Link>
      </div>
      <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
      <p className="text-muted text-center text-sm">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-brand font-medium underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
