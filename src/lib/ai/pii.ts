// Shaxsiy ma'lumotni AI ga yuborishdan oldin olib tashlash.
// Qoida: telefon, email, to'liq ism va messenjer manzillari AI ga hech qachon ketmaydi.

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
const URL_CONTACT =
  /\b(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me|instagram\.com|facebook\.com|linkedin\.com\/in)\/[^\s,;]+/giu;
const HANDLE = /(^|[\s(,;:])@[\p{L}\p{N}_]{3,}/gu;
// +998 90 123-45-67, (90) 1234567, 901234567 ... 9 tadan ko'p raqamli ketma-ketlik (yillar oralig'i emas).
const PHONE_CANDIDATE = /\+?\(?\d[\d\s().-]{7,}\d/g;

// Formada ism bo'lmasa ham, talaba matnida o'zini tanishtirgan bo'lsa ("Ismim ...", "Меня зовут ...")
// shu iboradan keyingi 1-3 ta bosh harfli so'z ism deb olinadi va matnning hamma joyida yashiriladi.
const NAME_INTROS = [
  "ismim",
  "ism-familiyam",
  "ismi-sharifim",
  "atım",
  "atim",
  "меня зовут",
  "моё имя",
  "мое имя",
  "my name is",
];
const NAME_WORD = "\\p{Lu}[\\p{L}ʼ'‘’`-]*";
const anyCaseFirst = (intro: string) =>
  `[${intro[0].toUpperCase()}${intro[0]}]${intro.slice(1)}`;
const INTRODUCED_NAME = new RegExp(
  `(?<!\\p{L})(${NAME_INTROS.map(anyCaseFirst).join("|")})([\\s:,—–-]+)(${NAME_WORD}(?:\\s+${NAME_WORD}){0,2})`,
  "gu",
);

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

  const introduced: string[] = [];
  result = result.replace(INTRODUCED_NAME, (_match, intro, gap, name) => {
    introduced.push(name);
    return `${intro}${gap}[NAME]`;
  });

  // Formada kiritilgan va matnda tanishtirilgan ism-familiya so'zlari (2+ harf) matndan olib tashlanadi.
  const nameParts = [...extraNames, ...introduced]
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
