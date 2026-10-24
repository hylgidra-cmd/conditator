import type messages from "../messages/uz.json";
import type { routing } from "./i18n/routing";

// Tarjima kalitlari tiplanadi: mavjud bo'lmagan kalit TypeScript xatosi beradi.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
