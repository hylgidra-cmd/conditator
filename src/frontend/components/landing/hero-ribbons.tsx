"use client";

import { useEffect, useRef } from "react";

/**
 * Continuous full-width organic waving emerald ribbon flowing from the left edge,
 * seamlessly across the center behind the search bar, and up the right edge.
 * Modulates cubic-Bezier control points smoothly via RAF and pauses when offscreen or reduced-motion.
 */
export function HeroRibbons() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<SVGPathElement>(null);
  const secondaryRef = useRef<SVGPathElement>(null);
  const highlightRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let rafId = 0;

    const applyShapes = (t: number) => {
      const wL = Math.sin(t * 1.1) * 14 + Math.cos(t * 0.65) * 5;
      const wC = Math.cos(t * 0.9 + 0.9) * 12;
      const wR = Math.sin(t * 1.2 + 2.1) * 14;
      const wS = Math.cos(t * 0.8 + 1.5) * 10;

      // Primary continuous satin emerald ribbon spanning full 1440 width
      primaryRef.current?.setAttribute(
        "d",
        `M -40 ${52 + wL * 0.35}
         C 220 ${128 + wL}, 470 ${192 + wC}, 720 ${178 + wC * 0.7}
         C 970 ${164 - wC * 0.5}, 1220 ${122 + wR}, 1480 ${48 - wR * 0.35}
         L 1480 ${92 - wR * 0.3}
         C 1210 ${164 + wR * 0.85}, 965 ${204 - wS * 0.4}, 720 ${212 + wC * 0.55}
         C 475 ${220 + wC * 0.7}, 230 ${168 + wL * 0.8}, -40 ${98 + wL * 0.3} Z`,
      );

      // Secondary translucent mint veil weaving slightly below & across center
      secondaryRef.current?.setAttribute(
        "d",
        `M -40 ${106 - wS * 0.35}
         C 245 ${176 - wC * 0.7}, 490 ${216 + wS}, 720 ${198 - wC * 0.6}
         C 950 ${180 + wS * 0.8}, 1195 ${166 - wR * 0.7}, 1480 ${98 + wS * 0.35}
         L 1480 ${136 + wS * 0.3}
         C 1190 ${202 - wR * 0.5}, 955 ${222 + wS * 0.6}, 720 ${228 - wC * 0.4}
         C 485 ${234 + wS * 0.5}, 240 ${208 - wL * 0.5}, -40 ${142 - wS * 0.3} Z`,
      );

      // Crisp luminous upper silk specular edge across entire width
      highlightRef.current?.setAttribute(
        "d",
        `M -40 ${56 + wL * 0.35}
         C 220 ${132 + wL}, 470 ${196 + wC}, 720 ${182 + wC * 0.7}
         C 970 ${168 - wC * 0.5}, 1220 ${126 + wR}, 1480 ${52 - wR * 0.35}`,
      );
    };

    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const tick = (now: number) => {
      if (!visible || document.hidden || mq.matches) {
        rafId = 0;
        return;
      }
      applyShapes(now * 0.001);
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (mq.matches || document.hidden || !visible) {
        applyShapes(0.4);
        return;
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(el);

    const onVis = () => (document.hidden ? stop() : start());
    const onMotion = () => {
      stop();
      start();
    };
    document.addEventListener("visibilitychange", onVis);
    mq.addEventListener("change", onMotion);

    start();
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-4 z-15 h-60 overflow-hidden select-none sm:bottom-8 sm:h-72"
    >
      <svg
        viewBox="0 0 1440 240"
        preserveAspectRatio="none"
        className="h-full w-full opacity-95 dark:opacity-75"
      >
        <defs>
          <linearGradient id="heroRibbonFull1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#04593b" stopOpacity="0.96" />
            <stop offset="22%" stopColor="#10b981" stopOpacity="0.82" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.62" />
            <stop offset="78%" stopColor="#10b981" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#04593b" stopOpacity="0.96" />
          </linearGradient>
          <linearGradient id="heroRibbonFull2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.58" />
            <stop offset="30%" stopColor="#6ee7b7" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#a7f3d0" stopOpacity="0.48" />
            <stop offset="70%" stopColor="#6ee7b7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.58" />
          </linearGradient>
          <linearGradient id="heroRibbonRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ecfdf5" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ecfdf5" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <path
          ref={secondaryRef}
          d="M -40 106 C 245 176, 490 216, 720 198 C 950 180, 1195 166, 1480 98 L 1480 136 C 1190 202, 955 222, 720 228 C 485 234, 240 208, -40 142 Z"
          fill="url(#heroRibbonFull2)"
        />
        <path
          ref={primaryRef}
          d="M -40 52 C 220 128, 470 192, 720 178 C 970 164, 1220 122, 1480 48 L 1480 92 C 1210 164, 965 204, 720 212 C 475 220, 230 168, -40 98 Z"
          fill="url(#heroRibbonFull1)"
        />
        <path
          ref={highlightRef}
          d="M -40 56 C 220 132, 470 196, 720 182 C 970 168, 1220 126, 1480 52"
          fill="none"
          stroke="url(#heroRibbonRim)"
          strokeWidth="2.2"
        />
      </svg>
    </div>
  );
}
