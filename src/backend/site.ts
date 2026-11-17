/** Saytdagi real aloqa ma'lumotlari (soxta placeholder raqamlar yo'q). */
export const TELEGRAM_USERNAME = "candidator_uz";
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;
export const TELEGRAM_HANDLE = `@${TELEGRAM_USERNAME}`;

const rawPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "";
export const PHONE_DISPLAY = rawPhone || null;
export const PHONE_URL = rawPhone
  ? `tel:${rawPhone.replace(/[^+\d]/g, "")}`
  : null;

export const EMAIL = "info@candidator.uz";
export const EMAIL_URL = `mailto:${EMAIL}`;

/** Footer dagi "Sayt DENJI tomonidan ishlab chiqilgan" havolasi. */
export const DEVELOPER_URL =
  "https://portfolio-website-drab-two-89.vercel.app/";
