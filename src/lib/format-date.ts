// Sana "dd.MM.yyyy HH:mm" ko'rinishida, O'zbekiston vaqtida (UTC+5, yozgi vaqt yo'q).
// Intl ishlatilmaydi: Node va brauzerning ICU ma'lumotlari "uz"/"kk" uchun turlicha
// natija beradi va bu hydration xatosiga olib keladi.
const UZ_OFFSET_MS = 5 * 60 * 60 * 1000;

export function formatDateTime(value: Date | string): string {
  const date = new Date(new Date(value).getTime() + UZ_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  );
}
