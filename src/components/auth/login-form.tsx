"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import {
  Field,
  FormAlert,
  SubmitButton,
  useErrorText,
} from "@/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { postJson } from "@/lib/client/api";

export function LoginForm({ resetDone }: { resetDone: boolean }) {
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
    const result = await postJson("/api/auth/login", {
      email,
      password: form.get("password"),
    });
    setPending(false);
    if (result.ok) {
      router.replace("/account");
      router.refresh();
      return;
    }
    if (result.error === "EMAIL_NOT_VERIFIED") {
      router.push({ pathname: "/verify", query: { email } });
      return;
    }
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  return (
    // method="post": JS yuklanmasa ham parol/kod URL ga (va loglarga) tushmaydi.
    <form method="post" onSubmit={onSubmit} className="space-y-4" noValidate>
      {resetDone ? (
        <FormAlert tone="success">{t("resetDone")}</FormAlert>
      ) : null}
      <FormAlert>{errorText(error)}</FormAlert>
      <Field
        name="email"
        type="email"
        autoComplete="email"
        required
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
