"use client";

import { useTranslations } from "next-intl";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { DASHBOARD_NAV } from "@/components/icons/dashboard-nav";
import { Link, usePathname } from "@/i18n/navigation";
import type { Role } from "@/lib/dashboard/mock";

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Dashboard.nav");
  const pathname = usePathname();
  const base = `/dashboard/${role}`;

  return (
    <nav aria-label={t("label")}>
      <ul className="flex flex-col gap-1">
        {DASHBOARD_NAV.map(({ key, path, Icon }) => {
          const href = base + path;
          const active =
            path === ""
              ? pathname === base
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={key}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-field flex items-center gap-3 px-3.5 py-2.5 text-[0.9375rem] font-semibold transition-colors",
                  active
                    ? "bg-primary text-on-primary shadow-primary"
                    : "text-subtle hover:bg-peach hover:text-text",
                  FOCUS_RING,
                )}
              >
                <Icon size={20} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
