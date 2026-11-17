"use client";

import type { HTMLAttributes, MouseEvent, ReactNode } from "react";
import { useRef } from "react";
import { cn } from "./cn";

/**
 * Kursor harakatiga ergashadigan Electric Blue nurli shisha karta.
 * Og'ir kutubxonolarsiz, faqat CSS custom properties (--spot-x / --spot-y) orqali ishlaydi.
 */
export function SpotlightCard({
  children,
  className,
  glowColor = "rgb(5 150 105 / 0.16)",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn(
        "group border-line bg-card/90 shadow-soft dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_40px_-16px_rgba(1,6,4,0.65)] hover:border-primary/50 hover:shadow-float dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_20px_50px_-14px_rgba(16,185,129,0.25)] relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300",
        className,
      )}
      {...rest}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={{
          background: `radial-gradient(460px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${glowColor}, transparent 65%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
