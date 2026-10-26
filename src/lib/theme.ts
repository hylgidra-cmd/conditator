/**
 * Rejim (yorugʻ/tungi). Tanlov ikki joyda saqlanadi:
 * - localStorage (`THEME_STORAGE_KEY`): asosiy manba, <head> dagi skript birinchi chizishdan oldin oʻqiydi;
 * - cookie (`THEME_COOKIE`): server HTML ga data-theme ni oldindan qoʻyadi (localStorage bloklangan boʻlsa ham miltillamaydi).
 * Qiymat yoʻq boʻlsa tizim sozlamasi (prefers-color-scheme) CSS orqali ishlaydi.
 */
export const THEME_COOKIE = "theme";
export const THEME_STORAGE_KEY = "jumis-theme";

export type Theme = "light" | "dark";

export function parseTheme(
  value: string | null | undefined,
): Theme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}

/** <head> ga qoʻyiladigan kichik skript: sahifa chizilishidan oldin saqlangan rejimni qoʻyadi. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark")return;var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t}catch(e){}})();`;

/** Tanlangan rejimni qoʻllaydi va saqlaydi. localStorage ishlamasa (yashirin rejim, bloklangan) cookie yetarli. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage mavjud emas: faqat cookie.
  }
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}
