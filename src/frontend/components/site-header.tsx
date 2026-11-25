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
  "border-line/90 text-text hover:border-primary/60 hover:bg-white inline-flex size-9 shrink-0 items-center justify-center rounded-full border bg-white/80 transition-colors dark:border-emerald-300/30 dark:bg-white/10 dark:text-white dark:hover:border-emerald-300/60 dark:hover:bg-white/20",
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
    { href: "/#student-journey", label: t("navStudents") },
    { href: "/#employer-section", label: t("navEmployers") },
    { href: "/vacancies", label: t("navVacancies") },
    { href: "/#how-it-works", label: t("navDiscover") },
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
    <header className="font-ui border-line/50 sticky top-0 z-40 w-full border-b bg-[#fcfdfb]/94 backdrop-blur-md dark:border-emerald-400/14 dark:bg-[#04110c]/92">
      <div className="relative flex h-16 w-full items-center gap-4 px-4 transition-all sm:px-8 lg:h-[74px] lg:px-14">
        <Link
          href="/"
          aria-label={t("homeAria")}
          className={cn("rounded-btn shrink-0", FOCUS_RING)}
        >
          <Logo name={t("logoName")} />
        </Link>
        <ActivePageBadge items={user ? roleLinks : sections} />

        <nav
          aria-label={t("mainNav")}
          className="mx-auto hidden items-center gap-2 lg:flex"
        >
          <NavLinks
            items={user ? roleLinks : sections}
            unreadCount={unreadCount}
          />
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5 lg:ml-0">
          <LocaleSwitcher />
          <span className="hidden sm:inline-flex">{themeToggle}</span>
          {user ? (
            <span className="hidden lg:block">
              <LogoutButton
                className={cn(
                  buttonClass({ variant: "outline", size: "sm" }),
                  "!rounded-full !px-5",
                )}
              />
            </span>
          ) : (
            <div className="hidden items-center gap-2.5 sm:flex">
              <Link
                href="/login"
                className={cn(
                  "border-line/90 text-text hover:border-primary/60 hover:bg-white inline-flex h-9 items-center justify-center rounded-full border bg-white/80 px-5 text-xs font-bold transition-all dark:border-emerald-300/32 dark:bg-[#081f17]/80 dark:text-white dark:hover:border-emerald-300/60 dark:hover:bg-[#0c2b20]",
                  FOCUS_RING,
                )}
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-[#0e8f5d] to-[#045238] px-5 text-xs font-bold text-white shadow-[0_6px_14px_rgb(6,95,67,0.22)] transition-all hover:brightness-110 dark:from-[#10b981] dark:to-[#059669] dark:shadow-[0_8px_20px_-4px_rgba(16,185,129,0.48)]",
                  FOCUS_RING,
                )}
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
