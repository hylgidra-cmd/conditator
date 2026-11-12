"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import {
  Field,
  FormAlert,
  SubmitButton,
  useErrorText,
} from "@/frontend/components/ui/form";
import { useRouter } from "@/i18n/navigation";
import { postJson } from "@/backend/client/api";

export function ResetForm({ email }: { email: string }) {
  const t = useTranslations("Auth.reset");
  const tRegister = useTranslations("Auth.register");
  const errorText = useErrorText();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(undefined);
    setFields({});
    const result = await postJson("/api/auth/reset", {
      email: form.get("email"),
      code: form.get("code"),
      password: form.get("password"),
    });
    setPending(false);
    if (result.ok) {
      router.replace({ pathname: "/login", query: { reset: "1" } });
      return;
    }
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  return (
    // method="post": JS yuklanmasa ham parol/kod URL ga (va loglarga) tushmaydi.
    <form method="post" onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert>{errorText(error)}</FormAlert>
      <Field
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={email}
        label={t("email")}
        error={errorText(fields.email)}
      />
      <Field
        name="code"
        label={t("code")}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        error={errorText(fields.code)}
        className="tracking-[0.5em]"
      />
      <Field
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        label={t("password")}
        hint={tRegister("passwordHint")}
        error={errorText(fields.password)}
      />
      <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
    </form>
  );
}
