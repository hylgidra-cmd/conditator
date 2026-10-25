// Yuklama skriptlari faqat lokal dev bazada ishlaydi. Production yoki boshqa server bazasida to'xtaydi.
export function assertDevDatabase(): string {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.NODE_ENV === "production")
    throw new Error("NODE_ENV=production: yuklama skripti ishlamaydi");
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  if (!["localhost", "127.0.0.1", "db"].includes(host))
    throw new Error(
      `Faqat lokal baza (localhost/db) ruxsat etiladi, hozir: "${host || "noma'lum"}"`,
    );
  if (!/load/.test(new URL(url).pathname))
    throw new Error(
      "Bazaning nomida 'load' bo'lsin (masalan jumis_load): dev ma'lumotlari aralashmasin",
    );
  return url;
}
