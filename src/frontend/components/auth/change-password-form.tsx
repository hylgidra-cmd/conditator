"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { postJson } from "@/backend/client/api";
import {
  Field,
  FormAlert,
  SubmitButton,
  useErrorText,
} from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";

export function ChangePasswordForm() {
  const t = useTranslations("Auth.changePassword");
  const tRegister = useTranslations("Auth.register");
  const errorText = useErrorText();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(undefined);
    setFields({});
    setSaved(false);

    const result = await postJson("/api/auth/change-password", {
      currentPassword: form.get("currentPassword"),
      newPassword: form.get("newPassword"),
    });
    setPending(false);

    if (result.ok) {
      setSaved(true);
      event.currentTarget.reset();
      return;
    }
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert>{errorText(error)}</FormAlert>
      {saved ? (
        <p
          role="status"
          className="border-emerald-500/30 bg-success-soft text-success rounded-xl border px-4 py-3 text-sm font-semibold"
        >
          {t("success")}
        </p>
      ) : null}
      <Field
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        label={t("currentPassword")}
        error={errorText(fields.currentPassword)}
      />
      <Field
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        label={t("newPassword")}
        hint={tRegister("passwordHint")}
        error={errorText(fields.newPassword)}
      />
      <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
      <div className="flex items-center justify-between pt-1 text-sm">
        <Link href="/account" className="text-muted underline">
          {t("backToAccount")}
        </Link>
        <Link href="/forgot" className="text-muted underline">
          {t("forgotLink")}
        </Link>
      </div>
    </form>
  );
}
