"use client";

import { useEffect, useRef } from "react";
import { BriefcaseIcon, LayersIcon } from "@/frontend/components/icons";
import styles from "./sections.module.css";

interface EmployerVisualProps {
  towerAlt: string;
  docLabel: string;
  folderLabel: string;
}

/**
 * Section 4 Studio-3D Employer Scene:
 * - Stationary 3-tiered emerald HQ building with subtle studio backlight aura
 * - Compact, tightly composed 3D scene (no over-stretching on ultrawide monitors):
 *   3D porcelain Vacancy Document -> Luminous golden-emerald S-Wave + stardust ->
 *   3 tilted 3D crystal-emerald glass badges (</>, Layers, Gear) ->
 *   3D neon-rimmed crystal glass Folder
 * - True vertical mirror floor reflections under Document, S-wave, and Folder
 * - Smooth silky emerald glass ribbon sweeping up-right behind the badges
 */
export function EmployerVisual({
  towerAlt,
  docLabel,
  folderLabel,
}: EmployerVisualProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const streamRef = useRef<SVGPathElement>(null);
  const swooshGlintRef = useRef<SVGPathElement>(null);
  const pulse1Ref = useRef<SVGGElement>(null);
  const pulse2Ref = useRef<SVGGElement>(null);
  const pulse3Ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    if (!wrap || !path) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    let visible = true;
    let raf = 0;
    let totalLen = 0;

    try {
      totalLen = path.getTotalLength();
    } catch {
      totalLen = 260;
    }

    const setPulseAt = (
      el: SVGGElement | null,
      t: number,
      pulseScale = 1,
    ) => {
      if (!el || !path) return;
      try {
        const pt = path.getPointAtLength(Math.max(0, Math.min(1, t)) * totalLen);
        el.setAttribute(
          "transform",
          `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)}) scale(${pulseScale.toFixed(2)})`,
        );
      } catch {
        // Ignore if SVG not yet laid out
      }
    };

    const drawStatic = () => {
      setPulseAt(pulse1Ref.current, 0.22, 1.05);
      setPulseAt(pulse2Ref.current, 0.64, 1.1);
      setPulseAt(pulse3Ref.current, 0.9, 0.85);
    };

    if (reduced) {
      drawStatic();
    }

    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = (ts - startTs) / 1000;

      if (streamRef.current) {
        streamRef.current.style.strokeDashoffset = `${-(elapsed * 56) % 140}`;
      }
      if (swooshGlintRef.current) {
        swooshGlintRef.current.style.strokeDashoffset = `${-(elapsed * 68) % 260}`;
      }

      const t1 = (elapsed * 0.22) % 1;
      const t2 = (t1 + 0.38) % 1;
      const t3 = (t1 + 0.72) % 1;
      const s1 = 0.92 + Math.sin(elapsed * 3.2) * 0.14;
      const s2 = 0.96 + Math.cos(elapsed * 2.8) * 0.14;
      const s3 = 0.78 + Math.sin(elapsed * 3.6 + 1) * 0.12;

      setPulseAt(pulse1Ref.current, t1, s1);
      setPulseAt(pulse2Ref.current, t2, s2);
      setPulseAt(pulse3Ref.current, t3, s3);

      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && visible && !reduced && !document.hidden) {
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);

    const onVis = () => (document.hidden ? stop() : start());
    const onMotion = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      if (reduced) {
        stop();
        drawStatic();
      } else {
        start();
      }
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
    <div ref={wrapRef} className={`${styles.employerVisualWrap} w-full pb-8`}>
      {/* Studio-3D Backlight Aura, Silky Emerald Glass Ribbon & Glossy Mirror Horizon */}
      <svg
        viewBox="0 0 1000 410"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute -left-16 top-0 z-10 h-full w-[calc(100%+4rem)] overflow-visible"
      >
        <defs>
          <radialGradient id="empTowerBackGlow" cx="50%" cy="46%" r="50%">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.56" />
            <stop offset="44%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#042c1e" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="empFloorSurface" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
            <stop offset="28%" stopColor="#10b981" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#042c1e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="empFloorEdgeFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="10%" stopColor="#ffffff" />
            <stop offset="90%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <mask id="empFloorFadeMask">
            <rect x="0" y="330" width="1000" height="80" fill="url(#empFloorEdgeFade)" />
          </mask>
          <linearGradient id="empSilkRibbonFill" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="32%" stopColor="#34d399" stopOpacity="0.28" />
            <stop offset="72%" stopColor="#a7f3d0" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="empSilkRibbonEdge" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
            <stop offset="35%" stopColor="#a7f3d0" stopOpacity="0.72" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="empArcSoft" x1="0%" y1="100%" x2="80%" y2="0%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0" />
            <stop offset="45%" stopColor="#a7f3d0" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="empReflGold" cx="50%" cy="15%" r="55%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.58" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <filter id="empSoftBloom" x="-15%" y="-25%" width="130%" height="150%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft emerald-mint studio halo behind HQ building */}
        <ellipse cx="265" cy="180" rx="225" ry="150" fill="url(#empTowerBackGlow)" />

        {/* Glossy reflective studio floor band (edges faded seamlessly) */}
        <rect
          x="0"
          y="338"
          width="1000"
          height="72"
          fill="url(#empFloorSurface)"
          mask="url(#empFloorFadeMask)"
        />
        <line
          x1="24"
          y1="338"
          x2="976"
          y2="338"
          stroke="url(#empArcSoft)"
          strokeWidth="1.2"
          strokeOpacity="0.55"
        />

        {/* Warm golden floor reflection directly under HQ entrance doors */}
        <ellipse cx="265" cy="364" rx="120" ry="22" fill="url(#empReflGold)" />

        {/* Delicate whisper-thin studio glass arc behind HQ building */}
        <path
          d="M 48 348 C 54 176, 134 58, 310 10"
          stroke="url(#empArcSoft)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Silky translucent 3D emerald glass ribbon sweeping up-right behind the badges & folder */}
        <path
          d="M 625 224 C 740 165, 855 104, 1005 18 L 1005 56 C 865 118, 755 174, 635 234 Z"
          fill="url(#empSilkRibbonFill)"
        />
        <path
          d="M 625 224 C 740 165, 855 104, 1005 18"
          stroke="url(#empSilkRibbonEdge)"
          strokeWidth="2.4"
          strokeLinecap="round"
          filter="url(#empSoftBloom)"
        />
        <path
          ref={swooshGlintRef}
          d="M 625 224 C 740 165, 855 104, 1005 18"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="58 202"
        />
      </svg>

      {/* Main Compact Studio-3D Scene Row (stays tightly composed even on 1920px+ screens) */}
      <div className="relative z-20 flex w-full max-w-[960px] flex-col items-center justify-start gap-4 sm:flex-row sm:gap-0 lg:-ml-2">
        {/* 1. Stationary 3-tiered Emerald HQ Building */}
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/employer-tower.png"
            alt={towerAlt}
            width={430}
            height={372}
            className={styles.towerBase}
          />
        </div>

        {/* Right 3D Workflow Cluster: Document + Connected S-Wave & 3D Badges + Crystal Folder */}
        <div className="relative z-25 flex shrink-0 items-center sm:-ml-2">
          {/* 2. Floating 3D Perspective Porcelain-White Vacancy Document + Mirror Floor Reflection */}
          <div className="relative z-30 shrink-0" style={{ perspective: "780px" }}>
            <div
              aria-label={docLabel}
              className={`${styles.floatDocCard} ${styles.employerDoc3d} relative h-46 w-36 rounded-[1.35rem] p-4 sm:h-52 sm:w-42 sm:p-5`}
            >
              {/* Crisp 3D dog-ear corner */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-0 right-0 size-7 rounded-bl-xl bg-gradient-to-br from-[#a7f3d0]/90 via-[#ecfdf5] to-white shadow-[inset_-1px_1px_4px_rgba(6,78,59,0.16)] dark:from-[#a7f3d0]/75 dark:via-[#6ee7b7]/45 dark:to-white/80"
              />
              {/* Bold emerald briefcase emblem */}
              <div className="mt-1 inline-flex size-12 items-center justify-center rounded-xl bg-[#10b981]/14 text-[#047857] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] dark:bg-[#a7f3d0]/20 dark:text-[#d1fae5] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.45)]">
                <BriefcaseIcon size={28} />
              </div>
              {/* Embossed clean document lines */}
              <div className="mt-5 space-y-3">
                <div className="h-2.5 w-full rounded-full bg-[#022c22]/22 shadow-[0_1px_0_rgba(255,255,255,0.8)] dark:bg-white/42 dark:shadow-none" />
                <div className="h-2.5 w-[82%] rounded-full bg-[#022c22]/18 shadow-[0_1px_0_rgba(255,255,255,0.8)] dark:bg-white/32 dark:shadow-none" />
                <div className="h-2.5 w-[68%] rounded-full bg-[#047857]/32 shadow-[0_1px_0_rgba(255,255,255,0.8)] dark:bg-[#a7f3d0]/48 dark:shadow-none" />
              </div>
              {/* Luminous white-gold bottom edge rim bloom */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-3 bottom-0 h-1.5 rounded-full bg-gradient-to-r from-white/80 via-white to-amber-100 shadow-[0_0_20px_rgba(255,255,255,1),0_0_32px_rgba(167,243,208,0.9)]"
              />
            </div>

            {/* True specular mirror reflection of Document bottom edge on glossy floor */}
            <div
              aria-hidden
              className="pointer-events-none mx-auto mt-3 h-9 w-36 rounded-b-2xl bg-gradient-to-b from-white/45 via-emerald-200/20 to-transparent blur-[6px]"
              style={{ transform: "skewX(-12deg) scaleY(0.85)" }}
            />
          </div>

          {/* 3. Tightly Proportioned Center Bridge: 3 Tilted 3D Crystal Badges + Luminous S-Wave */}
          <div className="relative z-25 flex w-44 shrink-0 flex-col items-center sm:w-52 lg:w-56">
            {/* Tight triangular cluster of 3 tilted 3D crystal-emerald glass slabs */}
            <div
              className="relative z-30 mb-1 h-32 w-full"
              style={{ perspective: "620px" }}
            >
              {/* Top-center: </> */}
              <div
                aria-hidden
                className={`${styles.floatBadge1} ${styles.employerGlassTile} absolute top-0 left-[44%] inline-flex h-12 w-16 items-center justify-center rounded-xl text-sm font-extrabold tracking-tight text-white`}
              >
                {"</>"}
              </div>
              {/* Middle-left: Layers */}
              <div
                aria-hidden
                className={`${styles.floatBadge2} ${styles.employerGlassTile} absolute top-9 left-[12%] inline-flex h-12 w-16 items-center justify-center rounded-xl text-white`}
              >
                <LayersIcon size={23} />
              </div>
              {/* Bottom-right: Gear */}
              <div
                aria-hidden
                className={`${styles.floatBadge3} ${styles.employerGlassTile} absolute top-16 left-[52%] inline-flex h-12 w-16 items-center justify-center rounded-xl text-white`}
              >
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3.2" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </div>
            </div>

            {/* Luminous Golden-Emerald S-Wave physically connecting Document right edge -> Folder left edge */}
            <svg
              viewBox="0 0 260 92"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden
              className="pointer-events-none -mx-5 -mt-2 h-24 w-[calc(100%+2.5rem)] overflow-visible"
            >
              <defs>
                <linearGradient id="empWaveCore" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                  <stop offset="25%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="55%" stopColor="#fef08a" stopOpacity="1" />
                  <stop offset="85%" stopColor="#a7f3d0" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
                </linearGradient>
                <radialGradient id="empSunburst">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="28%" stopColor="#fef08a" stopOpacity="0.98" />
                  <stop offset="56%" stopColor="#34d399" stopOpacity="0.58" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
                <filter id="empWaveGlow" x="-25%" y="-55%" width="150%" height="210%">
                  <feGaussianBlur stdDeviation="5.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Soft wide outer emerald neon aura */}
              <path
                d="M 0 64 C 46 86, 88 18, 152 24 C 200 28, 224 58, 260 48"
                stroke="#34d399"
                strokeOpacity="0.62"
                strokeWidth="14"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                filter="url(#empWaveGlow)"
              />
              {/* Crisp luminous emerald-gold ribbon body */}
              <path
                ref={pathRef}
                d="M 0 64 C 46 86, 88 18, 152 24 C 200 28, 224 58, 260 48"
                stroke="url(#empWaveCore)"
                strokeWidth="4.2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
              {/* Animated pure white energy current flowing left -> right */}
              <path
                ref={streamRef}
                d="M 0 64 C 46 86, 88 18, 152 24 C 200 28, 224 58, 260 48"
                stroke="#ffffff"
                strokeOpacity="0.98"
                strokeWidth="2.6"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeDasharray="44 96"
              />

              {/* Subtle stardust sparkles floating around the light stream */}
              <circle cx="38" cy="58" r="1.8" fill="#fef08a" opacity="0.85" />
              <circle cx="96" cy="40" r="1.5" fill="#ffffff" opacity="0.8" />
              <circle cx="132" cy="14" r="1.6" fill="#fef08a" opacity="0.75" />
              <circle cx="188" cy="42" r="1.8" fill="#d1fae5" opacity="0.85" />
              <circle cx="222" cy="36" r="1.4" fill="#ffffff" opacity="0.8" />

              {/* 3 Warm golden-white sunburst flares traveling along the S-wave */}
              {[pulse1Ref, pulse2Ref, pulse3Ref].map((pRef, idx) => (
                <g key={idx} ref={pRef} transform="translate(-50,-50)">
                  <circle r="22" fill="url(#empSunburst)" />
                  <line
                    x1="-14"
                    y1="0"
                    x2="14"
                    y2="0"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="0"
                    y1="-12"
                    x2="0"
                    y2="12"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle r="4.5" fill="#ffffff" />
                </g>
              ))}
            </svg>

            {/* Warm golden floor reflection under S-wave */}
            <div
              aria-hidden
              className="pointer-events-none -mt-1 h-7 w-32 rounded-full bg-gradient-to-b from-amber-200/45 via-emerald-300/20 to-transparent blur-[8px]"
            />
          </div>

          {/* 4. Floating 3D Crystal-Glass Neon Folder + Mirror Floor Reflection */}
          <div className="relative z-30 shrink-0 sm:mt-8" style={{ perspective: "780px" }}>
            <div
              aria-label={folderLabel}
              className={`${styles.floatFolderCard} ${styles.employerFolder3d} relative flex h-44 w-36 items-center justify-center rounded-[1.35rem] p-3 sm:h-48 sm:w-40`}
            >
              {/* Glowing crystal dog-ear corner */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-0 right-0 size-7 rounded-bl-xl bg-gradient-to-br from-white/80 via-emerald-200/60 to-transparent"
              />
              {/* Crisp glowing white Folder icon */}
              <svg
                viewBox="0 0 64 52"
                fill="none"
                aria-hidden
                className="h-15 w-17 drop-shadow-[0_0_18px_rgba(255,255,255,0.95)]"
              >
                <path
                  d="M6 12C6 8.686 8.686 6 12 6H24L29 12H52C55.314 12 58 14.686 58 18V40C58 43.314 55.314 46 52 46H12C8.686 46 6 43.314 6 40V12Z"
                  stroke="#ffffff"
                  strokeWidth="3.4"
                  fill="rgba(52,211,153,0.22)"
                />
              </svg>
              {/* Bright white-gold bottom-right glass edge bloom */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-3 bottom-0 h-1.5 rounded-full bg-gradient-to-r from-emerald-100/80 via-white to-amber-100 shadow-[0_0_22px_rgba(255,255,255,1),0_0_34px_rgba(110,231,183,0.95)]"
              />
            </div>

            {/* True specular mirror reflection of Folder bottom crystal edge on glossy floor */}
            <div
              aria-hidden
              className="pointer-events-none mx-auto mt-3 h-9 w-36 rounded-b-2xl bg-gradient-to-b from-emerald-100/50 via-emerald-300/20 to-transparent blur-[6px]"
              style={{ transform: "skewX(10deg) scaleY(0.85)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
