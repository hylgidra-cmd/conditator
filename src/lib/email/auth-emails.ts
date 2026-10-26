import type { Lang } from "@prisma/client";
import { createTranslator } from "next-intl";
import en from "../../../messages/en.json";
import kk from "../../../messages/kk.json";
import ru from "../../../messages/ru.json";
import uz from "../../../messages/uz.json";
import { CODE_TTL_MS } from "@/lib/auth/email-code";
import { sendMail } from "./mailer";

const MESSAGES = { kk, uz, ru, en };

/** Parol tiklash kodini foydalanuvchi tilida emailga yuboradi. */
export async function sendResetEmail(
  to: string,
  locale: Lang,
  code: string,
): Promise<void> {
  const t = createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: "Email",
  });
  await sendMail({
    to,
    subject: t("reset.subject"),
    text: t("reset.body", { code, minutes: CODE_TTL_MS / 60_000 }),
  });
}
