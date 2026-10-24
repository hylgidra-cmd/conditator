// Barcha tarjima fayllarida kalitlar bir xil ekanini va bo'sh qiymat yo'qligini tekshiradi.
// Ishga tushirish: npm run check:i18n
import { readFileSync } from "node:fs";

const LOCALES = ["kk", "uz", "ru", "en"];
const BASE = "uz";

function flatten(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === "object"
      ? flatten(value, path)
      : [[path, value]];
  });
}

const files = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    new Map(
      flatten(JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"))),
    ),
  ]),
);

let errors = 0;
const baseKeys = [...files[BASE].keys()];

for (const locale of LOCALES) {
  const keys = files[locale];
  for (const key of baseKeys) {
    if (!keys.has(key)) {
      console.error(`[${locale}] kalit yo'q: ${key}`);
      errors++;
    } else if (String(keys.get(key)).trim() === "") {
      console.error(`[${locale}] bo'sh qiymat: ${key}`);
      errors++;
    }
  }
  for (const key of keys.keys()) {
    if (!files[BASE].has(key)) {
      console.error(
        `[${locale}] ortiqcha kalit (${BASE}.json da yo'q): ${key}`,
      );
      errors++;
    }
  }
  const status = keys.get("_meta.status");
  if (status !== "reviewed")
    console.warn(`[${locale}] tarjima holati: ${status}`);
}

if (errors > 0) {
  console.error(`\n${errors} ta xato topildi.`);
  process.exit(1);
}
console.log(`OK: ${LOCALES.length} til, ${baseKeys.length} ta kalit.`);
