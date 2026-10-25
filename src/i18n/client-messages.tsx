import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

// Brauzerga faqat shu bo'lim komponentlariga kerakli tarjimalar yuboriladi (har sahifada hammasi emas).
// Barcha sahifalarda: sarlavha, til tanlash, xato matnlari va forma tugmasi (SubmitButton).
const COMMON = ["Header", "LocaleSwitcher", "Errors", "Form"];

export async function ClientMessages({
  namespaces,
  children,
}: {
  namespaces: string[];
  children: ReactNode;
}) {
  const all = (await getMessages()) as Record<string, unknown>;
  const messages = Object.fromEntries(
    [...COMMON, ...namespaces]
      .filter((key) => key in all)
      .map((key) => [key, all[key]]),
  );
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
