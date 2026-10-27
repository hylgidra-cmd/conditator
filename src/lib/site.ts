/** Saytdagi aloqa ma'lumotlari va tariflar (bitta joyda). Header, footer va "Aloqa" bo'limi shu yerdan oladi. */
export const TELEGRAM_USERNAME = "gulginamann";
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;
export const TELEGRAM_HANDLE = `@${TELEGRAM_USERNAME}`;
export const PHONE_DISPLAY = "+998 97 594 11 19";
export const PHONE_URL = "tel:+998975941119";
export const EMAIL = "gulgina.erejepova@gmail.com";
export const EMAIL_URL = `mailto:${EMAIL}`;
/** Footer dagi "Sayt DENJI tomonidan ishlab chiqilgan" havolasi. */
export const DEVELOPER_URL =
  "https://portfolio-website-drab-two-89.vercel.app/";

/** Kompaniya hajmi bo'yicha narxlar (USD). To'lov davri hali tasdiqlanmagan. */
export const PRICING_TIERS = [
  { range: "30-50", price: 79 },
  { range: "50-100", price: 109 },
  { range: "100-300", price: 149 },
  { range: "300-1000", price: 299 },
  { range: "1000-5000", price: 499 },
] as const;

export function formatUsd(amount: number): string {
  return `$${amount}`;
}
