import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const ITEMS = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/companies", key: "companies" },
  { href: "/admin/vacancies", key: "vacancies" },
  { href: "/admin/complaints", key: "complaints" },
  { href: "/admin/payments", key: "payments" },
  { href: "/chat", key: "support" },
] as const;

export async function AdminNav({
  active,
}: {
  active: (typeof ITEMS)[number]["key"];
}) {
  const t = await getTranslations("Admin.nav");
  return (
    <nav className="flex flex-wrap gap-2">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            item.key === active
              ? "bg-brand text-brand-foreground"
              : "border-border bg-surface border"
          }`}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
