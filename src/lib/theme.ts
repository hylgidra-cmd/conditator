/** Rejim (yorug'/tungi) cookie si. Qiymat yo'q bo'lsa tizim sozlamasi ishlatiladi. */
export const THEME_COOKIE = "theme";

export type Theme = "light" | "dark";

export function parseTheme(value: string | undefined): Theme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}
