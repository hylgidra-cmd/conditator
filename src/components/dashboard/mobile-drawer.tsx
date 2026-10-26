"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef } from "react";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { usePathname } from "@/i18n/navigation";
import { ROUND_BUTTON } from "./ui";

/**
 * Kichik ekranlarda sidebar: native <dialog> (fokus ichida qoladi, Esc yopadi).
 * Sahifa almashganda oʻzi yopiladi.
 */
export function MobileDrawer({ children }: { children: ReactNode }) {
  const t = useTranslations("Dashboard.nav");
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label={t("open")}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className={cn(ROUND_BUTTON, "lg:hidden", FOCUS_RING)}
      >
        <MenuIcon size={20} />
      </button>
      <dialog
        ref={dialog}
        aria-label={t("label")}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="bg-canvas text-text m-0 h-dvh max-h-none w-[min(20rem,calc(100vw-3rem))] max-w-none overflow-y-auto p-0 backdrop:bg-black/50 lg:hidden"
      >
        <div className="relative min-h-full">
          {/* ROUND_BUTTON da "relative" bor: joylashuv tashqi span orqali. */}
          <span className="absolute top-5 right-4 z-10">
            <button
              type="button"
              aria-label={t("close")}
              onClick={() => dialog.current?.close()}
              className={cn(ROUND_BUTTON, FOCUS_RING)}
            >
              <CloseIcon size={20} />
            </button>
          </span>
          {children}
        </div>
      </dialog>
    </>
  );
}
