/** Sinf nomlarini birlashtiradi, boʻsh qiymatlarni tashlab yuboradi. */
export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Barcha bosiladigan elementlar uchun bir xil fokus halqasi (ikkala rejimda 3:1 dan yuqori). */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
