"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { buttonClass } from "@/frontend/components/ds/button";
import { Link } from "@/i18n/navigation";

export default function LocaleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorBoundary");

  useEffect(() => {
    console.error("Locale boundary error:", error.message);
  }, [error]);

  return (
    <div className="page-x flex min-h-[60vh] items-center justify-center py-16">
      <div className="border-line bg-card/90 shadow-float relative max-w-md rounded-3xl border p-8 text-center backdrop-blur-xl sm:p-10">
        <p className="text-primary-text text-xs font-extrabold tracking-widest uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-ui text-text mt-2 text-2xl font-extrabold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-subtle mt-2 text-sm leading-relaxed">
          {t("description")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className={buttonClass({ variant: "primary", size: "md" })}
          >
            {t("retry")}
          </button>
          <Link
            href="/"
            className={buttonClass({ variant: "outline", size: "md" })}
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
