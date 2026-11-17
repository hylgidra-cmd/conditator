"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/frontend/components/icons";
import { cn, FOCUS_RING } from "./cn";

/**
 * Qulay (accessible) va animatsiyali Modal dialog:
 * Escape bosilganda, tashqarisiga bosilganda yopiladi va fokusni qaytaradi.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  closeLabel = "Close",
  maxWidth = "max-w-lg",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  closeLabel?: string;
  maxWidth?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ds-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "ds-modal-panel border-line bg-card shadow-float relative w-full overflow-hidden rounded-3xl border outline-none",
          maxWidth,
        )}
      >
        {(title || subtitle) && (
          <div className="border-line/80 flex items-start justify-between gap-4 border-b px-6 py-4">
            <div className="min-w-0">
              {title ? (
                <h2 className="font-ui text-text text-lg font-extrabold tracking-tight">
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p className="text-subtle mt-0.5 text-xs">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className={cn(
                "text-subtle hover:bg-card-cool hover:text-text -mr-1 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors",
                FOCUS_RING,
              )}
            >
              <CloseIcon size={18} />
            </button>
          </div>
        )}

        <div className="max-h-[82vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="border-line/80 bg-card-cool/40 flex flex-wrap items-center justify-end gap-2.5 border-t px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
