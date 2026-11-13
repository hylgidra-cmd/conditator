import "server-only";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@/backend/http/errors";

/** Logo hajmi chegarasi. */
export const LOGO_MAX_BYTES = 1_000_000;

// Ruxsat etilgan turlar fayl boshidagi baytlar bo'yicha aniqlanadi (nom va
// brauzer yuborgan Content-Type ga ishonilmaydi). SVG ataylab yo'q: ichida skript bo'lishi mumkin.
const TYPES = [
  {
    ext: "png",
    mime: "image/png",
    match: (b: Buffer) =>
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "jpg",
    mime: "image/jpeg",
    match: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "webp",
    mime: "image/webp",
    match: (b: Buffer) =>
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
] as const;

/** Fayl nomi faqat server yaratgan ko'rinishda bo'lishi mumkin: path traversal yo'q. */
const STORED_NAME = /^[a-z0-9]+-[0-9a-f-]{36}\.(png|jpg|webp)$/;

function logoDir(): string {
  // Fayllar public/ da emas: faqat ruxsat tekshiradigan endpoint orqali beriladi.
  return path.resolve(process.env.UPLOAD_DIR || "data/uploads", "logos");
}

export function detectImageType(bytes: Buffer) {
  return TYPES.find((type) => type.match(bytes)) ?? null;
}

/** Logoni tekshiradi va Base64 data URL ko'rinishida saqlaydi (Vercel serverless muhitida ham ishlaydi). */
export async function storeLogo(
  _companyId: string,
  bytes: Buffer,
): Promise<string> {
  if (bytes.length > LOGO_MAX_BYTES) throw new ApiError(413, "FILE_TOO_LARGE");
  const type = detectImageType(bytes);
  if (!type) throw new ApiError(415, "FILE_TYPE_NOT_ALLOWED");

  return `data:${type.mime};base64,${bytes.toString("base64")}`;
}

function resolveStored(name: string): string {
  if (!STORED_NAME.test(name)) throw new Error("Noto'g'ri logo fayl nomi");
  return path.join(logoDir(), name);
}

export async function readLogo(
  name: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  if (name.startsWith("data:")) {
    const match =
      /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(name);
    if (!match) return null;
    return {
      mime: match[1],
      bytes: Buffer.from(match[2], "base64"),
    };
  }
  try {
    const bytes = await readFile(resolveStored(name));
    const type = detectImageType(bytes);
    return type ? { bytes, mime: type.mime } : null;
  } catch {
    return null;
  }
}

export async function removeLogo(name: string | null): Promise<void> {
  if (!name || name.startsWith("data:")) return;
  await rm(resolveStored(name), { force: true });
}
