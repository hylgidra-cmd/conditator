"use client";

import { useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import { formatUsd } from "@/lib/site";

export type PricingLabels = {
  sizeLabel: string;
  period: string;
  includesTitle: string;
  includes: string[];
  cta: string;
  small: string;
  staff: string[];
};

/** Kompaniya hajmi tanlagichi: bitta narx paneli, besh xil karta emas. */
export function PricingSelector({
  tiers,
  labels,
}: {
  tiers: readonly { range: string; price: number }[];
  labels: PricingLabels;
}) {
  const [selected, setSelected] = useState(0);
  const name = useId();
  const tier = tiers[selected];

  return (
    <div className="border-border bg-surface rounded-lg border">
      <fieldset className="border-border border-b p-4 sm:p-6">
        <legend className="text-muted float-left mb-3 w-full text-sm font-medium">
          {labels.sizeLabel}
        </legend>
        <div className="bg-surface-muted grid grid-cols-3 gap-1 rounded-lg p-1 sm:grid-cols-5">
          {tiers.map((item, index) => (
            <label
              key={item.range}
              className={`has-[:focus-visible]:outline-brand cursor-pointer rounded-lg px-2 py-2.5 text-center text-sm font-medium tabular-nums transition-colors has-[:focus-visible]:outline-2 ${
                selected === index
                  ? "bg-surface text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={item.range}
                checked={selected === index}
                onChange={() => setSelected(index)}
                className="sr-only"
              />
              {item.range}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="p-4 sm:p-6" aria-live="polite">
        <p className="text-muted text-sm">{labels.staff[selected]}</p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
            {formatUsd(tier.price)}
          </span>
          <span className="text-muted text-sm">{labels.period}</span>
        </p>

        <h3 className="mt-6 text-sm font-semibold">{labels.includesTitle}</h3>
        <ul className="text-muted mt-3 space-y-2 text-sm">
          {labels.includes.map((item) => (
            <li key={item} className="flex gap-3">
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="text-brand mt-0.5 shrink-0"
              >
                <path
                  d="m3 8.5 3 3 7-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/register"
          className="bg-brand text-brand-foreground hover:bg-brand-strong mt-6 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 font-semibold transition-colors sm:w-auto"
        >
          {labels.cta}
        </Link>
        <p className="text-muted mt-4 text-sm">{labels.small}</p>
      </div>
    </div>
  );
}
