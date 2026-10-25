import { NextRequest } from "next/server";
import { sentMails } from "./mail-outbox";

export function jsonRequest(
  path: string,
  body: unknown,
  init: {
    cookie?: string;
    ip?: string;
    method?: "POST" | "PUT" | "PATCH";
  } = {},
) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": init.ip ?? "10.0.0.1",
      ...(init.cookie ? { cookie: init.cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

export function getRequest(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

/** Javobdagi Set-Cookie dan sessiya cookie sini "nom=qiymat" ko'rinishida oladi. */
export function sessionCookie(response: Response): string | undefined {
  const header = response.headers.get("set-cookie");
  return header?.split(";")[0];
}

/** Oxirgi xatdagi 6 xonali kod (kod faqat xatda bo'ladi). */
export function lastMailedCode(): string {
  const mail = sentMails.at(-1);
  const code = mail?.text.match(/\b(\d{6})\b/)?.[1];
  if (!code) throw new Error("Xatda kod topilmadi");
  return code;
}
