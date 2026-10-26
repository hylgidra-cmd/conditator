import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { Input } from "@/components/ds/input";
import { Logo, LogoMark } from "@/components/ds/logo";
import { ArrowLeftIcon, SearchIcon, SparkIcon } from "@/components/icons";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPathname, Link } from "@/i18n/navigation";
import type { Role } from "@/lib/dashboard/mock";
import { MobileDrawer } from "./mobile-drawer";
import { RoleSwitch } from "./role-switch";
import { SidebarNav } from "./sidebar-nav";
import { NotificationsMenu, ProfileMenu } from "./topbar-menus";
import { ROUND_BUTTON } from "./ui";

export async function DashboardShell({
  role,
  locale,
  children,
}: {
  role: Role;
  locale: Locale;
  children: ReactNode;
}) {
  const t = await getTranslations("Dashboard");
  const tHeader = await getTranslations("Header");
  const tTheme = await getTranslations("Theme");

  const themeToggle = (
    <ThemeToggle
      toDark={tTheme("toDark")}
      toLight={tTheme("toLight")}
      className={cn(ROUND_BUTTON, FOCUS_RING)}
    />
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <Link
        href="/"
        aria-label={tHeader("homeAria")}
        className={cn("rounded-btn self-start px-2", FOCUS_RING)}
      >
        <Logo name={tHeader("logoName")} tag={tHeader("logoTag")} />
      </Link>
      <RoleSwitch role={role} />
      <SidebarNav role={role} />
      <div className="mt-auto flex flex-col gap-4">
        <div className="bg-night text-on-night rounded-card relative overflow-hidden p-4">
          <span
            aria-hidden
            className="bg-primary/25 absolute -top-6 -right-6 size-20 rounded-full"
          />
          <SparkIcon size={22} className="text-primary relative" />
          <p className="relative mt-2 text-sm font-semibold">
            {t("assistant.title")}
          </p>
          <Link
            href={`/dashboard/${role}/assistant`}
            className={cn(
              "text-primary relative mt-1 inline-block rounded-sm text-sm font-semibold hover:underline",
              "focus-visible:outline-on-night focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            {t("nav.assistant")}
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          {themeToggle}
          <LocaleSwitcher />
        </div>
        <Link
          href="/"
          className={cn(
            "text-subtle hover:text-text rounded-field flex items-center gap-3 px-3.5 py-2 text-sm font-semibold",
            FOCUS_RING,
          )}
        >
          <ArrowLeftIcon size={18} />
          {t("nav.home")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="font-ui bg-card-cool text-text min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#dashboard-main"
        className="bg-ink text-on-ink rounded-btn sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skip")}
      </a>
      <aside className="bg-canvas border-line hidden border-r lg:block">
        <div className="sticky top-0 h-dvh overflow-y-auto">{sidebar}</div>
      </aside>
      <div className="min-w-0">
        <header className="bg-card-cool/85 sticky top-0 z-40 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <MobileDrawer>{sidebar}</MobileDrawer>
            <Link
              href="/"
              aria-label={tHeader("homeAria")}
              className={cn("rounded-btn sm:hidden", FOCUS_RING)}
            >
              <LogoMark />
            </Link>
            <form
              role="search"
              action={getPathname({
                locale,
                href: `/dashboard/${role}/vacancies`,
              })}
              className="hidden max-w-md flex-1 sm:block"
            >
              <label htmlFor="dashboard-search" className="sr-only">
                {t("topbar.searchLabel")}
              </label>
              <Input
                id="dashboard-search"
                name="q"
                type="search"
                placeholder={t("topbar.search")}
                icon={<SearchIcon size={18} />}
                className="bg-card h-11 rounded-full border-transparent"
              />
            </form>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Link
                href={`/dashboard/${role}/vacancies`}
                aria-label={t("topbar.searchLabel")}
                className={cn(ROUND_BUTTON, "sm:hidden", FOCUS_RING)}
              >
                <SearchIcon size={20} />
              </Link>
              <span className="hidden lg:block">
                <LocaleSwitcher />
              </span>
              <span className="hidden lg:block">{themeToggle}</span>
              <NotificationsMenu role={role} />
              <ProfileMenu role={role} />
            </div>
          </div>
        </header>
        <main
          id="dashboard-main"
          tabIndex={-1}
          className="px-4 pt-2 pb-12 outline-none sm:px-6 lg:px-8"
        >
          <p className="bg-warning-soft text-warning rounded-field mb-6 px-4 py-2.5 text-sm font-medium">
            {t("demo")}
          </p>
          {children}
        </main>
      </div>
    </div>
  );
}
