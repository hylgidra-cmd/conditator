import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const ITEMS = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/companies", key: "companies" },
  { href: "/admin/vacancies", key: "vacancies" },
  { href: "/admin/readiness", key: "readiness" },
  { href: "/admin/complaints", key: "complaints" },
  { href: "/admin/payments", key: "payments" },
  { href: "/admin/support", key: "support" },
] as const;

export async function AdminNav({
  active,
}: {
  active: (typeof ITEMS)[number]["key"];
}) {
  const t = await getTranslations("Admin.nav");
  return (
    <nav className="border-line bg-card/75 inline-flex flex-wrap gap-1.5 rounded-2xl border p-1.5 backdrop-blur-md">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
            item.key === active
              ? "bg-primary text-on-primary shadow-primary"
              : "text-subtle hover:bg-card-cool hover:text-text"
          }`}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
