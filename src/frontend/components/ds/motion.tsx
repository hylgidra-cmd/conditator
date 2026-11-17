"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "./cn";

type RevealDelay = 0 | 75 | 150 | 225 | 300;

const DELAY_CLASS: Record<RevealDelay, string> = {
  0: "delay-0",
  75: "delay-75",
  150: "delay-150",
  225: "delay-[225ms]",
  300: "delay-300",
};

/**
 * Scroll paytida elementni silliq ko'rsatish.
 * Birinchi ekranda darhol ko'rinadigan elementlar (immediate) yoki reduced-motion uchun SSR miltillashini oldini oladi.
 */
export function Reveal({
  children,
  delay = 0,
  immediate = false,
  className,
}: {
  children: ReactNode;
  delay?: RevealDelay;
  immediate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    const el = ref.current;
    if (!el || immediate) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.96) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        DELAY_CLASS[delay],
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Raqamni silliq sanab chiqaruvchi komponent (0 ga qaytib sakrashsiz).
 */
export function AnimatedNumber({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = prevValue.current === value ? Math.round(value * 0.65) : prevValue.current;
    prevValue.current = value;

    if (
      value === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }

    let rafId = 0;
    const animate = () => {
      const duration = 650;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(from + (value - from) * eased));
        if (t < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    };

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      animate();
      return () => cancelAnimationFrame(rafId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        animate();
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display.toLocaleString("en-US").replace(/,/g, " ")}
      {suffix}
    </span>
  );
}
