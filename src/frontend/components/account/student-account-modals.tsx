"use client";

import { useTranslations } from "next-intl";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { getJson, postJson, requestJson } from "@/backend/client/api";
import type { CvPrivacySettings } from "@/backend/cv/privacy";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";
import { FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { isLikelyImageFile } from "@/frontend/lib/compress-image";

export type ActiveModalType =
  | null
  | "editProfile"
  | "privacy"
  | "security"
  | "sessions"
  | "password"
  | "weeklyPass";

export type StudentProfileState = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  educationSummary: string;
  avatarUrl: string | null;
};

export type PrivacyState = {
  cvId: string | null;
  hasSavedCv: boolean;
  isPaidCv: boolean;
  isVisible: boolean;
  privacy: Required<CvPrivacySettings>;
};

type SessionItem = {
  id: string;
  browser: string;
  os: string;
  isMobile: boolean;
  deviceLabel: string;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

async function compressAvatarSquare(file: File): Promise<string> {
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
    const minSide = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const sx = Math.max(0, Math.floor(((img.naturalWidth || img.width) - minSide) / 2));
    const sy = Math.max(0, Math.floor(((img.naturalHeight || img.height) - minSide) / 2));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.84);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const t = useTranslations("StudentAccount.modals");

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EditProfileModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: StudentProfileState;
  onClose: () => void;
  onSaved: (next: StudentProfileState) => void;
}) {
  const t = useTranslations("StudentAccount.modals");
  const errorText = useErrorText();
  const [fullName, setFullName] = useState(initial.fullName);
  const [educationSummary, setEducationSummary] = useState(initial.educationSummary);
  const [city, setCity] = useState(initial.city);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await compressAvatarSquare(file);
      setAvatarUrl(dataUrl);
    } catch {
      setError(t("photoError"));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await requestJson<{
      ok: boolean;
      profile: {
        fullName: string | null;
        phone: string | null;
        city: string | null;
        educationSummary: string | null;
        avatarUrl: string | null;
      };
    }>("PATCH", "/api/account/profile", {
      fullName: fullName.trim() || null,
      educationSummary: educationSummary.trim() || null,
      city: city.trim() || null,
      phone: phone.trim() || null,
      avatarUrl,
    });
    setSaving(false);
    if (!res.ok) {
      setError(errorText(res.error) ?? t("photoError"));
      return;
    }
    onSaved({
      ...initial,
      fullName: res.data.profile.fullName ?? "",
      phone: res.data.profile.phone ?? "",
      city: res.data.profile.city ?? "",
      educationSummary: res.data.profile.educationSummary ?? "",
      avatarUrl: res.data.profile.avatarUrl ?? null,
    });
    onClose();
  }

  const initialLetter = (fullName.trim() || initial.email).slice(0, 1).toUpperCase();

  return (
    <ModalShell
      title={t("editTitle")}
      subtitle={t("editSubtitle")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <FormAlert>{error}</FormAlert> : null}

        {/* Photo Picker */}
        <div className="flex items-center gap-4 rounded-2xl border border-[#d9eee3] bg-[#f6fbf8] p-4 dark:border-[#1c5c42] dark:bg-[#0a261b]">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#12b374] to-[#077d4f] text-2xl font-extrabold text-white shadow-md">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initialLetter
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0d8a59] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110">
              <span>{t("uploadPhoto")}</span>
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarPick}
                className="sr-only"
              />
            </label>
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="cursor-pointer rounded-xl border border-[#d6ebe0] bg-white px-3 py-2 text-xs font-semibold text-[#547064] transition hover:border-red-400 hover:text-red-600 dark:border-[#1e5e44] dark:bg-[#082017] dark:text-[#9ec5b4]"
              >
                {t("removePhoto")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#234236] dark:text-[#c7ebd9]">
              {t("fieldFullName")}
            </label>
            <input
              type="text"
              value={fullName}
              maxLength={100}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("placeholderFullName")}
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#234236] dark:text-[#c7ebd9]">
              {t("fieldEducation")}
            </label>
            <input
              type="text"
              value={educationSummary}
              maxLength={180}
              onChange={(e) => setEducationSummary(e.target.value)}
              placeholder={t("placeholderEducation")}
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#234236] dark:text-[#c7ebd9]">
                {t("fieldCity")}
              </label>
              <input
                type="text"
                value={city}
                maxLength={100}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("placeholderCity")}
                className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#234236] dark:text-[#c7ebd9]">
                {t("fieldPhone")}
              </label>
              <input
                type="tel"
                value={phone}
                maxLength={50}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("placeholderPhone")}
                className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl border border-[#d6ebe0] bg-[#f7fcfa] px-4 text-xs font-bold text-[#355447] transition hover:bg-[#eaf6f0] dark:border-[#1e5e44] dark:bg-[#0a261b] dark:text-[#bce2d0]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 cursor-pointer rounded-xl bg-gradient-to-b from-[#0e935f] to-[#076e46] px-5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function PrivacySettingsModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: PrivacyState;
  onClose: () => void;
  onSaved: (next: PrivacyState) => void;
}) {
  const t = useTranslations("StudentAccount.modals");
  const errorText = useErrorText();
  const [isVisible, setIsVisible] = useState(initial.isVisible);
  const [privacy, setPrivacy] = useState<Required<CvPrivacySettings>>(initial.privacy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEnableVisibility = initial.hasSavedCv && initial.isPaidCv;

  function toggleFlag(key: keyof CvPrivacySettings) {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await requestJson<{
      ok: boolean;
      cvId: string;
      isVisible: boolean;
      privacy: Required<CvPrivacySettings>;
    }>("PATCH", "/api/account/privacy", {
      ...(initial.cvId ? { cvId: initial.cvId } : {}),
      ...(canEnableVisibility || !isVisible ? { isVisible } : {}),
      privacy,
    });
    setSaving(false);
    if (!res.ok) {
      setError(errorText(res.error) ?? t("photoError"));
      return;
    }
    onSaved({
      ...initial,
      cvId: res.data.cvId,
      isVisible: res.data.isVisible,
      privacy: res.data.privacy,
    });
    onClose();
  }

  const privacyItems: Array<{ key: keyof CvPrivacySettings; label: string }> = [
    { key: "hideName", label: t("privacyHideName") },
    { key: "hidePhone", label: t("privacyHidePhone") },
    { key: "hideEmail", label: t("privacyHideEmail") },
    { key: "hideAddress", label: t("privacyHideAddress") },
    { key: "hidePhoto", label: t("privacyHidePhoto") },
  ];

  return (
    <ModalShell
      title={t("privacyTitle")}
      subtitle={t("privacySubtitle")}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error ? <FormAlert>{error}</FormAlert> : null}

        <div className="rounded-2xl border border-[#cce7da] bg-[#effaf4] p-4 dark:border-[#1f684a] dark:bg-[#0b2a1e]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{t("cvSearchableTitle")}</p>
              <p className="mt-0.5 text-xs text-[#4f6d61] dark:text-[#93bba9]">
                {canEnableVisibility
                  ? t("cvSearchableHint")
                  : t("cvSearchableLockedHint")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isVisible}
              disabled={!canEnableVisibility && !isVisible}
              onClick={() => setIsVisible((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                isVisible
                  ? "bg-[#0e935f] dark:bg-[#22c987]"
                  : "bg-[#c8ded3] dark:bg-[#194634]"
              }`}
            >
              <span
                className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                  isVisible ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {privacyItems.map((item) => {
            const checked = privacy[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleFlag(item.key)}
                className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-[#daeee3] bg-[#f7fcfa] px-4 py-3 text-left transition hover:border-[#0e935f]/45 dark:border-[#1b573e] dark:bg-[#092218] dark:hover:border-[#34eab0]/45"
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-md border text-xs font-bold transition ${
                    checked
                      ? "border-[#0e935f] bg-[#0e935f] text-white dark:border-[#22c987] dark:bg-[#22c987] dark:text-[#042115]"
                      : "border-[#bdd7ca] bg-white dark:border-[#25664b] dark:bg-[#061811]"
                  }`}
                >
                  {checked ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl border border-[#d6ebe0] bg-[#f7fcfa] px-4 text-xs font-bold text-[#355447] transition hover:bg-[#eaf6f0] dark:border-[#1e5e44] dark:bg-[#0a261b] dark:text-[#bce2d0]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-10 cursor-pointer rounded-xl bg-gradient-to-b from-[#0e935f] to-[#076e46] px-5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function AccountSecurityModal({
  email,
  emailVerified,
  createdAtLabel,
  onClose,
  onOpenPassword,
  onOpenSessions,
}: {
  email: string;
  emailVerified: boolean;
  createdAtLabel: string;
  onClose: () => void;
  onOpenPassword: () => void;
  onOpenSessions: () => void;
}) {
  const t = useTranslations("StudentAccount.modals");
  const [revoking, setRevoking] = useState(false);
  const [revokedDone, setRevokedDone] = useState(false);

  async function handleRevokeOthers() {
    setRevoking(true);
    const res = await requestJson("DELETE", "/api/account/sessions?scope=others");
    setRevoking(false);
    if (res.ok) setRevokedDone(true);
  }

  return (
    <ModalShell
      title={t("securityTitle")}
      subtitle={t("securitySubtitle")}
      onClose={onClose}
    >
      <div className="space-y-3.5">
        <div className="rounded-2xl border border-[#d9eee3] bg-[#f6fbf8] p-4 dark:border-[#1c5c42] dark:bg-[#092319]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#567367] dark:text-[#8eb5a4]">
                {t("securityEmailLabel")}
              </p>
              <p className="mt-0.5 text-sm font-bold">{email}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                emailVerified
                  ? "bg-[#e3f7ec] text-[#0b7f51] dark:bg-[#103d2a] dark:text-[#4ade9b]"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              }`}
            >
              {emailVerified ? `✓ ${t("verifiedBadge")}` : t("unverifiedBadge")}
            </span>
          </div>
          <p className="mt-2.5 text-xs text-[#567367] dark:text-[#8eb5a4]">
            {t("securityCreatedInfo", { date: createdAtLabel })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenPassword}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#d6ebe0] bg-[#f8fcfa] p-4 text-left transition hover:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#0a261b] dark:hover:border-[#34eab0]"
          >
            <div>
              <p className="text-sm font-bold">{t("changePasswordAction")}</p>
              <p className="mt-0.5 text-xs text-[#567367] dark:text-[#8eb5a4]">
                {t("passwordProtectionHint")}
              </p>
            </div>
            <span className="text-lg text-[#0d8a59] dark:text-[#34eab0]">›</span>
          </button>

          <button
            type="button"
            onClick={onOpenSessions}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#d6ebe0] bg-[#f8fcfa] p-4 text-left transition hover:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#0a261b] dark:hover:border-[#34eab0]"
          >
            <div>
              <p className="text-sm font-bold">{t("sessionsTitle")}</p>
              <p className="mt-0.5 text-xs text-[#567367] dark:text-[#8eb5a4]">
                {t("viewDevicesHint")}
              </p>
            </div>
            <span className="text-lg text-[#0d8a59] dark:text-[#34eab0]">›</span>
          </button>
        </div>

        <div className="rounded-2xl border border-[#d9eee3] bg-[#f6fbf8] p-4 dark:border-[#1c5c42] dark:bg-[#092319]">
          <p className="text-sm font-bold">{t("signOutOthersTitle")}</p>
          <p className="mt-1 text-xs text-[#567367] dark:text-[#8eb5a4]">
            {t("signOutOthersDesc")}
          </p>
          {revokedDone ? (
            <p className="mt-3 text-xs font-bold text-[#0c8555] dark:text-[#4ade9b]">
              ✓ {t("signOutOthersSuccess")}
            </p>
          ) : (
            <button
              type="button"
              disabled={revoking}
              onClick={handleRevokeOthers}
              className="mt-3 cursor-pointer rounded-xl border border-[#0e935f]/35 bg-white px-4 py-2 text-xs font-bold text-[#0b7e50] transition hover:bg-[#e7f7ef] disabled:opacity-60 dark:border-[#34eab0]/35 dark:bg-[#0d3022] dark:text-[#5ef0b6]"
            >
              {revoking ? t("saving") : t("signOutOthersBtn")}
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

export function ActiveSessionsModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("StudentAccount.modals");
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ ok: boolean; sessions: SessionItem[] }>("/api/account/sessions").then(
      (res) => {
        if (!active) return;
        if (res.ok) setSessions(res.data.sessions);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  async function revokeOne(id: string) {
    setBusyId(id);
    const res = await requestJson(
      "DELETE",
      `/api/account/sessions?sessionId=${encodeURIComponent(id)}`,
    );
    setBusyId(null);
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function revokeOthers() {
    setBusyId("others");
    const res = await requestJson("DELETE", "/api/account/sessions?scope=others");
    setBusyId(null);
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    }
  }

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <ModalShell
      title={t("sessionsTitle")}
      subtitle={t("sessionsSubtitle")}
      onClose={onClose}
    >
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2.5 py-3">
            <div className="h-16 animate-pulse rounded-2xl bg-[#eaf6f0] dark:bg-[#0c2b1f]" />
            <div className="h-16 animate-pulse rounded-2xl bg-[#eaf6f0] dark:bg-[#0c2b1f]" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#567367] dark:text-[#8eb5a4]">
            {t("noSessions")}
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d9eee3] bg-[#f7fcfa] p-4 dark:border-[#1c5c42] dark:bg-[#092319]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f7ee] text-[#0b8455] dark:bg-[#103b29] dark:text-[#34eab0]">
                  {s.isMobile ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                      <path d="M12 18h.01" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="14" x="2" y="3" rx="2" />
                      <line x1="8" x2="16" y1="21" y2="21" />
                      <line x1="12" x2="12" y1="17" y2="21" />
                    </svg>
                  )}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{s.deviceLabel}</span>
                    {s.isCurrent ? (
                      <span className="rounded-full bg-[#e2f7ec] px-2.5 py-0.5 text-[11px] font-bold text-[#0b7f51] dark:bg-[#11422e] dark:text-[#4ade9b]">
                        {t("currentDevice")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-[#567367] dark:text-[#8eb5a4]">
                    {s.ipAddress ? `${s.ipAddress} · ` : ""}
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {!s.isCurrent ? (
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => revokeOne(s.id)}
                  className="cursor-pointer rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
                >
                  {t("revokeBtn")}
                </button>
              ) : null}
            </div>
          ))
        )}

        {otherCount > 0 ? (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={busyId === "others"}
              onClick={revokeOthers}
              className="cursor-pointer rounded-xl border border-[#0e935f]/35 bg-[#effaf4] px-4 py-2 text-xs font-bold text-[#0b7f51] transition hover:bg-[#e1f5ea] disabled:opacity-60 dark:border-[#34eab0]/35 dark:bg-[#0c2d20] dark:text-[#4ade9b]"
            >
              {t("signOutOthersBtn")}
            </button>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("StudentAccount.modals");
  const errorText = useErrorText();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!currentPassword || !newPassword) {
      setError(errorText("FIELD_REQUIRED") ?? "Required");
      return;
    }
    if (newPassword.length < 8) {
      setError(errorText("PASSWORD_TOO_SHORT") ?? "Too short");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSaving(true);
    const res = await postJson<{ ok: boolean }>("/api/auth/change-password", {
      currentPassword,
      newPassword,
    });
    setSaving(false);
    if (!res.ok) {
      setError(errorText(res.error) ?? t("photoError"));
      return;
    }
    setDone(true);
  }

  return (
    <ModalShell
      title={t("passwordModalTitle")}
      subtitle={t("passwordModalSubtitle")}
      onClose={onClose}
    >
      {done ? (
        <div className="space-y-4 py-2 text-center">
          <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-[#e3f7ec] text-xl font-bold text-[#0b8455] dark:bg-[#103d2a] dark:text-[#4ade9b]">
            ✓
          </div>
          <p className="text-sm font-bold">{t("passwordUpdatedSuccess")}</p>
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl bg-[#0d8a59] px-6 text-xs font-bold text-white"
          >
            {t("close")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error ? <FormAlert>{error}</FormAlert> : null}

          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("currentPassword")}
            </label>
            <input
              type={showPass ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm outline-none focus:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("newPassword")}
            </label>
            <input
              type={showPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm outline-none focus:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">
              {t("confirmPassword")}
            </label>
            <input
              type={showPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3.5 text-sm outline-none focus:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white dark:focus:border-[#34eab0]"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#547064] dark:text-[#8eb5a4]">
            <input
              type="checkbox"
              checked={showPass}
              onChange={(e) => setShowPass(e.target.checked)}
              className="accent-[#0e935f]"
            />
            <span>{t("showPasswords")}</span>
          </label>

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
              {saving ? t("saving") : t("updatePasswordBtn")}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

export function WeeklyPassModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const t = useTranslations("StudentAccount.modals");

  return (
    <ModalShell
      title={t("weeklyPassModalTitle")}
      subtitle={t("weeklyPassModalSubtitle")}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <ManualCardPaymentBox
        purpose="WEEKLY_APPLY_PASS"
        amountUzs={5000}
        onSubmitted={onSubmitted}
      />
    </ModalShell>
  );
}
