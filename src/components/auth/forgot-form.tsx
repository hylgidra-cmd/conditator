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

export function ForgotForm() {
  const t = useTranslations("Auth.forgot");
  const errorText = useErrorText();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    setPending(true);
    setError(undefined);
    setFields({});
    const result = await postJson("/api/auth/forgot", { email });
    setPending(false);
    if (result.ok) {
      router.push({ pathname: "/reset", query: { email } });
      return;
    }
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert>{errorText(error)}</FormAlert>
      <Field
        name="email"
        type="email"
        autoComplete="email"
        required
        label={t("email")}
        error={errorText(fields.email)}
      />
      <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
