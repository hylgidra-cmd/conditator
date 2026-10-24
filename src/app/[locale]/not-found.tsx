import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <Link href="/" className="text-brand mt-6 inline-block underline">
        {t("back")}
      </Link>
    </div>
  );
}
