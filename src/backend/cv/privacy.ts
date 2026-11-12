import type { CvData } from "./schema";

export type CvPrivacySettings = {
  hideName?: boolean;
  hidePhone?: boolean;
  hideEmail?: boolean;
  hideAddress?: boolean;
  hidePhoto?: boolean;
};

export const DEFAULT_CV_PRIVACY: Required<CvPrivacySettings> = {
  hideName: false,
  hidePhone: false,
  hideEmail: false,
  hideAddress: false,
  hidePhoto: false,
};

export function parsePrivacy(
  privacyJson: unknown,
): Required<CvPrivacySettings> {
  if (typeof privacyJson === "object" && privacyJson !== null) {
    const p = privacyJson as Record<string, unknown>;
    return {
      hideName: Boolean(p.hideName),
      hidePhone: Boolean(p.hidePhone),
      hideEmail: Boolean(p.hideEmail),
      hideAddress: Boolean(p.hideAddress),
      hidePhoto: Boolean(p.hidePhoto),
    };
  }
  return { ...DEFAULT_CV_PRIVACY };
}

/**
 * Mask sensitive string (e.g., "+998 90 123 45 67" -> "+998 90 *** ** 67").
 */
export function maskContact(val: string | null | undefined): string {
  if (!val) return "—";
  const str = val.trim();
  if (str.length <= 4) return "****";
  const first = str.slice(0, 3);
  const last = str.slice(-2);
  return `${first}******${last}`;
}

export function maskName(fullName: string | null | undefined): string {
  if (!fullName) return "Nomzod";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0][0]}***`;
  }
  return `${parts[0]} ${parts[1][0]}.`;
}

/**
 * Server-side redaction for CV data:
 * Ensures sensitive information never leaves the server if hidden by student
 * or if contact details are locked behind payment (for 80-100% matched candidates).
 */
export function sanitizeCvData(
  data: CvData,
  options: {
    privacy?: CvPrivacySettings;
    isLocked?: boolean;
    isOwnerOrAdmin?: boolean;
  },
): CvData {
  if (options.isOwnerOrAdmin) {
    return data;
  }

  const privacy = options.privacy ?? DEFAULT_CV_PRIVACY;
  const isLocked = Boolean(options.isLocked);

  const shouldHideName = isLocked || privacy.hideName;
  const shouldHidePhone = isLocked || privacy.hidePhone;
  const shouldHideEmail = isLocked || privacy.hideEmail;
  const shouldHideAddress = isLocked || privacy.hideAddress;

  return {
    ...data,
    fullName: shouldHideName
      ? isLocked
        ? "Nomzod (qulflangan)"
        : maskName(data.fullName)
      : data.fullName,
    location: shouldHideAddress ? "Yashirin hudud" : data.location,
    contact: {
      email: shouldHideEmail
        ? isLocked
          ? "qulflangan@candidator.uz"
          : maskContact(data.contact.email)
        : data.contact.email,
      phone: shouldHidePhone
        ? isLocked
          ? "+998 ** *** ** **"
          : maskContact(data.contact.phone)
        : data.contact.phone,
    },
  };
}
