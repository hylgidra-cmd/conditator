// Shaxsiy ma'lumotni AI ga yuborishdan oldin olib tashlash.
// Qoida: telefon, email, to'liq ism va messenjer manzillari AI ga hech qachon ketmaydi.

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
const URL_CONTACT =
  /\b(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me|instagram\.com|facebook\.com|linkedin\.com\/in)\/[^\s,;]+/giu;
const HANDLE = /(^|[\s(,;:])@[\p{L}\p{N}_]{3,}/gu;
// +998 90 123-45-67, (90) 1234567, 901234567 ... 9 tadan ko'p raqamli ketma-ketlik (yillar oralig'i emas).
const PHONE_CANDIDATE = /\+?\(?\d[\d\s().-]{7,}\d/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function redactPii(
  text: string,
  extraNames: Array<string | null | undefined> = [],
): string {
  let result = text
    .replace(EMAIL, "[EMAIL]")
    .replace(URL_CONTACT, "[CONTACT]")
    .replace(HANDLE, "$1[CONTACT]")
    .replace(PHONE_CANDIDATE, (match) =>
      match.replace(/\D/g, "").length >= 9 ? "[PHONE]" : match,
    );

  // Formada kiritilgan ism-familiya so'zlari (2+ harf) matndan olib tashlanadi.
  const nameParts = extraNames
    .flatMap((name) => (name ?? "").split(/\s+/))
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
  for (const part of nameParts) {
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{N}])${escapeRegExp(part)}(?![\\p{L}\\p{N}])`,
      "giu",
    );
    result = result.replace(pattern, "[NAME]");
  }
  return result;
}
