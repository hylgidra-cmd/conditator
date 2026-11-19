"use client";

import { CloseIcon, MenuIcon } from "@/frontend/components/icons";
import { useEffect, useId, useState } from "react";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Link, usePathname } from "@/i18n/navigation";
import { isNavActive } from "./nav-links";

type Item = { href: string; label: string };

/** Kichik ekran menyusi: tugma panelni ochadi, havola bosilganda yoki Esc da yopiladi. */
export function MobileMenu({
  items,
  unreadCount = 0,
  openLabel,
  closeLabel,
  footer,
}: {
  items: Item[];
  unreadCount?: number;
  openLabel: string;
  closeLabel: string;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "text-text hover:bg-card-cool relative inline-flex size-10 items-center justify-center rounded-full",
          FOCUS_RING,
        )}
      >
        {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        {unreadCount > 0 && !open ? (
          <span className="bg-danger absolute top-1.5 right-1.5 size-2.5 rounded-full" />
        ) : null}
      </button>
      {open ? (
        <div
          id={id}
          className="ds-modal-panel border-line bg-canvas/95 shadow-float absolute inset-x-0 top-full z-50 border-b backdrop-blur-xl"
        >
          <nav className="page-x flex flex-col py-3">
            {items.map((item) => {
              const active = isNavActive(pathname, item.href);
              const showBadge =
                unreadCount > 0 &&
                (item.href === "/chat" ||
                  item.href === "/support" ||
                  item.href === "/admin/support");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "font-ui rounded-field flex items-center justify-between px-3 py-3 text-base transition-colors",
                    active
                      ? "bg-primary/12 text-primary font-bold"
                      : "text-text hover:bg-card-cool font-medium",
                    FOCUS_RING,
                  )}
                >
                  <span>{item.label}</span>
                  {showBadge ? (
                    <span className="bg-danger rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            {footer ? (
              <div className="border-line mt-2 flex flex-wrap items-center gap-3 border-t px-3 pt-4 pb-2">
                {footer}
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
