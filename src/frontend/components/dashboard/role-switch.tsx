"use client";

import { useTranslations } from "next-intl";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Link, usePathname } from "@/i18n/navigation";
import { ROLES, type Role } from "@/backend/dashboard/mock";

/** Nomzod / Ish beruvchi almashtirgichi: shu boʻlimning boshqa rol varianti ochiladi. */
export function RoleSwitch({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Dashboard.roles");
  const pathname = usePathname();
  const rest = pathname.replace(/^\/dashboard\/[^/]+/, "");

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="bg-card-cool flex rounded-full p-1"
    >
      {ROLES.map((r) => (
        <Link
          key={r}
          href={`/dashboard/${r}${rest}`}
          onClick={onNavigate}
          aria-current={r === role ? "true" : undefined}
          className={cn(
            "flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold whitespace-nowrap transition-colors",
            r === role ? "bg-ink text-on-ink" : "text-subtle hover:text-text",
            FOCUS_RING,
          )}
        >
          {t(r)}
        </Link>
      ))}
    </div>
  );
}
