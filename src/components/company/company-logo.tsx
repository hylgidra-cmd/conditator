"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useRef, useState } from "react";
import { FormAlert, useErrorText } from "@/components/ui/form";

const LOGO_URL = "/api/company/me/logo";

/** Logo yuklash. Fayl turi va hajmi serverda tekshiriladi; bu yerdagi `accept` faqat qulaylik uchun. */
export function CompanyLogo({ initialHasLogo }: { initialHasLogo: boolean }) {
  const t = useTranslations("Company.logo");
  const errorText = useErrorText();
  const input = useRef<HTMLInputElement>(null);
  const [hasLogo, setHasLogo] = useState(initialHasLogo);
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [fileName, setFileName] = useState<string>();

  async function send(method: "POST" | "DELETE", body?: FormData) {
    setPending(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const response = await fetch(LOGO_URL, { method, body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.fields?.logo ?? data.error ?? "SERVER_ERROR");
        return;
      }
      setHasLogo(Boolean(data.company?.hasLogo));
      setVersion((current) => current + 1);
      if (method === "POST") setNotice(t("uploaded"));
    } catch {
      setError("NETWORK");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const file = input.current?.files?.[0];
    if (!file) return setError("FIELD_REQUIRED");
    const body = new FormData();
    body.append("logo", file);
    void send("POST", body).then(() => {
      if (input.current) input.current.value = "";
      setFileName(undefined);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="border-border bg-background flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border">
          {hasLogo ? (
            // Logo ruxsat tekshiradigan API dan keladi, Next Image optimizatsiyasi kerak emas.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${LOGO_URL}?v=${version}`}
              alt={t("alt")}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-muted px-1 text-center text-xs">
              {t("none")}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {/* Brauzerning o'z "Choose file" matni tarjima qilinmaydi, shuning uchun o'z tugmamiz. */}
          <input
            ref={input}
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="peer sr-only"
            onChange={(event) => setFileName(event.target.files?.[0]?.name)}
          />
          <div className="peer-focus-visible:ring-brand-soft flex flex-wrap items-center gap-3 rounded-lg peer-focus-visible:ring-2">
            <label
              htmlFor="logo"
              className="border-border cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium"
            >
              {t("choose")}
            </label>
            <span className="text-muted min-w-0 truncate text-sm">
              {fileName ?? t("noFile")}
            </span>
          </div>
          <p className="text-muted text-xs">{t("hint")}</p>
        </div>
      </div>
      <FormAlert>{errorText(error)}</FormAlert>
      {notice ? <FormAlert tone="success">{notice}</FormAlert> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {t("upload")}
        </button>
        {hasLogo ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => send("DELETE")}
            className="border-border rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {t("remove")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
