"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import styles from "./admin-studio.module.css";

type NavKey =
  | "dashboard"
  | "users"
  | "companies"
  | "vacancies"
  | "readiness"
  | "skillTemplates"
  | "complaints"
  | "payments"
  | "support";

const SIDEBAR_ITEMS: Array<{ href: string; key: NavKey }> = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/companies", key: "companies" },
  { href: "/admin/vacancies", key: "vacancies" },
  { href: "/admin/readiness", key: "readiness" },
  { href: "/admin/skill-templates", key: "skillTemplates" },
  { href: "/admin/complaints", key: "complaints" },
  { href: "/admin/payments", key: "payments" },
  { href: "/admin/support", key: "support" },
];

function NavIcon({ itemKey }: { itemKey: NavKey }) {
  switch (itemKey) {
    case "dashboard":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "users":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "companies":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
        </svg>
      );
    case "vacancies":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case "readiness":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
        </svg>
      );
    case "skillTemplates":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "complaints":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      );
    case "payments":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      );
    case "support":
      return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      );
  }
}

export function AdminStudioShell({
  adminEmail,
  children,
}: {
  adminEmail: string;
  children: ReactNode;
}) {
  const t = useTranslations("AdminStudio");
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className={`${styles.stage} font-ui`}>
      <div className="mx-auto max-w-[1460px] px-4 pt-5 pb-16 sm:px-6 lg:px-10 lg:pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start">
          {/* Persistent Left Admin Sidebar */}
          <aside className={`${styles.sidebar} p-3.5 lg:sticky lg:top-22`}>
            <div className="mb-3 flex items-center justify-between border-b border-[#e2f1ea] px-2 pb-3 dark:border-[#154531]">
              <span className="text-xs font-extrabold tracking-wide text-[#0c241b] uppercase dark:text-[#e6f7ee]">
                {t("panelTitle")}
              </span>
              <span
                title={adminEmail}
                className="inline-flex items-center gap-1 rounded-full border border-[#0e935f]/25 bg-[#e4f7ee] px-2.5 py-0.5 text-[11px] font-extrabold text-[#086e46] dark:border-[#34eab0]/35 dark:bg-[#0d3b29] dark:text-[#3be7a3]"
              >
                <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                </svg>
                <span>{t("adminBadge")}</span>
              </span>
            </div>

            <nav
              aria-label={t("panelTitle")}
              className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
            >
              {SIDEBAR_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`${styles.navItem} ${
                      active ? styles.navItemActive : ""
                    } shrink-0 whitespace-nowrap`}
                  >
                    <NavIcon itemKey={item.key} />
                    <span>{t(`nav.${item.key}`)}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Admin Content Area */}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
