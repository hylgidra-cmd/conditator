import nodemailer, { type Transporter } from "nodemailer";
import { serverEnv } from "@/lib/env";

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

export async function sendMail(message: MailMessage): Promise<void> {
  await getTransporter().sendMail({ from: serverEnv().SMTP_FROM, ...message });
}
