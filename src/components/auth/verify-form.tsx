"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import {
  Field,
  FormAlert,
  SubmitButton,
  useErrorText,
} from "@/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { postJson } from "@/lib/client/api";

const RESEND_COOLDOWN_S = 60;

export function VerifyForm({ email }: { email: string }) {
  const t = useTranslations("Auth.verify");
  const errorText = useErrorText();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string>();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setPending(true);
    setError(undefined);
    setFields({});
    setNotice(undefined);
    const result = await postJson("/api/auth/verify", { email, code });
    setPending(false);
    if (result.ok) {
      router.replace("/account");
      router.refresh();
      return;
    }
    if (result.error === "ALREADY_VERIFIED") {
      router.replace("/login");
      return;
    }
    if (result.fields) setFields(result.fields);
    else setError(result.error);
  }

  async function onResend() {
    setError(undefined);
    setNotice(undefined);
    const result = await postJson("/api/auth/resend", { email });
    if (result.ok) {
      setNotice(t("resent"));
      setCooldown(RESEND_COOLDOWN_S);
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert>{errorText(error)}</FormAlert>
      <FormAlert tone="success">{notice}</FormAlert>
      <Field
        name="code"
        label={t("code")}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        error={errorText(fields.code)}
        className="tracking-[0.5em]"
      />
      <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0}
          className="text-brand disabled:text-muted font-medium underline disabled:no-underline"
        >
          {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
        </button>
        <Link href="/login" className="text-muted underline">
          {t("toLogin")}
        </Link>
      </div>
    </form>
  );
}
