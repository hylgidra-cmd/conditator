import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";

export function SiteHeader() {
  const t = useTranslations("Header");

  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          aria-label={t("homeAria")}
          className="text-brand shrink-0 text-lg font-bold whitespace-nowrap"
        >
          {t("brand")}
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
