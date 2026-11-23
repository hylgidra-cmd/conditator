"use client";

import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Link, usePathname } from "@/i18n/navigation";

export type NavItem = { href: string; label: string };

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  if (href === "/company" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  items,
  unreadCount = 0,
}: {
  items: NavItem[];
  unreadCount?: number;
}) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-ui inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-200",
              active
                ? "bg-primary-soft text-primary-text font-bold"
                : "text-subtle hover:bg-card-cool hover:text-text font-semibold",
              FOCUS_RING,
            )}
          >
            <span>{item.label}</span>
            {item.href === "/chat" && unreadCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[11px] leading-none font-extrabold text-slate-950">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

export function ActivePageBadge({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active = items.find((item) => isNavActive(pathname, item.href));
  if (!active || active.href === "/") return null;

  return (
    <span className="border-primary/35 bg-primary-soft text-primary-text truncate rounded-full border px-2.5 py-1 text-xs font-bold lg:hidden">
      {active.label}
    </span>
  );
}
