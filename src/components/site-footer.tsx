import { useTranslations } from "next-intl";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { MailIcon, PhoneIcon, SendIcon } from "@/components/ds/icons";
import { Logo } from "@/components/ds/logo";
import { Link } from "@/i18n/navigation";
import {
  EMAIL,
  EMAIL_URL,
  PHONE_DISPLAY,
  PHONE_URL,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
} from "@/lib/site";

const LINK = cn(
  "text-on-night/75 hover:text-on-night rounded-btn transition-colors",
  FOCUS_RING,
  "focus-visible:outline-on-night",
);

/** Toʻq footer (PDF dagidek): logo va tavsif, ikki ustun havola, aloqa maʼlumotlari. */
export function SiteFooter() {
  const t = useTranslations("Footer");
  const tHeader = useTranslations("Header");

  const columns = [
    {
      title: t("company"),
      links: [
        { href: "/#features", label: t("about") },
        { href: "/#companies", label: t("companies") },
        { href: "/#community", label: t("community") },
      ],
    },
    {
      title: t("features"),
      links: [
        { href: "/#categories", label: t("jobs") },
        { href: "/#profile", label: t("profile") },
        { href: "/register", label: t("register") },
        { href: "/login", label: t("login") },
      ],
    },
  ];

  const contacts = [
    {
      href: PHONE_URL,
      label: t("phoneLabel"),
      value: PHONE_DISPLAY,
      Icon: PhoneIcon,
    },
    { href: EMAIL_URL, label: t("emailLabel"), value: EMAIL, Icon: MailIcon },
    {
      href: TELEGRAM_URL,
      label: t("telegramLabel"),
      value: TELEGRAM_HANDLE,
      Icon: SendIcon,
      external: true,
    },
  ];

  return (
    <footer className="bg-night text-on-night font-ui">
      <div className="page-x grid grid-cols-2 gap-x-6 gap-y-12 py-16 lg:grid-cols-[1.6fr_1fr_1fr_1.5fr] lg:gap-10 lg:py-20">
        <div className="col-span-2 max-w-xs lg:col-span-1">
          <Link
            href="/"
            aria-label={tHeader("homeAria")}
            className={cn("inline-block", LINK)}
          >
            <Logo
              name={tHeader("logoName")}
              tag={tHeader("logoTag")}
              tone="night"
            />
          </Link>
          <p className="text-on-night/75 mt-5 text-sm leading-relaxed">
            {t("tagline")}
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-lg font-bold">{column.title}</h2>
            <ul className="mt-5 flex flex-col gap-3.5 text-[0.9375rem]">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK}>
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
            {contacts.map(({ href, label, value, Icon, external }) => (
              <li key={href}>
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
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-on-night/10 border-t">
        <p className="page-x text-on-night/60 py-6 text-center text-sm">
          {t("rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
