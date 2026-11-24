import { useTranslations } from "next-intl";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Logo } from "@/frontend/components/ds/logo";
import {
  MailIcon,
  PhoneIcon,
  SendIcon,
} from "@/frontend/components/icons";
import { LocaleSwitcher } from "./locale-switcher";
import { Link } from "@/i18n/navigation";
import {
  EMAIL,
  EMAIL_URL,
  PHONE_DISPLAY,
  PHONE_URL,
  TELEGRAM_URL,
} from "@/backend/site";

const LINK_STYLE = cn(
  "text-subtle hover:text-primary-text rounded-md text-sm font-medium transition-colors",
  FOCUS_RING,
);

/** Template-aligned light footer with 3 real link columns, verified channels, and upward language switcher. */
export function SiteFooter() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("platformTitle"),
      links: [
        { href: "/#student-journey", label: t("navStudents") },
        { href: "/#employer-section", label: t("navEmployers") },
        { href: "/vacancies", label: t("navVacancies") },
        { href: "/#how-it-works", label: t("navDiscover") },
      ],
    },
    {
      title: t("resourcesTitle"),
      links: [
        { href: "/student/cv", label: t("cvLink") },
        { href: "/student/personality", label: t("personalityLink") },
        { href: "/support", label: t("supportLink") },
      ],
    },
    {
      title: t("actionsTitle"),
      links: [
        { href: "/company/vacancies/new", label: t("postVacancyLink") },
        { href: "/register", label: t("register") },
        { href: "/login", label: t("login") },
      ],
    },
  ];

  return (
    <footer className="font-ui border-line/70 bg-[#f4f5f2] text-text relative border-t dark:border-emerald-400/14 dark:bg-[#030d09]">
      <div className="grid w-full grid-cols-1 gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-start lg:gap-10 lg:px-12 lg:py-14">
        {/* Brand column */}
        <div className="space-y-3">
          <Link
            href="/"
            aria-label={t("navStudents")}
            className={cn("inline-flex rounded-lg", FOCUS_RING)}
          >
            <Logo name="CANDIDATOR" />
          </Link>
          <p className="text-subtle max-w-xs text-sm leading-relaxed">
            {t("shortTagline")}
          </p>
          <p className="text-subtle/80 pt-1 text-xs">{t("rights", { year })}</p>
        </div>

        {/* 3 Real Destination Columns */}
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-3">
            <h2 className="text-text text-sm font-extrabold">{col.title}</h2>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK_STYLE}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Verified Contacts + Language Control */}
        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-end">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("telegramLabel")}
            title={t("telegramLabel")}
            className={cn(
              "border-line bg-card text-text hover:border-primary/50 hover:text-primary-text inline-flex size-9 items-center justify-center rounded-full border shadow-xs transition-colors",
              FOCUS_RING,
            )}
          >
            <SendIcon size={15} />
          </a>

          <a
            href={EMAIL_URL}
            aria-label={`${t("emailLabel")}: ${EMAIL}`}
            title={EMAIL}
            className={cn(
              "border-line bg-card text-text hover:border-primary/50 hover:text-primary-text inline-flex size-9 items-center justify-center rounded-full border shadow-xs transition-colors",
              FOCUS_RING,
            )}
          >
            <MailIcon size={15} />
          </a>

          {PHONE_DISPLAY && PHONE_URL ? (
            <a
              href={PHONE_URL}
              aria-label={`${t("phoneLabel")}: ${PHONE_DISPLAY}`}
              title={PHONE_DISPLAY}
              className={cn(
                "border-line bg-card text-text hover:border-primary/50 hover:text-primary-text inline-flex size-9 items-center justify-center rounded-full border shadow-xs transition-colors",
                FOCUS_RING,
              )}
            >
              <PhoneIcon size={15} />
            </a>
          ) : null}

          <div className="border-line bg-card rounded-full border px-1 shadow-xs">
            <LocaleSwitcher direction="up" />
          </div>
        </div>
      </div>
    </footer>
  );
}
