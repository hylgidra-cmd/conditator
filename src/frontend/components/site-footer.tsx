import { useTranslations } from "next-intl";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Logo } from "@/frontend/components/ds/logo";
import {
  MailIcon,
  MessageIcon,
  PhoneIcon,
  SendIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";
import {
  DEVELOPER_URL,
  EMAIL,
  EMAIL_URL,
  PHONE_DISPLAY,
  PHONE_URL,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
} from "@/backend/site";

const LINK = cn(
  "text-on-night/75 hover:text-on-night rounded-btn transition-colors",
  FOCUS_RING,
  "focus-visible:outline-on-night",
);

/** Toʻq footer: logo va tavsif, ishlaydigan ichki havolalar, real aloqa kanallari. */
export function SiteFooter() {
  const t = useTranslations("Footer");
  const tHeader = useTranslations("Header");

  const columns = [
    {
      title: t("company"),
      links: [
        { href: "/#showcase", label: t("about") },
        { href: "/#companies", label: t("companies") },
        { href: "/support", label: tHeader("support") },
      ],
    },
    {
      title: t("features"),
      links: [
        { href: "/vacancies", label: t("jobs") },
        { href: "/#categories", label: tHeader("categories") },
        { href: "/#profile", label: t("profile") },
        { href: "/register", label: t("register") },
        { href: "/login", label: t("login") },
      ],
    },
  ];

  const contacts = [
    ...(PHONE_DISPLAY && PHONE_URL
      ? [
          {
            href: PHONE_URL,
            label: t("phoneLabel"),
            value: PHONE_DISPLAY,
            Icon: PhoneIcon,
            external: false,
            internal: false,
          },
        ]
      : []),
    {
      href: EMAIL_URL,
      label: t("emailLabel"),
      value: EMAIL,
      Icon: MailIcon,
      external: false,
      internal: false,
    },
    {
      href: TELEGRAM_URL,
      label: t("telegramLabel"),
      value: TELEGRAM_HANDLE,
      Icon: SendIcon,
      external: true,
      internal: false,
    },
    {
      href: "/support",
      label: tHeader("support"),
      value: tHeader("supportAction"),
      Icon: MessageIcon,
      external: false,
      internal: true,
    },
  ];

  return (
    <footer className="bg-night text-on-night border-line/80 font-ui relative border-t">
      <div
        aria-hidden
        className="via-primary/50 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />
      <div className="page-x grid grid-cols-2 gap-x-6 gap-y-12 py-16 lg:grid-cols-[1.6fr_1fr_1fr_1.5fr] lg:gap-10 lg:py-20">
        <div className="col-span-2 max-w-xs lg:col-span-1">
          <Link
            href="/"
            aria-label={tHeader("homeAria")}
            className={cn("inline-block", LINK)}
          >
            <Logo name={tHeader("logoName")} tone="night" />
          </Link>
          <p className="text-on-night/75 mt-5 text-sm leading-relaxed">
            {t("tagline")}
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-lg font-bold">{column.title}</h2>
            <ul className="mt-4 flex flex-col gap-1.5 text-[0.9375rem]">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn("inline-block py-1", LINK)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 lg:col-span-1">
          <h2 className="text-lg font-bold">{t("contacts")}</h2>
          <ul className="mt-5 flex flex-col gap-4 text-[0.9375rem]">
            {contacts.map(({ href, label, value, Icon, external, internal }) => (
              <li key={href}>
                {internal ? (
                  <Link
                    href={href}
                    className={cn("group inline-flex items-start gap-3", LINK)}
                  >
                    <span className="bg-on-night/10 text-primary group-hover:bg-primary group-hover:text-on-primary mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors">
                      <Icon size={16} />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-on-night/60 text-xs">{label}</span>
                      <span className="text-on-night break-all">{value}</span>
                    </span>
                  </Link>
                ) : (
                  <a
                    href={href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className={cn("group inline-flex items-start gap-3", LINK)}
                  >
                    <span className="bg-on-night/10 text-primary group-hover:bg-primary group-hover:text-on-primary mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors">
                      <Icon size={16} />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-on-night/60 text-xs">{label}</span>
                      <span className="text-on-night break-all">{value}</span>
                    </span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-on-night/10 border-t">
        <p className="page-x text-on-night/60 py-6 text-center text-sm">
          {t("rights", { year: new Date().getFullYear() })}{" "}
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(LINK, "underline-offset-4 hover:underline")}
          >
            {t("credit")}
          </a>
        </p>
      </div>
    </footer>
  );
}
