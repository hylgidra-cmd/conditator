"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  COMPANY_SUBSCRIPTION_PLANS,
  type CompanyPlanId,
} from "@/backend/payment/plans";
import { CheckIcon, SparkIcon } from "@/frontend/components/icons";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";

type PlansProps = {
  vacancyId?: string;
  cvId?: string;
  defaultPlanId?: CompanyPlanId;
  compact?: boolean;
  onSubmitted?: () => void;
};

export function CompanySubscriptionPlans({
  vacancyId,
  cvId,
  defaultPlanId = "PRO_30",
  compact = false,
  onSubmitted,
}: PlansProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<CompanyPlanId>(defaultPlanId);
  const selectedPlan =
    COMPANY_SUBSCRIPTION_PLANS.find((p) => p.id === selectedId) ??
    COMPANY_SUBSCRIPTION_PLANS[2];

  return (
    <div className="space-y-5">
      <div
        className={`grid gap-3 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"}`}
      >
        {COMPANY_SUBSCRIPTION_PLANS.map((plan) => {
          const active = plan.id === selectedId;
          const priceLabel = `${plan.priceUzs.toLocaleString("en-US")} so'm`;
          const durationLabel = `${plan.days} kun`;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedId(plan.id)}
              className={`relative flex cursor-pointer flex-col justify-between rounded-3xl border p-4 text-left transition-all duration-200 ${
                active
                  ? "border-primary bg-primary-soft/55 ring-primary/25 shadow-float ring-2"
                  : "border-line bg-card hover:border-primary/50 shadow-soft"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text text-sm font-black">
                    {plan.name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      plan.recommended
                        ? "bg-primary text-on-primary shadow-primary"
                        : "border-line bg-canvas text-subtle border"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-text text-xl font-black tracking-tight">
                    {priceLabel}
                  </span>
                  <span className="text-subtle text-xs font-bold">
                    {`/ ${durationLabel}`}
                  </span>
                </div>

                <p className="text-subtle text-[11px] leading-relaxed">
                  {plan.tagline}
                </p>

                {!compact ? (
                  <ul className="space-y-1.5 pt-2">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="text-text flex items-start gap-2 text-[11px] font-medium leading-snug"
                      >
                        <CheckIcon
                          size={13}
                          className="text-primary mt-0.5 shrink-0"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="mt-4 pt-2">
                <span
                  className={`inline-flex w-full items-center justify-center rounded-xl px-3 py-1.5 text-xs font-extrabold transition-colors ${
                    active
                      ? "bg-primary text-on-primary"
                      : "border-line bg-canvas text-text border"
                  }`}
                >
                  {active ? "✓ Tanlandi" : "Tanlash"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-line/70 border-t pt-4">
        <ManualCardPaymentBox
          key={selectedPlan.id}
          purpose="VACANCY_UNLOCK"
          planId={selectedPlan.id}
          amountUzs={selectedPlan.priceUzs}
          vacancyId={vacancyId}
          cvId={cvId}
          title={`Tanlangan tarif: ${selectedPlan.name} (${selectedPlan.days} kun — ${selectedPlan.priceUzs.toLocaleString("en-US")} so'm)`}
          description="To'lovni pastdagi kartaga o'tkazing va chek skrinshotini yuklang. Admin tasdiqlagach obuna avtomatik faollashadi."
          onSubmitted={() => {
            router.refresh();
            onSubmitted?.();
          }}
        />
      </div>
    </div>
  );
}

type ButtonProps = {
  label?: string;
  vacancyId?: string;
  cvId?: string;
  variant?: "primary" | "compact" | "dark";
  className?: string;
};

export function CompanySubscribeButton({
  label = "🔓 Obuna sotib olish",
  vacancyId,
  cvId,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const [open, setOpen] = useState(false);

  const btnClasses =
    variant === "compact"
      ? "bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all active:scale-[0.98]"
      : variant === "dark"
        ? "inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
        : "bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${btnClasses} ${className}`}
      >
        <SparkIcon size={14} />
        <span>{label}</span>
      </button>

      {open ? (
        <div
          className="ds-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="ds-modal-panel border-line bg-card shadow-float max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-3xl border p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-text text-lg font-black sm:text-xl">
                  {"Kompaniya Obunasi — Tarifni tanlang"}
                </h3>
                <p className="text-subtle mt-1 text-xs leading-relaxed">
                  {
                    "Faol obuna bilan barcha nomzodlarning to'liq ismi, telefon raqami, Telegram, emaili, PDF rezyumesi, chat va AI saralash darhol ochiladi."
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-subtle hover:text-text cursor-pointer text-xl font-bold"
              >
                {"✕"}
              </button>
            </div>

            <CompanySubscriptionPlans
              vacancyId={vacancyId}
              cvId={cvId}
              compact
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
