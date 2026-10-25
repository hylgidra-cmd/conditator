import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { LogoutButton } from "./auth/logout-button";
import { LocaleSwitcher } from "./locale-switcher";

const NAV_LINK =
  "text-muted hover:text-foreground rounded-md px-2 py-1 text-sm";

export async function SiteHeader() {
  const t = await getTranslations("Header");
  const user = await currentUser();

  return (
    <header className="border-border bg-surface border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link
          href="/"
          aria-label={t("homeAria")}
          className="text-brand shrink-0 text-lg font-bold whitespace-nowrap"
        >
          {t("brand")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center gap-1">
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
                  className="bg-brand rounded-md px-3 py-1 text-sm font-semibold text-white"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </nav>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
