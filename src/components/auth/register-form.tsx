"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import {
  Field,
  FormAlert,
  SubmitButton,
  useErrorText,
} from "@/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { postJson } from "@/lib/client/api";

const ROLES = ["STUDENT", "COMPANY"] as const;

export function RegisterForm() {
  const t = useTranslations("Auth.register");
  const errorText = useErrorText();
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    setPending(true);
    setError(undefined);
    setFields({});
    const result = await postJson("/api/auth/register", {
      email,
      password: form.get("password"),
      role: form.get("role"),
      consent: form.get("consent") === "on",
      locale,
    });
    setPending(false);
    if (result.ok) {
      router.push({
        pathname: "/verify",
        query: { email: email.trim().toLowerCase() },
      });
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
      <Field
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        label={t("password")}
        hint={t("passwordHint")}
        error={errorText(fields.password)}
      />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("role")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((role, index) => (
            <label
              key={role}
              className="border-border has-[:checked]:border-brand has-[:checked]:bg-brand-soft flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={index === 0}
              />
              {role === "STUDENT" ? t("roleStudent") : t("roleCompany")}
            </label>
          ))}
        </div>
        {fields.role ? (
          <p className="text-sm text-red-600">{errorText(fields.role)}</p>
        ) : null}
      </fieldset>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" required className="mt-1" />
          {t("consent")}
        </label>
        {fields.consent ? (
          <p className="mt-1 text-sm text-red-600">
            {errorText(fields.consent)}
          </p>
        ) : null}
      </div>
      <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
      <p className="text-muted text-center text-sm">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-brand font-medium underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
