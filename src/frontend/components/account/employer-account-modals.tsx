"use client";

import { useTranslations } from "next-intl";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { requestJson } from "@/backend/client/api";
import { COMPANY_SIZES } from "@/backend/company/sizes";
import { CompanySubscriptionPlans } from "@/frontend/components/company/company-subscription-plans";
import { FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { isLikelyImageFile } from "@/frontend/lib/compress-image";
import { Link } from "@/i18n/navigation";

export type EmployerModalType =
  | null
  | "editCompany"
  | "subscription"
  | "verification"
  | "twoFactor"
  | "password"
  | "sessions";

export type EmployerCompanyState = {
  id: string;
  name: string;
  industry: string;
  city: string;
  country: string;
  website: string;
  contactEmail: string;
  contactPerson: string;
  size: string;
  description: string;
  hasLogo: boolean;
  logoVersion: number;
};

async function compressLogoSquare(file: File): Promise<string> {
  if (!isLikelyImageFile(file)) {
    throw new Error("FILE_TYPE_NOT_ALLOWED");
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("INVALID_IMAGE"));
      el.src = objectUrl;
    });
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS_ERROR");
    const minSide = Math.min(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
    );
    const sx = Math.max(
      0,
      Math.floor(((img.naturalWidth || img.width) - minSide) / 2),
    );
    const sy = Math.max(
      0,
      Math.floor(((img.naturalHeight || img.height) - minSide) / 2),
    );
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function EmployerModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-xl",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const t = useTranslations("EmployerAccount.modals");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative max-h-[90dvh] w-full ${maxWidth} overflow-y-auto rounded-3xl border border-[#cce7da] bg-white p-6 text-[#0d2119] shadow-[0_28px_70px_-16px_rgba(4,40,26,0.34)] sm:p-7 dark:border-[#227352]/60 dark:bg-[#061b13] dark:text-[#effaf4] dark:shadow-[0_30px_80px_-14px_rgba(0,0,0,0.85)]`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-xs text-[#547064] sm:text-sm dark:text-[#8eb5a4]">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#d6ebe0] bg-[#f4fbf7] text-[#355447] transition-colors hover:border-[#0e935f] hover:text-[#0b8455] dark:border-[#1e5e44] dark:bg-[#0b291d] dark:text-[#b4decb] dark:hover:border-[#34eab0] dark:hover:text-white"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EditCompanyModal({
  initial,
  accountEmail,
  onClose,
  onSaved,
}: {
  initial: EmployerCompanyState;
  accountEmail: string;
  onClose: () => void;
  onSaved: (next: EmployerCompanyState) => void;
}) {
  const t = useTranslations("EmployerAccount.modals");
  const errorText = useErrorText();

  const [name, setName] = useState(initial.name);
  const [industry, setIndustry] = useState(initial.industry);
  const [city, setCity] = useState(initial.city || initial.country);
  const [website, setWebsite] = useState(initial.website);
  const [contactEmail, setContactEmail] = useState(
    initial.contactEmail || accountEmail,
  );
  const [size, setSize] = useState(initial.size);
  const [description, setDescription] = useState(initial.description);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogoPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressLogoSquare(file);
      setLogoPreview(compressed);
      setLogoRemoved(false);
    } catch {
      setError(t("logoError"));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(errorText("FIELD_REQUIRED") ?? "Required");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      industry: industry.trim() || null,
      city: city.trim() || null,
      website: website.trim() || null,
      contactEmail: contactEmail.trim() || null,
      size: size || null,
      description: description.trim() || null,
    };

    if (logoPreview !== null) {
      payload.logoDataUrl = logoPreview;
    } else if (logoRemoved) {
      payload.logoDataUrl = null;
    }

    const res = await requestJson<{
      ok: boolean;
      company: {
        id: string;
        name: string | null;
        industry: string | null;
        city: string | null;
        country: string | null;
        website: string | null;
        contactEmail: string | null;
        contactPerson: string | null;
        size: string | null;
        description: string | null;
        hasLogo: boolean;
      };
    }>("PATCH", "/api/company/account", payload);

    setSaving(false);
    if (!res.ok) {
      setError(errorText(res.error) ?? t("logoError"));
      return;
    }

    onSaved({
      id: res.data.company.id,
      name: res.data.company.name ?? "",
      industry: res.data.company.industry ?? "",
      city: res.data.company.city ?? "",
      country: res.data.company.country ?? "",
      website: res.data.company.website ?? "",
      contactEmail: res.data.company.contactEmail ?? "",
      contactPerson: res.data.company.contactPerson ?? "",
      size: res.data.company.size ?? "",
      description: res.data.company.description ?? "",
      hasLogo: res.data.company.hasLogo,
      logoVersion: Date.now(),
    });
    onClose();
  }

  const showExistingLogo = initial.hasLogo && !logoRemoved && !logoPreview;
  const initialLetter = (name.trim() || accountEmail || "C")
    .slice(0, 1)
    .toUpperCase();

  return (
    <EmployerModalShell
      title={t("editTitle")}
      subtitle={t("editSubtitle")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <FormAlert>{error}</FormAlert> : null}

        {/* Logo Uploader */}
        <div className="flex items-center gap-4 rounded-2xl border border-[#d9eee3] bg-[#f6fbf8] p-4 dark:border-[#1c5c42] dark:bg-[#0a261b]">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#12b374] to-[#077d4f] text-2xl font-extrabold text-white shadow-md">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="size-full object-cover" />
            ) : showExistingLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/companies/${initial.id}/logo?v=${initial.logoVersion}`}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initialLetter
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0d8a59] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110">
              <span>{t("uploadLogo")}</span>
              <input
                type="file"
                accept="image/*"
                onChange={onLogoPick}
                className="sr-only"
              />
            </label>
            {logoPreview || showExistingLogo ? (
              <button
                type="button"
                onClick={() => {
                  setLogoPreview(null);
                  setLogoRemoved(true);
                }}
                className="cursor-pointer rounded-xl border border-[#d6ebe0] bg-white px-3 py-2 text-xs font-semibold text-[#547064] transition hover:border-red-400 hover:text-red-600 dark:border-[#1e5e44] dark:bg-[#082017] dark:text-[#9ec5b4]"
              >
                {t("removeLogo")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("fieldCompanyName")}
            </label>
            <input
              type="text"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("placeholderCompanyName")}
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("fieldIndustry")}
            </label>
            <input
              type="text"
              value={industry}
              maxLength={100}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder={t("placeholderIndustry")}
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("fieldCity")}
            </label>
            <input
              type="text"
              value={city}
              maxLength={100}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("placeholderCity")}
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("fieldTeamSize")}
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3 text-sm font-medium outline-none focus:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            >
              <option value="">{t("selectTeamSize")}</option>
              {COMPANY_SIZES.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("fieldWebsite")}
            </label>
            <input
              type="text"
              value={website}
              maxLength={180}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="www.technova.uz"
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("fieldContactEmail")}
            </label>
            <input
              type="email"
              value={contactEmail}
              maxLength={254}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="hr@technova.uz"
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold">
            {t("fieldDescription")}
          </label>
          <textarea
            rows={3}
            maxLength={1200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("placeholderDescription")}
            className="w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] p-3.5 text-sm font-medium outline-none focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl border border-[#d6ebe0] bg-[#f7fcfa] px-4 text-xs font-bold text-[#355447] dark:border-[#1e5e44] dark:bg-[#0a261b] dark:text-[#bce2d0]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 cursor-pointer rounded-xl bg-gradient-to-b from-[#0e935f] to-[#076e46] px-5 text-xs font-bold text-white shadow-sm disabled:opacity-60"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </EmployerModalShell>
  );
}

export function CompanySubscriptionModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const t = useTranslations("EmployerAccount.modals");

  return (
    <EmployerModalShell
      title={t("subModalTitle")}
      subtitle={t("subModalSubtitle")}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        <CompanySubscriptionPlans onSubmitted={onSubmitted} />
        <div className="flex justify-end border-t border-[#e1efe8] pt-3 dark:border-[#164733]">
          <Link
            href="/company/billing"
            className="text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
          >
            {t("viewPaymentHistory")} →
          </Link>
        </div>
      </div>
    </EmployerModalShell>
  );
}

export function VerificationDetailsModal({
  approval,
  approvedAtLabel,
  companyName,
  onClose,
}: {
  approval: "APPROVED" | "PENDING" | "REJECTED";
  approvedAtLabel: string | null;
  companyName: string;
  onClose: () => void;
}) {
  const t = useTranslations("EmployerAccount.modals");

  return (
    <EmployerModalShell
      title={t("verifyModalTitle")}
      subtitle={t("verifyModalSubtitle")}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div
          className={`rounded-2xl border p-4 ${
            approval === "APPROVED"
              ? "border-[#bfe8d4] bg-[#e6f7ef] text-[#0a6e45] dark:border-[#1f6a4b] dark:bg-[#0d3525] dark:text-[#4ade9b]"
              : approval === "PENDING"
                ? "border-amber-400/40 bg-amber-500/12 text-amber-800 dark:text-amber-300"
                : "border-red-400/40 bg-red-500/12 text-red-700 dark:text-red-300"
          }`}
        >
          <p className="text-sm font-extrabold">
            {approval === "APPROVED"
              ? `✓ ${t("verifyApprovedStatus", { name: companyName })}`
              : approval === "PENDING"
                ? t("verifyPendingStatus")
                : t("verifyRejectedStatus")}
          </p>
          {approvedAtLabel ? (
            <p className="mt-1 text-xs opacity-85">
              {t("verifyApprovedOn", { date: approvedAtLabel })}
            </p>
          ) : null}
        </div>

        <ul className="space-y-2 rounded-2xl border border-[#d9eee3] bg-[#f7fcfa] p-4 text-xs font-semibold dark:border-[#1c5c42] dark:bg-[#092319]">
          <li className="flex items-center gap-2">
            <span className="text-[#0c8a58] dark:text-[#34eab0]">✓</span>
            <span>{t("verifyBenefit1")}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#0c8a58] dark:text-[#34eab0]">✓</span>
            <span>{t("verifyBenefit2")}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#0c8a58] dark:text-[#34eab0]">✓</span>
            <span>{t("verifyBenefit3")}</span>
          </li>
        </ul>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            href="/support"
            className="text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
          >
            {t("contactSupport")} →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl bg-[#0d8a59] px-5 text-xs font-bold text-white"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </EmployerModalShell>
  );
}

export function TwoStepSecurityModal({
  initialEnabled,
  email,
  onClose,
  onChanged,
}: {
  initialEnabled: boolean;
  email: string;
  onClose: () => void;
  onChanged: (enabled: boolean) => void;
}) {
  const t = useTranslations("EmployerAccount.modals");
  const errorText = useErrorText();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedNotice(false);
    if (!currentPassword) {
      setError(errorText("FIELD_REQUIRED") ?? "Required");
      return;
    }

    const targetState = !enabled;
    setSaving(true);
    const res = await requestJson<{ ok: boolean; twoFactorEnabled: boolean }>(
      "PATCH",
      "/api/account/two-factor",
      {
        enabled: targetState,
        currentPassword,
      },
    );
    setSaving(false);
    if (!res.ok) {
      setError(errorText(res.error) ?? "Error");
      return;
    }

    setEnabled(res.data.twoFactorEnabled);
    setCurrentPassword("");
    setSavedNotice(true);
    onChanged(res.data.twoFactorEnabled);
  }

  return (
    <EmployerModalShell
      title={t("twoFactorTitle")}
      subtitle={t("twoFactorSubtitle")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <FormAlert>{error}</FormAlert> : null}

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#cce7da] bg-[#effaf4] p-4 dark:border-[#1f684a] dark:bg-[#0b2a1e]">
          <div>
            <p className="text-sm font-extrabold">{t("twoFactorStatusLabel")}</p>
            <p className="mt-0.5 text-xs text-[#4f6d61] dark:text-[#93bba9]">
              {email}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              enabled
                ? "bg-[#0d8a59] text-white dark:bg-[#22c987] dark:text-[#042115]"
                : "border border-[#c5dfd2] bg-white text-[#4f6d61] dark:border-[#215d44] dark:bg-[#081f16] dark:text-[#9dc4b2]"
            }`}
          >
            {enabled ? t("twoFactorOn") : t("twoFactorOff")}
          </span>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold">
            {t("confirmWithPassword")}
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm outline-none focus:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
          />
        </div>

        {savedNotice ? (
          <p className="text-xs font-bold text-[#0c8555] dark:text-[#4ade9b]">
            ✓ {t("twoFactorUpdated")}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl border border-[#d6ebe0] bg-[#f7fcfa] px-4 text-xs font-bold text-[#355447] dark:border-[#1e5e44] dark:bg-[#0a261b] dark:text-[#bce2d0]"
          >
            {t("close")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 cursor-pointer rounded-xl bg-gradient-to-b from-[#0e935f] to-[#076e46] px-5 text-xs font-bold text-white shadow-sm disabled:opacity-60"
          >
            {saving
              ? t("saving")
              : enabled
                ? t("disableTwoFactorBtn")
                : t("enableTwoFactorBtn")}
          </button>
        </div>
      </form>
    </EmployerModalShell>
  );
}
