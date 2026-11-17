import { useTranslations } from "next-intl";
import { buttonClass } from "@/frontend/components/ds/button";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <div className="page-x flex min-h-[65vh] items-center justify-center py-16">
      <div className="border-line bg-card/85 shadow-float relative max-w-md overflow-hidden rounded-3xl border p-8 text-center backdrop-blur-xl sm:p-10">
        <div
          aria-hidden
          className="bg-primary/15 pointer-events-none absolute -top-20 left-1/2 size-48 -translate-x-1/2 rounded-full blur-3xl"
        />
        <p className="font-ui text-gradient-blue relative text-6xl font-black tracking-tighter">
          {404}
        </p>
        <h1 className="font-ui text-text relative mt-3 text-xl font-extrabold sm:text-2xl">
          {t("title")}
        </h1>
        <div className="relative mt-6 flex justify-center">
          <Link
            href="/"
            className={buttonClass({ variant: "primary", size: "md" })}
          >
            {t("back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
