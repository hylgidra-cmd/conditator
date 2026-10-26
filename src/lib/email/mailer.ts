import nodemailer, { type Transporter } from "nodemailer";
import { emailConfigured, emailFrom, serverEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/errors";

export type MailMessage = { to: string; subject: string; text: string };

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const env = serverEnv();
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
    logger: false, // xat matni (va undagi kod) logga tushmasligi uchun
  });
  return transporter;
}

/** Resend HTTP API (Vercel serverless da SMTP o'rniga). Javob matni logga yozilmaydi. */
async function sendWithResend(
  apiKey: string,
  from: string,
  message: MailMessage,
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, ...message }),
  });
  if (!response.ok) {
    throw new Error(`Resend xat yubormadi: HTTP ${response.status}`);
  }
}

export async function sendMail(message: MailMessage): Promise<void> {
  const from = emailFrom();
  if (!emailConfigured() || !from) throw new ApiError(503, "EMAIL_UNAVAILABLE");
  const apiKey = serverEnv().RESEND_API_KEY;
  if (apiKey) return sendWithResend(apiKey, from, message);
  await getTransporter().sendMail({ from, ...message });
}
