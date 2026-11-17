import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";

const LINK = cn(
  "border-line bg-card/85 text-text hover:border-primary/50 hover:bg-card-cool rounded-xl border px-3.5 py-2 text-xs font-bold shadow-soft transition-all active:scale-[0.97]",
  FOCUS_RING,
);

/** Server tomonda sahifalangan ro'yxat uchun oldingi/keyingi havolalari. */
export async function Pagination({
  page,
  pageCount,
  pathname,
  query = {},
}: {
  page: number;
  pageCount: number;
  pathname: string;
  query?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  const t = await getTranslations("Vacancies.pagination");
  const href = (target: number) => ({
    pathname,
    query: {
      ...Object.fromEntries(
        Object.entries(query).filter((entry): entry is [string, string] =>
          Boolean(entry[1]),
        ),
      ),
      page: String(target),
    },
  });
  return (
    <nav className="flex items-center justify-center gap-3 pt-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={LINK} rel="prev">
          {t("prev")}
        </Link>
      ) : null}
      <span className="border-line bg-card-cool/60 text-subtle rounded-xl border px-3.5 py-2 text-xs font-semibold tabular-nums">
        {t("page", { page, pageCount })}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={LINK} rel="next">
          {t("next")}
        </Link>
      ) : null}
    </nav>
  );
}
