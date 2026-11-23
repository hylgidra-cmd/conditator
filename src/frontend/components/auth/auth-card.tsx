import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Reveal } from "@/frontend/components/ds/motion";

export async function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const t = await getTranslations("Landing.showcase");
  return (
    <div className="page-x font-ui max-w-5xl py-10 sm:py-16">
      <Reveal>
        <div className="border-line bg-card shadow-soft grid overflow-hidden rounded-xl border lg:grid-cols-[.9fr_1.1fr]">
          <div className="career-closing relative hidden flex-col justify-between p-10 text-white lg:flex">
            <div>
              <span className="text-xs font-extrabold tracking-[.2em] text-[#a8e6c8] uppercase">
                Candidator
              </span>
              <h2 className="mt-9 max-w-sm text-3xl leading-tight font-bold tracking-tight">
                {t("title")}
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
                {t("subtitle")}
              </p>
            </div>
            <div className="border-t border-white/20 pt-6">
              <div className="grid grid-cols-3 gap-4">
                {[t("studentStep1"), t("studentStep2"), t("studentStep3")].map(
                  (step, index) => (
                    <div key={step}>
                      <span className="text-xs font-bold text-[#a8e6c8]">
                        0{index + 1}
                      </span>
                      <p className="mt-2 text-xs leading-snug text-white/85">
                        {step}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md p-7 sm:p-10 lg:py-14">
            <h1 className="text-h2 text-text font-extrabold tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-subtle mt-2 text-sm">{subtitle}</p>
            ) : null}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
