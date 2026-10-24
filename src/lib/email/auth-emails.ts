import type { EmailCodePurpose, Lang } from "@prisma/client";
import { createTranslator } from "next-intl";
import en from "../../../messages/en.json";
import kk from "../../../messages/kk.json";
import ru from "../../../messages/ru.json";
import uz from "../../../messages/uz.json";
import { CODE_TTL_MS } from "@/lib/auth/email-code";
import { sendMail } from "./mailer";

const MESSAGES = { kk, uz, ru, en };

/** Tasdiqlash yoki parol tiklash kodini foydalanuvchi tilida emailga yuboradi. */
export async function sendCodeEmail(
  to: string,
  locale: Lang,
  purpose: EmailCodePurpose,
  code: string,
): Promise<void> {
  const t = createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: "Email",
  });
  const kind = purpose === "VERIFY" ? "verify" : "reset";
  await sendMail({
    to,
    subject: t(`${kind}.subject`),
    text: t(`${kind}.body`, { code, minutes: CODE_TTL_MS / 60_000 }),
  });
}
