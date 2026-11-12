import { defineRouting } from "next-intl/routing";

// "kk" — qoraqalpoq tili (loyiha kelishuvi bo'yicha). Diqqat: ISO standartida
// "kk" qozoq tilini bildiradi, qoraqalpoqniki "kaa". Shuning uchun brauzer tilini
// avtomatik aniqlash o'chirilgan (localeDetection: false).
export const routing = defineRouting({
  locales: ["kk", "uz", "ru", "en"],
  defaultLocale: "kk",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
