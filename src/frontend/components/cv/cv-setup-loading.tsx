"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  onDone: () => void;
};

export function CvSetupLoading({ onDone }: Props) {
  const t = useTranslations("StudentCv.onboarding");
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(2), 500);
    const t2 = setTimeout(() => setActiveStep(3), 1100);
    const t3 = setTimeout(() => {
      setActiveStep(4);
      setTimeout(onDone, 400);
    }, 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const steps = [
    { id: 1, label: t("loadingStep1") },
    { id: 2, label: t("loadingStep2") },
    { id: 3, label: t("loadingStep3") },
  ];

  return (
    <div className="mx-auto flex min-h-[460px] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="border-border bg-surface w-full space-y-8 rounded-3xl border p-10 shadow-lg">
        <div>
          <h2 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
            {t("loadingTitle")}
          </h2>
        </div>

        {/* Animated Brand Gears Graphic */}
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
          <div className="bg-brand/10 absolute inset-0 animate-pulse rounded-full blur-xl" />
          <div className="from-brand shadow-brand/30 relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr to-orange-400 text-white shadow-xl">
            <svg
              className="h-12 w-12 animate-spin text-white"
              style={{ animationDuration: "6s" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        {/* Step by step checklist with checkmarks */}
        <div className="mx-auto max-w-xs space-y-3.5 text-left">
          {steps.map((s) => {
            const isDone = activeStep > s.id;
            const isCurrent = activeStep === s.id;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  isCurrent || isDone ? "opacity-100" : "opacity-35"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-brand text-brand-foreground animate-pulse"
                        : "border-border text-muted border"
                  }`}
                >
                  {isDone ? "✓" : s.id}
                </div>
                <span
                  className={`text-sm font-medium ${isDone ? "text-foreground font-semibold" : "text-muted"}`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
