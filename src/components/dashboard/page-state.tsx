import { getTranslations } from "next-intl/server";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { Link } from "@/i18n/navigation";

export const PAGE_STATES = ["filled", "empty", "loading"] as const;
export type PageState = (typeof PAGE_STATES)[number];

export function parseState(value: string | string[] | undefined): PageState {
  return value === "empty" || value === "loading" ? value : "filled";
}

/** Demo uchun: sahifani maʼlumot bilan, boʻsh yoki yuklanish holatida koʻrsatish (?state=). */
export async function StateSwitcher({
  href,
  current,
  states = PAGE_STATES,
}: {
  href: string;
  current: PageState;
  states?: readonly PageState[];
}) {
  const t = await getTranslations("Dashboard.states");
  return (
    <nav
      aria-label={t("label")}
      className="mt-10 flex flex-wrap items-center gap-2 text-sm"
    >
      <span className="text-subtle mr-1">{t("label")}</span>
      {states.map((s) => (
        <Link
          key={s}
          href={s === "filled" ? href : { pathname: href, query: { state: s } }}
          aria-current={s === current ? "true" : undefined}
          className={cn(
            "border-line rounded-full border px-3 py-1 font-medium",
            s === current
              ? "bg-ink text-on-ink border-ink"
              : "bg-card hover:border-ink",
            FOCUS_RING,
          )}
        >
          {t(s)}
        </Link>
      ))}
    </nav>
  );
}
