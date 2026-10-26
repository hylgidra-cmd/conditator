"use client";

import { CloseIcon, MenuIcon } from "@/components/icons";
import { useEffect, useId, useState } from "react";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { Link, usePathname } from "@/i18n/navigation";

type Item = { href: string; label: string };

/** Kichik ekran menyusi: tugma panelni ochadi, havola bosilganda yoki Esc da yopiladi. */
export function MobileMenu({
  items,
  openLabel,
  closeLabel,
  footer,
}: {
  items: Item[];
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
          "text-text hover:bg-peach inline-flex size-10 items-center justify-center rounded-full",
          FOCUS_RING,
        )}
      >
        {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
      </button>
      <div
        id={id}
        hidden={!open}
        className="border-line bg-canvas shadow-float absolute inset-x-0 top-full border-b"
      >
        <nav className="page-x flex flex-col py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "font-ui text-text hover:bg-peach rounded-field px-3 py-3 text-base font-medium",
                FOCUS_RING,
              )}
            >
              {item.label}
            </Link>
          ))}
          {footer ? (
            <div className="border-line mt-2 flex flex-wrap items-center gap-3 border-t px-3 pt-4 pb-2">
              {footer}
            </div>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
