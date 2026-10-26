import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  EMAIL,
  EMAIL_URL,
  PHONE_DISPLAY,
  PHONE_URL,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
} from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

const LINK = "text-muted hover:text-foreground";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tTheme = useTranslations("Theme");
  const tHeader = useTranslations("Header");

  return (
    <footer className="border-border border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-display text-xl font-semibold tracking-tight">
            <Wordmark brand={tHeader("brand")} />
          </p>
          <p className="text-muted mt-3 text-sm leading-relaxed">
            {t("tagline")}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">{t("product")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/register" className={LINK}>
                {t("register")}
              </Link>
            </li>
            <li>
              <Link href="/login" className={LINK}>
                {t("login")}
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className={LINK}>
                {t("pricing")}
              </Link>
            </li>
            <li>
              <Link href="/#faq" className={LINK}>
                {t("faq")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">{t("contacts")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={TELEGRAM_URL} className={LINK} rel="noopener">
                <span className="text-foreground">{t("telegram")}</span>{" "}
                {TELEGRAM_HANDLE}
              </a>
            </li>
            <li>
              <a href={PHONE_URL} className={LINK}>
                {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={EMAIL_URL} className={`${LINK} break-all`}>
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-border border-t">
        <div className="text-muted mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 text-sm sm:px-6">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
          <ThemeToggle toDark={tTheme("toDark")} toLight={tTheme("toLight")} />
        </div>
      </div>
    </footer>
  );
}
