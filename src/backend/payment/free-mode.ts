/**
 * Vaqtinchalik bepul rejim (foydalanuvchilar to'plash davri).
 * Pulli CV va kompaniya obunalarini qayta yoqish uchun muhitda
 * `NEXT_PUBLIC_PAID_MODE=true` qiymatini o'rnatish kifoya.
 */
export const FREE_ACCESS_MODE = process.env.NEXT_PUBLIC_PAID_MODE !== "true";
