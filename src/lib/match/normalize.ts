// Til va joylashuvni solishtirish uchun yagona ko'rinishga keltirish.
// Talab va CV istalgan 4 tilda yozilishi mumkin: "English", "Ingliz tili", "Английский", "Inglis tili".

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  қ: "q",
  л: "l",
  м: "m",
  н: "n",
  ң: "n",
  о: "o",
  ө: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ү: "u",
  ў: "o",
  ф: "f",
  х: "x",
  ҳ: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ә: "a",
  і: "i",
};

/** Kichik harf, kirill → lotin, diakritika va apostroflarsiz, faqat harf/raqam va bo'shliq. */
export function foldText(value: string): string {
  const lower = value.toLowerCase();
  let latin = "";
  for (const char of lower) latin += CYRILLIC[char] ?? char;
  return latin
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/['‘’ʻʼ`´]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// Kalit: yig'ilgan (foldText + qo'shimchasiz) shakl. Qiymat: ISO kod.
const LANGUAGE_ALIASES: Record<string, string[]> = {
  en: [
    "english",
    "ingliz",
    "inglizcha",
    "inglis",
    "angliyskiy",
    "angliyskiy yazik",
    "anglliyskiy",
  ],
  ru: ["russian", "rus", "ruscha", "russkiy", "orıs", "oris", "orischa"],
  uz: ["uzbek", "ozbek", "ozbekcha", "uzbekskiy", "ozbekshe"],
  kaa: [
    "karakalpak",
    "qoraqalpoq",
    "qaraqalpaq",
    "karakalpakskiy",
    "qoraqalpoqcha",
    "qaraqalpaqsha",
  ],
  kk: ["kazakh", "qozoq", "qazaq", "kazaxskiy", "qazaqsha", "qozoqcha"],
  tr: ["turkish", "turk", "turkcha", "turetskiy", "turkche"],
  de: ["german", "nemis", "nemischa", "nemetskiy", "deutsch"],
  fr: ["french", "fransuz", "fransuzcha", "frantsuzskiy"],
  ko: ["korean", "koreys", "koreyscha", "koreyskiy"],
  zh: ["chinese", "xitoy", "xitoycha", "kitayskiy", "qitay"],
  ja: ["japanese", "yapon", "yaponcha", "yaponskiy"],
  ar: ["arabic", "arab", "arabcha", "arabskiy"],
  tg: ["tajik", "tojik", "tojikcha", "tadjikskiy", "tadzhikskiy"],
};
const LANGUAGE_CODE = new Map<string, string>();
for (const [code, aliases] of Object.entries(LANGUAGE_ALIASES))
  for (const alias of aliases) LANGUAGE_CODE.set(alias, code);

// "tili", "tilı", "язык" (yazik), "dili" kabi qo'shimchalar olib tashlanadi.
const LANGUAGE_SUFFIX = /\s+(tili|tıli|dili|yazik|yazyk|language)$/;

/** Til nomi → kanonik kod ("Ingliz tili (B2)" → "en"). Noma'lum til o'z yig'ilgan shaklida qoladi. */
export function canonicalLanguage(name: string): string {
  const folded = foldText(name.replace(/\(.*?\)/g, ""))
    .replace(LANGUAGE_SUFFIX, "")
    .replace(/\s+(a[12]|b[12]|c[12])$/, "")
    .trim();
  return (
    LANGUAGE_CODE.get(folded) ??
    LANGUAGE_CODE.get(folded.split(" ")[0]) ??
    folded
  );
}

// Bir shaharning turli yozilishi (lotin, kirill, qoraqalpoqcha, inglizcha).
const PLACE_ALIASES: Record<string, string[]> = {
  nukus: ["nokis", "nukus"],
  tashkent: ["toshkent", "tashkent", "tashkient"],
  samarkand: ["samarqand", "samarkand"],
  bukhara: ["buxoro", "bukhara", "buhara", "buxara"],
  khorezm: ["xorazm", "khorezm", "horezm", "xorezm"],
  urgench: ["urganch", "urgench", "urgench"],
  karakalpakstan: [
    "qoraqalpogiston",
    "qaraqalpaqstan",
    "karakalpakstan",
    "karakalpakiya",
    "qoraqalpoq",
  ],
  andijan: ["andijon", "andijan"],
  namangan: ["namangan"],
  fergana: ["fargona", "fergana", "ferghana"],
  karshi: ["qarshi", "karshi"],
  termez: ["termiz", "termez"],
  navoi: ["navoiy", "navoi"],
  jizzakh: ["jizzax", "jizzakh", "djizak", "dzhizak"],
  gulistan: ["guliston", "gulistan"],
  khiva: ["xiva", "khiva", "hiva"],
  uzbekistan: ["ozbekiston", "uzbekistan", "ozbekstan"],
};
const PLACE_CODE = new Map<string, string>();
for (const [code, aliases] of Object.entries(PLACE_ALIASES))
  for (const alias of aliases) PLACE_CODE.set(alias, code);

/** Joylashuv → so'zlar to'plami (shahar nomlari yagona shaklda). */
export function placeTokens(value: string | null | undefined): Set<string> {
  const tokens = foldText(value ?? "")
    .split(" ")
    .filter((token) => token.length >= 3)
    .map((token) => PLACE_CODE.get(token) ?? token);
  return new Set(tokens);
}

// Mamlakat nomlari solishtirishda hisobga olinmaydi: "Nukus" va "Toshkent, O'zbekiston" mos emas.
const COUNTRY_TOKENS = new Set([
  "uzbekistan",
  "russia",
  "rossiya",
  "kazakhstan",
  "qazaqstan",
]);

/**
 * Talab joylashuvi CV joylashuviga mosmi: talabdagi biror shahar/hudud nomi CV da bo'lsa mos.
 * Talabda faqat mamlakat yozilgan bo'lsa, mamlakat bo'yicha solishtiriladi.
 */
export function locationMatches(
  vacancyLocation: string,
  cvLocation: string,
): boolean {
  const wanted = placeTokens(vacancyLocation);
  const have = placeTokens(cvLocation);
  const places = [...wanted].filter((token) => !COUNTRY_TOKENS.has(token));
  const required = places.length > 0 ? places : [...wanted];
  return required.some((token) => have.has(token));
}
