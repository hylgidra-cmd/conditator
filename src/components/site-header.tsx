import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ds/button";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { Logo } from "@/components/ds/logo";
import { Link } from "@/i18n/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { LogoutButton } from "./auth/logout-button";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINK = cn(
  "font-ui text-text hover:text-primary-text rounded-btn py-1.5 text-[0.9375rem] font-medium whitespace-nowrap transition-colors",
  FOCUS_RING,
);

const THEME_BUTTON = cn(
  "bg-peach text-text hover:bg-primary-soft inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
  FOCUS_RING,
);

export async function SiteHeader() {
  const t = await getTranslations("Header");
  const tTheme = await getTranslations("Theme");
  const user = await currentUser();

  // Bosh sahifa boʻlimlariga havolalar. TODO: Vakansiyalar va Hamjamiyat boʻlimlari keyingi bosqichda quriladi.
  const sections = [
    { href: "/", label: t("home") },
    { href: "/#companies", label: t("companies") },
    { href: "/#community", label: t("community") },
    { href: "/#categories", label: t("jobs") },
  ];

  // Kirgan foydalanuvchi uchun rol boʻyicha havolalar (mavjud kabinet sahifalari).
  const roleLinks = user
    ? [
        ...(user.role === "STUDENT"
          ? [{ href: "/student/cv", label: t("myCv") }]
          : []),
        ...(user.role === "COMPANY"
          ? [
              { href: "/company/vacancies", label: t("vacancies") },
              { href: "/company", label: t("company") },
            ]
          : []),
        ...(user.role === "ADMIN"
          ? [{ href: "/admin", label: t("admin") }]
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

  // PDF dagidek shaffof va qotirilmagan: bosh sahifada hero foni header ostidan boshlanadi.
  return (
    <header className="font-ui relative z-40">
      <div className="page-x relative flex h-16 items-center gap-3 lg:h-20">
        <Link
          href="/"
          aria-label={t("homeAria")}
          className={cn("rounded-btn shrink-0", FOCUS_RING)}
        >
          <Logo name={t("logoName")} />
        </Link>

        <nav
          aria-label={t("mainNav")}
          className="ml-14 hidden items-center gap-10 lg:flex"
        >
          {(user ? roleLinks : sections).map((item) => (
            <Link key={item.href} href={item.href} className={NAV_LINK}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher />
          <span className="hidden sm:block">{themeToggle}</span>
          {user ? (
            <span className="hidden lg:block">
              <LogoutButton
                className={buttonClass({ variant: "outline", size: "sm" })}
              />
            </span>
          ) : (
            <Link
              href="/login"
              className={buttonClass({ variant: "dark", size: "sm" })}
            >
              {t("login")}
            </Link>
          )}
          <MobileMenu
            items={user ? roleLinks : sections}
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
                  <Link
                    href="/register"
                    className={buttonClass({ variant: "primary", size: "sm" })}
                  >
                    {t("register")}
                  </Link>
                )}
              </>
            }
          />
        </div>
      </div>
    </header>
  );
}
