export type CompanyPlanId = "START_7" | "STANDARD_15" | "PRO_30";

export type CompanySubscriptionPlan = {
  id: CompanyPlanId;
  name: string;
  days: number;
  priceUzs: number;
  badge: string;
  recommended?: boolean;
  tagline: string;
  features: readonly string[];
};

export const COMPANY_SUBSCRIPTION_PLANS: readonly CompanySubscriptionPlan[] = [
  {
    id: "START_7",
    name: "Start",
    days: 7,
    priceUzs: 14_900,
    badge: "Tezkor",
    tagline: "1 hafta davomida tezkor xodim topish uchun",
    features: [
      "Barcha CV larning telefon, Telegram va emaillari ochiladi",
      "Barcha nomzodlar CV sini PDF formatda yuklab olish",
      "AI CV baholash va moslik tahlili",
    ],
  },
  {
    id: "STANDARD_15",
    name: "Standart",
    days: 15,
    priceUzs: 29_000,
    badge: "Ommabop",
    tagline: "2 haftalik to'liq obuna — faol ishga olish uchun",
    features: [
      "15 kun cheksiz barcha CV lar va kontaktlarni ko'rish",
      "Barcha 🌟 Mukammal (80–100%) CV lar va PDF yuklash",
      "Nomzodlar bilan to'g'ridan-to'g'ri chat va saralash",
    ],
  },
  {
    id: "PRO_30",
    name: "Pro Oylik",
    days: 30,
    priceUzs: 49_000,
    badge: "Eng foydali",
    recommended: true,
    tagline: "1 oy davomida cheksiz xodim topish — eng tejamkor tarif",
    features: [
      "30 kun cheksiz barcha CV lar, telefon/Telegram va PDF lar",
      "Barcha 🌟 Mukammal (80–100%) nomzodlar + cheksiz AI saralash",
      "Nomzodlar bilan chat, bosqichlar va ustuvor qo'llab-quvvatlash",
    ],
  },
] as const;

export const DEFAULT_COMPANY_PLAN_ID: CompanyPlanId = "STANDARD_15";

export function getCompanySubscriptionPlan(
  planId?: string | null,
): CompanySubscriptionPlan {
  const found = COMPANY_SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  return found ?? COMPANY_SUBSCRIPTION_PLANS[1];
}
