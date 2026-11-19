import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/frontend/components/ds/button";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Logo } from "@/frontend/components/ds/logo";
import { Link } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import { getUnreadMessageCount } from "@/backend/chat/unread";
import { LogoutButton } from "./auth/logout-button";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";
import { ActivePageBadge, NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

const THEME_BUTTON = cn(
  "bg-card-cool border-line text-text hover:bg-primary-soft hover:border-primary/40 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
  FOCUS_RING,
);

export async function SiteHeader() {
  const t = await getTranslations("Header");
  const tTheme = await getTranslations("Theme");
  const user = await currentUser();
  const unreadCount = user
    ? await getUnreadMessageCount(user.id, user.role)
    : 0;

  const sections = [
    { href: "/", label: t("home") },
    { href: "/vacancies", label: t("jobs") },
    { href: "/#showcase", label: t("howItWorks") },
    { href: "/#companies", label: t("companies") },
  ];

  const roleLinks = user
    ? [
        ...(user.role === "STUDENT"
          ? [
              { href: "/vacancies", label: t("jobs") },
              { href: "/student/cv", label: t("myCv") },
              { href: "/student/applications", label: t("myApplications") },
              { href: "/chat", label: t("chat") },
            ]
          : []),
        ...(user.role === "COMPANY"
          ? [
              { href: "/company/students", label: t("students") },
              { href: "/company/vacancies", label: t("vacancies") },
              { href: "/chat", label: t("chat") },
              { href: "/company", label: t("company") },
            ]
          : []),
        ...(user.role === "ADMIN"
          ? [
              { href: "/admin", label: t("admin") },
              { href: "/admin/support", label: t("support") },
            ]
          : []),
        { href: "/account", label: t("account") },
      ]
    : [];

  const themeToggle = (
    <ThemeToggle
      toDark={tTheme("toDark")}
      toLight={tTheme("toLight")}
      className={THEME_BUTTON}
    />
  );

  return (
    <header className="font-ui sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="border-line bg-card/90 shadow-float mx-auto relative flex h-16 max-w-[86rem] items-center gap-3 rounded-2xl border px-4 backdrop-blur-xl transition-all sm:px-6">
        <Link
          href="/"
          aria-label={t("homeAria")}
          className={cn("rounded-btn shrink-0", FOCUS_RING)}
        >
          <Logo name={t("logoName")} tag={t("logoTag")} />
        </Link>
        <ActivePageBadge items={user ? roleLinks : sections} />

        <nav
          aria-label={t("mainNav")}
          className="border-line bg-card-cool/80 mx-auto hidden items-center gap-1 rounded-full border p-1 lg:flex"
        >
          <NavLinks
            items={user ? roleLinks : sections}
            unreadCount={unreadCount}
          />
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:ml-0">
          <LocaleSwitcher />
          <span className="hidden sm:block">{themeToggle}</span>
          {user ? (
            <span className="hidden lg:block">
              <LogoutButton
                className={buttonClass({ variant: "outline", size: "sm" })}
              />
            </span>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className={buttonClass({ variant: "primary", size: "sm" })}
              >
                {t("register")}
              </Link>
            </div>
          )}
          <MobileMenu
            items={user ? roleLinks : sections}
            unreadCount={unreadCount}
            openLabel={t("menuOpen")}
            closeLabel={t("menuClose")}
            footer={
              <>
                <span className="sm:hidden">{themeToggle}</span>
                {user ? (
                  <LogoutButton
                    className={buttonClass({ variant: "outline", size: "sm" })}
                  />
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={buttonClass({ variant: "outline", size: "sm" })}
                    >
                      {t("login")}
                    </Link>
                    <Link
                      href="/register"
                      className={buttonClass({ variant: "primary", size: "sm" })}
                    >
                      {t("register")}
                    </Link>
                  </>
                )}
              </>
            }
          />
        </div>
      </div>
    </header>
  );
}
