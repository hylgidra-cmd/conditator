"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, CheckIcon } from "@/frontend/components/icons";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Link } from "@/i18n/navigation";
import styles from "./sections.module.css";

export type HowIconName =
  | "graduation"
  | "briefcase"
  | "user"
  | "search"
  | "send"
  | "document"
  | "users"
  | "handshake";

export interface HowStepItem {
  href: string;
  title: string;
  desc: string;
  actionLabel: string;
  stepBadge: string;
  liveBadge: string | null;
  completed: boolean;
  completedLabel: string;
  icon: HowIconName;
}

interface HowItWorksPanelProps {
  heading: string;
  subtitle: string;
  headerIcon: "graduation" | "briefcase";
  steps: [HowStepItem, HowStepItem, HowStepItem];
  phaseOffset?: number;
}

/** Bold, crisp studio-proportioned emerald icons matching the reference artwork. */
function StudioStepIcon({
  name,
  size = 30,
}: {
  name: HowIconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "graduation":
      return (
        <svg {...common}>
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
          <path d="M22 10v6" />
          <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="2" y="7" width="20" height="14" rx="2.5" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <path d="M2 12.5h20" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.8" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.8" />
          <path d="m20 20-3.8-3.8" />
        </svg>
      );
    case "send":
      return (
        <svg {...common}>
          <path d="M21.5 3.5 10.8 14.2" />
          <path d="m21.5 3.5-6.8 17.5-3.9-6.8-6.8-3.9z" />
        </svg>
      );
    case "document":
      return (
        <svg {...common}>
          <rect x="4.5" y="3" width="15" height="18" rx="2.5" />
          <path d="M8.5 8h3" />
          <path d="M8.5 12.5h7" />
          <path d="M8.5 16.5h7" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="2.8" />
          <path d="M7.5 19a4.5 4.5 0 0 1 9 0" />
          <circle cx="5.8" cy="10" r="2.1" />
          <path d="M2.5 18.5a3.5 3.5 0 0 1 3.5-3.2" />
          <circle cx="18.2" cy="10" r="2.1" />
          <path d="M21.5 18.5a3.5 3.5 0 0 0-3.5-3.2" />
        </svg>
      );
    case "handshake":
      return (
        <svg {...common}>
          <path d="m11 17 2 2a1 1 0 1 0 3-3" />
          <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
          <path d="m21 3 1 11h-2" />
          <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
          <path d="M3 4h8" />
        </svg>
      );
  }
}

type Pt = { x: number; y: number; w: number; a: number };

function cubicBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return [
    uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
  ];
}

/**
 * Samples the 3D perspective refractive glass ribbon passing strictly through
 * the 3 saucer pedestals (never below into the label area), matching the template's
 * sweeping left entrance -> 3 pedestals -> graceful right C-loop tail.
 */
function buildRibbonSamples(W: number, H: number): Pt[] {
  const samples: Pt[] = [];
  // Segment 1 (24 pts): Left entrance rising smoothly into Pedestal 1
  const s1: [[number, number], [number, number], [number, number], [number, number]] = [
    [W * 0.025, H * 0.93],
    [W * 0.015, H * 0.72],
    [W * 0.085, H * 0.68],
    [W * 0.175, H * 0.71],
  ];
  // Segment 2 (44 pts): Gentle refractive wave from Pedestal 1 -> Pedestal 2 -> Pedestal 3
  const s2: [[number, number], [number, number], [number, number], [number, number]] = [
    [W * 0.175, H * 0.71],
    [W * 0.36, H * 0.76],
    [W * 0.62, H * 0.65],
    [W * 0.825, H * 0.70],
  ];
  // Segment 3 (36 pts): Graceful 3D perspective C-loop sweeping around right of Pedestal 3
  const s3: [[number, number], [number, number], [number, number], [number, number]] = [
    [W * 0.825, H * 0.70],
    [W * 0.985, H * 0.66],
    [W * 0.99, H * 0.88],
    [W * 0.68, H * 0.95],
  ];

  const pushSeg = (
    seg: [[number, number], [number, number], [number, number], [number, number]],
    count: number,
    tStart: number,
    tEnd: number,
  ) => {
    for (let i = 0; i < count; i++) {
      const localT = i / count;
      const globalT = tStart + (tEnd - tStart) * localT;
      const [x, y] = cubicBezier(seg[0], seg[1], seg[2], seg[3], localT);
      // Taper thickness & opacity smoothly at both ends for true 3D glass ribbon look
      const fadeIn = Math.min(1, globalT / 0.12);
      const fadeOut = Math.min(1, (1 - globalT) / 0.18);
      const a = Math.sin(fadeIn * Math.PI * 0.5) * Math.sin(fadeOut * Math.PI * 0.5);
      // Perspective ribbon width swells slightly on the outer left & right curves
      const swell =
        globalT > 0.76
          ? 1.28 * Math.sin(((globalT - 0.76) / 0.24) * Math.PI)
          : globalT < 0.18
            ? 1.15 * Math.sin((globalT / 0.18) * Math.PI)
            : 0;
      const w = (5.5 + swell * 4.5) * (0.35 + 0.65 * a);
      samples.push({ x, y, w, a });
    }
  };

  pushSeg(s1, 26, 0, 0.24);
  pushSeg(s2, 48, 0.24, 0.72);
  pushSeg(s3, 36, 0.72, 1.0);
  const [lx, ly] = s3[3];
  samples.push({ x: lx, y: ly, w: 1.5, a: 0 });
  return samples;
}

