import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { LogoutButton } from "./auth/logout-button";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

const NAV_LINK =
  "text-muted hover:text-foreground shrink-0 rounded-lg px-1.5 py-1.5 text-sm whitespace-nowrap sm:px-2";

export async function SiteHeader() {
  const t = await getTranslations("Header");
  const tTheme = await getTranslations("Theme");
  const user = await currentUser();

  return (
    <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link
          href="/"
          aria-label={t("homeAria")}
          className="font-display shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap"
        >
          <Wordmark brand={t("brand")} />
        </Link>

        {user ? null : (
          <nav
            aria-label={t("mainNav")}
            className="ml-6 hidden items-center gap-1 lg:flex"
          >
            <Link href="/#how" className={NAV_LINK}>
              {t("howItWorks")}
            </Link>
            <Link href="/#pricing" className={NAV_LINK}>
              {t("pricing")}
            </Link>
            <Link href="/#faq" className={NAV_LINK}>
              {t("faq")}
            </Link>
          </nav>
        )}

        <div className="ml-auto flex min-w-0 items-center sm:gap-1">
          {/* Kichik ekranda ham bir qator: sig'magan havolalar gorizontal suriladi. */}
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {user ? (
              <>
                {user.role === "STUDENT" ? (
                  <Link href="/student/cv" className={NAV_LINK}>
                    {t("myCv")}
                  </Link>
                ) : null}
                {user.role === "COMPANY" ? (
                  <>
                    <Link href="/company/vacancies" className={NAV_LINK}>
                      {t("vacancies")}
                    </Link>
                    <Link href="/company" className={NAV_LINK}>
                      {t("company")}
                    </Link>
                  </>
                ) : null}
                {user.role === "ADMIN" ? (
                  <Link href="/admin" className={NAV_LINK}>
                    {t("admin")}
                  </Link>
                ) : null}
                <Link href="/account" className={NAV_LINK}>
                  {t("account")}
                </Link>
                <LogoutButton className={NAV_LINK} />
              </>
            ) : (
              <>
                <Link href="/login" className={NAV_LINK}>
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="bg-brand text-brand-foreground hover:bg-brand-strong ml-1 shrink-0 rounded-lg px-2.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors sm:px-4"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </nav>
          <LocaleSwitcher />
          <span className="hidden sm:block">
            <ThemeToggle
              toDark={tTheme("toDark")}
              toLight={tTheme("toLight")}
            />
          </span>
        </div>
      </div>
    </header>
  );
}
