import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-border text-muted border-t py-6 text-center text-sm">
      {t("rights", { year: new Date().getFullYear() })}
    </footer>
  );
}
