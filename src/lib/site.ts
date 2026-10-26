/**
 * Saytdagi aloqa ma'lumotlari va tariflar (bitta joyda).
 * [..] ichidagi qiymatlar to'ldirilishi kerak bo'lgan joy egalari: ishga tushirishdan oldin almashtiring.
 */
export const TELEGRAM_USERNAME = "[TELEGRAM_USERNAME]";
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;

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