export function HowItWorksPanel({
  heading,
  subtitle,
  headerIcon,
  steps,
  phaseOffset = 0,
}: HowItWorksPanelProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeIdxRef = useRef(0);
  const focusPosRef = useRef(0.24);

  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  // Smooth auto-cycle across the 3 steps when not hovered/focused
  useEffect(() => {
    if (paused) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const id = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 3);
    }, 3800);
    return () => window.clearInterval(id);
  }, [paused]);

  // Real 60fps DPI-aware HTML5 Canvas refractive 3D glass ribbon + caustic pulse
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    let visible = true;
    let raf = 0;
    let W = 0;
    let H = 0;
    let pts: Pt[] = [];

    const pedAnchors = [0.24, 0.48, 0.72];

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = buildRibbonSamples(W, H);
    };

    const renderFrame = (elapsed: number) => {
      if (!pts.length) return;
      ctx.clearRect(0, 0, W, H);

      // Smoothly interpolate golden-emerald focus aura toward active pedestal
      const targetAnchor = pedAnchors[activeIdxRef.current] ?? 0.24;
      focusPosRef.current += (targetAnchor - focusPosRef.current) * 0.08;

      const flowPhase = (elapsed * 0.24 + phaseOffset) % 1;

      // Compute smooth normal vectors at each sample for seamless variable-width optical glass strip (zero segment joints!)
      const upper: Array<{ x: number; y: number }> = [];
      const lower: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < pts.length; i++) {
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const half = pts[i].w * 0.52;
        upper.push({ x: pts[i].x + nx * half, y: pts[i].y + ny * half });
        lower.push({ x: pts[i].x - nx * half, y: pts[i].y - ny * half });
      }

      // Pass 1: Continuous seamless 3D translucent emerald-champagne glass ribbon body
      const bodyGrad = ctx.createLinearGradient(0, 0, W, 0);
      bodyGrad.addColorStop(0, "rgba(52, 211, 153, 0)");
      bodyGrad.addColorStop(0.08, "rgba(52, 211, 153, 0.28)");
      bodyGrad.addColorStop(0.35, "rgba(110, 231, 183, 0.34)");
      bodyGrad.addColorStop(0.65, "rgba(167, 243, 208, 0.38)");
      bodyGrad.addColorStop(0.92, "rgba(52, 211, 153, 0.34)");
      bodyGrad.addColorStop(1, "rgba(52, 211, 153, 0.08)");

      ctx.beginPath();
      ctx.moveTo(upper[0].x, upper[0].y);
      for (let i = 1; i < upper.length; i++) {
        ctx.lineTo(upper[i].x, upper[i].y);
      }
      for (let i = lower.length - 1; i >= 0; i--) {
        ctx.lineTo(lower[i].x, lower[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Continuous top white-mint specular rim
      const specGrad = ctx.createLinearGradient(0, 0, W, 0);
      specGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      specGrad.addColorStop(0.1, "rgba(255, 255, 255, 0.85)");
      specGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
      specGrad.addColorStop(0.92, "rgba(255, 255, 255, 0.88)");
      specGrad.addColorStop(1, "rgba(255, 255, 255, 0.1)");

      ctx.beginPath();
      ctx.moveTo(upper[0].x, upper[0].y);
      for (let i = 1; i < upper.length; i++) {
        ctx.lineTo(upper[i].x, upper[i].y);
      }
      ctx.lineWidth = 1.6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = specGrad;
      ctx.stroke();

      // Continuous lower emerald refractive rim
      const edgeGrad = ctx.createLinearGradient(0, 0, W, 0);
      edgeGrad.addColorStop(0, "rgba(16, 185, 129, 0)");
      edgeGrad.addColorStop(0.1, "rgba(16, 185, 129, 0.42)");
      edgeGrad.addColorStop(0.5, "rgba(5, 150, 105, 0.36)");
      edgeGrad.addColorStop(0.92, "rgba(16, 185, 129, 0.46)");
      edgeGrad.addColorStop(1, "rgba(16, 185, 129, 0.05)");

      ctx.beginPath();
      ctx.moveTo(lower[0].x, lower[0].y);
      for (let i = 1; i < lower.length; i++) {
        ctx.lineTo(lower[i].x, lower[i].y);
      }
      ctx.lineWidth = 1.3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = edgeGrad;
      ctx.stroke();

      // Continuous flowing white-gold shimmer current inside the glass ribbon
      const shimStart = Math.max(0, Math.floor((flowPhase - 0.1) * (pts.length - 1)));
      const shimEnd = Math.min(pts.length - 1, Math.ceil((flowPhase + 0.1) * (pts.length - 1)));
      if (shimEnd > shimStart + 1) {
        const pStart = pts[shimStart];
        const pEnd = pts[shimEnd];
        const shimGrad = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y);
        shimGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        shimGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.92)");
        shimGrad.addColorStop(1, "rgba(254, 240, 138, 0)");

        ctx.beginPath();
        ctx.moveTo(pts[shimStart].x, pts[shimStart].y);
        for (let i = shimStart + 1; i <= shimEnd; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        ctx.strokeStyle = shimGrad;
        ctx.stroke();
      }

      // Pass 2: Travelling golden-mint caustic starlight flare along ribbon
      const starIdx = Math.min(
        pts.length - 1,
        Math.max(0, Math.floor(flowPhase * (pts.length - 1))),
      );
      const sp = pts[starIdx];
      if (sp && sp.a > 0.12) {
        const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 16);
        grad.addColorStop(0, `rgba(255, 255, 255, ${(0.95 * sp.a).toFixed(2)})`);
        grad.addColorStop(0.32, `rgba(254, 240, 138, ${(0.75 * sp.a).toFixed(2)})`);
        grad.addColorStop(0.68, `rgba(52, 211, 153, ${(0.35 * sp.a).toFixed(2)})`);
        grad.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pass 3: Soft warm champagne-emerald caustic glow directly beneath active pedestal
      const focusIdx = Math.min(
        pts.length - 1,
        Math.max(0, Math.round(focusPosRef.current * (pts.length - 1))),
      );
      const fp = pts[focusIdx];
      if (fp) {
        const aura = ctx.createRadialGradient(fp.x, fp.y - 2, 0, fp.x, fp.y - 2, 38);
        aura.addColorStop(0, "rgba(217, 249, 157, 0.42)");
        aura.addColorStop(0.48, "rgba(52, 211, 153, 0.22)");
        aura.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.ellipse(fp.x, fp.y - 2, 38, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    if (reduced) {
      renderFrame(0.35);
    }

    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      renderFrame((ts - startTs) / 1000);
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

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) renderFrame(0.35);
    });
    ro.observe(stage);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(stage);

    const onVis = () => (document.hidden ? stop() : start());
    const onMotion = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      if (reduced) {
        stop();
        renderFrame(0.35);
      } else {
        start();
      }
    };

    document.addEventListener("visibilitychange", onVis);
    mq.addEventListener("change", onMotion);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onMotion);
    };
  }, [phaseOffset]);

  const activeStep = steps[activeIdx] ?? steps[0];
  const floatClasses = [
    styles.howOrbFloat1,
    styles.howOrbFloat2,
    styles.howOrbFloat3,
  ];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={`${styles.howPanelCard} relative flex flex-col justify-between overflow-hidden p-6 sm:p-8`}
    >
      {/* Card Header: Real 3D Crystal Sphere Halo Badge + Bold Title & Subtitle */}
      <div className="relative z-20 flex items-center gap-4">
        <div className={styles.howHeaderSphereWrap} aria-hidden>
          <span className={styles.howHeaderGlow} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/how-crystal-sphere.png"
            alt=""
            width={62}
            height={62}
            className={`${styles.howDayAsset} pointer-events-none relative z-10 size-[60px] select-none object-contain`}
          />
          <span className={`${styles.howNightHeaderOrb} pointer-events-none relative z-10 size-[58px] rounded-full`} />
          <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-[#047857] dark:text-[#a7f3d0]">
            <StudioStepIcon name={headerIcon} size={26} />
          </span>
        </div>

        <div>
          <h3 className="text-text text-xl font-extrabold tracking-tight sm:text-[1.6rem]">
            {heading}
          </h3>
          <p className="text-subtle mt-0.5 text-sm sm:text-[15px]">{subtitle}</p>
        </div>
      </div>

      {/* 3D Crystal Sphere + Saucer Pedestal Stage (Canvas ribbon strictly inside upper stage) */}
      <div className="relative mt-7">
        <div ref={stageRef} className="relative h-36 w-full sm:h-40">
          {/* 60fps Canvas 3D Refractive Glass Ribbon */}
          <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          />

          {/* 3 Interactive 3D Crystal Orbs + Grounded Pedestals + Crisp Emerald Arrows */}
          <div className="relative z-10 grid h-full grid-cols-[1fr_auto_1fr_auto_1fr] items-center px-2 sm:px-4">
            {steps.map((step, idx) => {
              const isActive = idx === activeIdx;
              return (
                <div key={step.title} className="contents">
                  <Link
                    href={step.href}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onFocus={() => setActiveIdx(idx)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center rounded-2xl outline-none",
                      FOCUS_RING,
                    )}
                  >
                    {/* Levitating Ray-Traced 3D Crystal Pearl Sphere */}
                    <div
                      className={cn(
                        "relative z-20 flex size-20 items-center justify-center transition-transform duration-300 sm:size-[92px]",
                        floatClasses[idx],
                        isActive && "-translate-y-1.5 scale-[1.05]",
                      )}
                    >
                      {/* Soft active aura behind sphere */}
                      <span
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute inset-1 rounded-full bg-emerald-300/35 blur-md transition-opacity duration-300",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-75",
                        )}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/landing/how-crystal-sphere.png"
                        alt=""
                        width={92}
                        height={92}
                        className={`${styles.howDayAsset} pointer-events-none relative z-10 size-full select-none object-contain drop-shadow-[0_10px_18px_rgba(6,95,70,0.14)]`}
                      />
                      <span
                        aria-hidden
                        className={`${styles.howNightOrb} pointer-events-none relative z-10 size-[82px] rounded-full sm:size-[88px]`}
                      />
                      {/* Bold Crisp Studio Emerald Icon centered inside refractive crystal sphere */}
                      <span
                        className={cn(
                          "pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-transform duration-300",
                          isActive
                            ? "scale-105 text-[#047857] dark:text-[#ecfdf5]"
                            : "text-[#047857]/90 group-hover:scale-105 dark:text-[#6ee7b7]",
                        )}
                      >
                        <StudioStepIcon name={step.icon} size={31} />
                      </span>

                      {/* Real DB completion badge when user already completed this step */}
                      {step.completed ? (
                        <span
                          title={step.completedLabel}
                          className="absolute top-0.5 right-0.5 z-30 inline-flex size-5 items-center justify-center rounded-full border border-white bg-[#059669] text-white shadow-xs"
                        >
                          <CheckIcon size={11} />
                        </span>
                      ) : null}
                    </div>

                    {/* Grounded 3D Champagne-Emerald Glass Saucer Pedestal */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/landing/how-crystal-pedestal.png"
                      alt=""
                      width={116}
                      height={41}
                      className={cn(
                        styles.howDayAsset,
                        "pointer-events-none relative z-10 -mt-3.5 h-9 w-24 select-none object-contain transition-all duration-300 sm:-mt-4 sm:h-10 sm:w-28",
                        isActive
                          ? "scale-105 brightness-105 drop-shadow-[0_6px_14px_rgba(16,185,129,0.28)]"
                          : "opacity-95",
                      )}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        styles.howNightPedestal,
                        "pointer-events-none relative z-10 -mt-2.5 h-5 w-20 rounded-full transition-all duration-300 sm:-mt-3 sm:h-5.5 sm:w-24",
                        isActive && "scale-105 brightness-115",
                      )}
                    />
                  </Link>

                  {/* Crisp Emerald Arrow centered cleanly between spheres */}
                  {idx < steps.length - 1 ? (
                    <div
                      aria-hidden
                      className="flex items-center justify-center pb-5"
                    >
                      <svg
                        width="26"
                        height="18"
                        viewBox="0 0 26 18"
                        fill="none"
                        className={cn(
                          "transition-all duration-300",
                          idx === activeIdx
                            ? "translate-x-0.5 text-emerald-600 dark:text-emerald-400"
                            : "text-emerald-700/75 dark:text-emerald-400/70",
                        )}
                      >
                        <path
                          d="M2 9H22.5M16.5 3.5L22.5 9L16.5 14.5"
                          stroke="currentColor"
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clean Spotless Step Titles Row BELOW the glass stage (zero ribbon overlap!) */}
        <div className="mt-1 grid min-h-[2.5rem] grid-cols-[1fr_auto_1fr_auto_1fr] items-start px-2 sm:px-4">
          {steps.map((step, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div key={step.title} className="contents">
                <Link
                  href={step.href}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onFocus={() => setActiveIdx(idx)}
                  className={cn(
                    "mx-auto max-w-[132px] rounded-lg px-1 py-0.5 text-center text-xs leading-tight font-extrabold transition-colors sm:text-[15px]",
                    isActive
                      ? "text-[#065f46] dark:text-[#6ee7b7]"
                      : "text-text hover:text-[#047857] dark:hover:text-[#6ee7b7]",
                    FOCUS_RING,
                  )}
                >
                  {step.title}
                </Link>
                {idx < steps.length - 1 ? (
                  <span aria-hidden className="w-[26px]" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Fullstack Action Bar: Live DB Status + Direct Role-Aware Action */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#064e3b]/8 bg-[#ecfdf5]/55 px-3.5 py-2.5 sm:flex-nowrap dark:border-emerald-400/20 dark:bg-[#072219]/85">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#059669]/12 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[#065f46] dark:bg-emerald-400/18 dark:text-[#6ee7b7]">
            {activeStep.stepBadge}
          </span>
          <span className="text-text truncate text-xs font-semibold sm:text-[13px]">
            {activeStep.desc}
          </span>
          {activeStep.completed ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#059669] px-2 py-0.5 text-[11px] font-bold text-white">
              <CheckIcon size={10} />
              <span>{activeStep.completedLabel}</span>
            </span>
          ) : activeStep.liveBadge ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#10b981]/25 bg-white/85 px-2.5 py-0.5 text-[11px] font-bold text-[#065f46] dark:border-emerald-400/30 dark:bg-[#0a2e22] dark:text-[#a7f3d0]">
              <span className="size-1.5 rounded-full bg-[#10b981]" />
              <span>{activeStep.liveBadge}</span>
            </span>
          ) : null}
        </div>

        <Link
          href={activeStep.href}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#065f46] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:-translate-y-0.5 hover:bg-[#047857] dark:bg-gradient-to-r dark:from-[#10b981] dark:to-[#059669] dark:text-white dark:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)]",
            FOCUS_RING,
          )}
        >
          <span>{activeStep.actionLabel}</span>
          <ArrowRightIcon size={13} />
        </Link>
      </div>
    </div>
  );
}
