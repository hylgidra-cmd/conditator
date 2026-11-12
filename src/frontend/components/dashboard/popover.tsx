"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";

/**
 * Topbar ochiladigan panellari (bildirishnoma, profil): tugma + panel.
 * Esc, tashqariga bosish va fokus chiqib ketganda yopiladi; Esc dan keyin fokus tugmaga qaytadi.
 */
export function Popover({
  label,
  trigger,
  triggerClassName,
  children,
  panelClassName,
}: {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  children: (close: () => void) => ReactNode;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(triggerClassName, FOCUS_RING)}
      >
        {trigger}
      </button>
      <div
        id={id}
        hidden={!open}
        className={cn(
          "bg-card text-text shadow-float border-line rounded-field absolute right-0 z-50 mt-2 border",
          panelClassName,
        )}
      >
        {children(close)}
      </div>
    </div>
  );
}
