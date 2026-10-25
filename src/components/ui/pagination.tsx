import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const LINK = "border-border rounded-lg border px-3 py-1.5 text-sm font-medium";

/** Server tomonda sahifalangan ro'yxat uchun oldingi/keyingi havolalari. */
export async function Pagination({
  page,
  pageCount,
  pathname,
}: {
  page: number;
  pageCount: number;
  pathname: string;
}) {
  if (pageCount <= 1) return null;
  const t = await getTranslations("Vacancies.pagination");
  const href = (target: number) => ({
    pathname,
    query: { page: String(target) },
  });
  return (
    <nav className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={LINK} rel="prev">
          {t("prev")}
        </Link>
      ) : null}
      <span className="text-muted text-sm">
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
