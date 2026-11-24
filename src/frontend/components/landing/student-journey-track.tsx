"use client";

import { useEffect, useRef, useState } from "react";
import {
  BriefcaseIcon,
  ChartIcon,
  LayersIcon,
  SearchIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";
import styles from "./sections.module.css";

export type JourneyStepItem = {
  key: string;
  href: string;
  title: string;
  desc: string;
  icon: "search" | "layers" | "chart" | "briefcase";
};

function StepIcon({ kind }: { kind: JourneyStepItem["icon"] }) {
  switch (kind) {
    case "search":
      return <SearchIcon size={28} />;
    case "layers":
      return <LayersIcon size={28} />;
    case "chart":
      return <ChartIcon size={28} />;
    case "briefcase":
      return <BriefcaseIcon size={28} />;
  }
}

/**
 * True 3D elliptical orbital carousel for the 4 student journey tiles:
 * - All 4 tiles orbit continuously 360° around an open luminous center
 * - Front arc moves smoothly LEFT -> RIGHT at full scale and crisp opacity
 * - Back arc curves gracefully RIGHT -> LEFT behind the front ring with realistic 3D depth scaling
 * - Synchronized Canvas 2D draws the glowing 3D emerald glass orbital ring + traveling light flares
 *   split cleanly into back layer (z-5) and mid-front layer (z-16) for convincing front/back occlusion.
 */
export function StudentJourneyTrack({
  steps,
  pauseLabel,
  resumeLabel,
}: {
  steps: JourneyStepItem[];
  pauseLabel: string;
  resumeLabel: string;
}) {
  const [manualPause, setManualPause] = useState(false);
  const manualPauseRef = useRef(false);
  const hoverPauseRef = useRef(false);
  const focusPauseRef = useRef(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useEffect(() => {
    manualPauseRef.current = manualPause;
  }, [manualPause]);

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const backCv = backCanvasRef.current;
    const frontCv = frontCanvasRef.current;
    if (!stage || !track || !backCv || !frontCv) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let rafId = 0;
    let angle = 0.55; // radians, advances continuously so front travels LEFT -> RIGHT
    let lastNow = performance.now();

    const resize = () => {
      const rect = track.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(300, Math.round(rect.width));
      const h = Math.max(260, Math.round(rect.height));
      for (const cv of [backCv, frontCv]) {
        if (cv.width !== w * dpr || cv.height !== h * dpr) {
          cv.width = w * dpr;
          cv.height = h * dpr;
        }
      }
    };

    const drawRingHalf = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      dpr: number,
      thetaOffset: number,
      frontHalf: boolean,
    ) => {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.56;
      const rx = Math.min(width * 0.44, 380);
      const ry = Math.min(height * 0.29, 92);
      const tilt = -0.11;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // θ in [0, π] => frontHalf (left -> right); θ in [π, 2π] => backHalf (right -> left)
      const project = (theta: number, scale = 1, yBias = 0) => {
        const lx = -Math.cos(theta) * rx * scale;
        const ly = Math.sin(theta) * ry * scale + yBias;
        return {
          x: cx + lx * cosT - ly * sinT,
          y: cy + lx * sinT + ly * cosT,
        };
      };

      const startTh = frontHalf ? 0 : Math.PI;
      const endTh = frontHalf ? Math.PI : Math.PI * 2;
      const segs = 76;

      const strokeArc = (
        scale: number,
        yBias: number,
        lw: number,
        style: string | CanvasGradient,
        glow?: string,
        blur = 0,
      ) => {
        ctx.save();
        if (glow && blur > 0) {
          ctx.shadowColor = glow;
          ctx.shadowBlur = blur;
        }
        ctx.beginPath();
        for (let i = 0; i <= segs; i++) {
          const th = startTh + ((endTh - startTh) * i) / segs;
          const pt = project(th, scale, yBias);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineWidth = lw;
        ctx.strokeStyle = style;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      };

      const grad = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
      if (frontHalf) {
        grad.addColorStop(0, "rgba(16, 185, 129, 0.48)");
        grad.addColorStop(0.28, "rgba(5, 150, 105, 0.9)");
        grad.addColorStop(0.5, "rgba(52, 211, 153, 0.96)");
        grad.addColorStop(0.76, "rgba(5, 150, 105, 0.9)");
        grad.addColorStop(1, "rgba(16, 185, 129, 0.48)");
      } else {
        grad.addColorStop(0, "rgba(16, 185, 129, 0.25)");
        grad.addColorStop(0.5, "rgba(5, 150, 105, 0.36)");
        grad.addColorStop(1, "rgba(16, 185, 129, 0.25)");
      }

      // Soft emerald outer halo
      strokeArc(
        1.0,
        2,
        frontHalf ? 18 : 10,
        frontHalf ? "rgba(16, 185, 129, 0.24)" : "rgba(16, 185, 129, 0.1)",
        "rgba(16, 185, 129, 0.65)",
        frontHalf ? 14 : 6,
      );
      // Primary glossy 3D emerald glass ring
      strokeArc(
        1.0,
        0,
        frontHalf ? 9.5 : 5.2,
        grad,
        "rgba(5, 150, 105, 0.6)",
        frontHalf ? 10 : 4,
      );
      // Upper specular white crystal rim
      strokeArc(
        0.994,
        -2.8,
        frontHalf ? 2.2 : 1.1,
        frontHalf ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.32)",
      );
      // Thin secondary outer mint thread
      strokeArc(
        1.05,
        5,
        frontHalf ? 1.4 : 0.85,
        frontHalf ? "rgba(167, 243, 208, 0.65)" : "rgba(167, 243, 208, 0.2)",
      );

      // Orbiting bright golden-white light flares traveling along the 3D orbit
      const flares = [0.2, 1.85, 3.4, 5.05];
      for (const phase of flares) {
        const th = (thetaOffset * 1.45 + phase) % (Math.PI * 2);
        const isFront = Math.sin(th) >= 0;
        if (isFront !== frontHalf) continue;

        const pt = project(th, 1.0, 0);
        const r = frontHalf ? 4.4 : 2.6;
        ctx.save();
        ctx.globalAlpha = frontHalf ? 0.96 : 0.42;
        const rg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 4.4);
        rg.addColorStop(0, "#ffffff");
        rg.addColorStop(0.28, "#fef08a");
        rg.addColorStop(0.6, "rgba(52, 211, 153, 0.5)");
        rg.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * 4.4, 0, Math.PI * 2);
        ctx.fill();

        if (frontHalf) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(pt.x - 13, pt.y);
          ctx.lineTo(pt.x + 13, pt.y);
          ctx.moveTo(pt.x, pt.y - 11);
          ctx.lineTo(pt.x, pt.y + 11);
          ctx.stroke();
        }
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    };

    const renderScene = (currentAngle: number) => {
      const rect = track.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(300, rect.width);
      const h = Math.max(260, rect.height);
      const isCompact = w < 600;
      const cardW = isCompact ? 128 : 156;
      const cardH = isCompact ? 126 : 148;

      const bCtx = backCv.getContext("2d");
      const fCtx = frontCv.getContext("2d");
      if (bCtx && fCtx) {
        drawRingHalf(bCtx, w, h, dpr, currentAngle, false);
        drawRingHalf(fCtx, w, h, dpr, currentAngle, true);
      }

      const cx = w * 0.5;
      const cy = h * 0.52;
      const rx = Math.min(w * 0.39, 340);
      const ry = Math.min(h * 0.25, 76);
      const tilt = -0.11;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      const count = steps.length;
      for (let i = 0; i < count; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        // Evenly spaced 90° apart around the full 360° 3D orbit
        const th = mq.matches
          ? 0.42 + (i * Math.PI * 2) / count
          : (currentAngle + (i * Math.PI * 2) / count) % (Math.PI * 2);

        // Front (sin >= 0): left -> right; Back (sin < 0): right -> left behind center
        const lx = -Math.cos(th) * rx;
        const ly = Math.sin(th) * ry;
        const px = cx + lx * cosT - ly * sinT;
        const py = cy + lx * sinT + ly * cosT;

        // 3D depth factor: 0 = farthest back, 1 = closest front
        const depth = (Math.sin(th) + 1) / 2;
        const scale = 0.72 + depth * 0.32; // 0.72 back -> 1.04 front
        const opacity = 0.54 + depth * 0.46; // 0.54 back -> 1.00 front
        // Layer cleanly: back cards (z 6..15) pass behind front ring (z-16); front cards sit on z 18..28
        const zIdx = Math.sin(th) >= 0 ? 18 + Math.round(depth * 10) : 6 + Math.round(depth * 8);

        card.style.transform = `translate3d(${(px - cardW / 2).toFixed(1)}px, ${(py - cardH / 2).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(zIdx);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastNow) * 0.001));
      lastNow = now;

      const isPaused =
        manualPauseRef.current ||
        hoverPauseRef.current ||
        focusPauseRef.current ||
        mq.matches ||
        document.hidden ||
        !visible;

      if (!isPaused) {
        angle = (angle + dt * 0.46) % (Math.PI * 2);
        renderScene(angle);
      }

      if (visible && !document.hidden && !mq.matches) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const start = () => {
      resize();
      lastNow = performance.now();
      renderScene(angle);
      if (!mq.matches && visible && !document.hidden && !rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const ro = new ResizeObserver(() => {
      resize();
      renderScene(angle);
    });
    ro.observe(track);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(stage);

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
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onMotion);
    };
  }, [steps.length]);

  return (
    <div
      ref={stageRef}
      className={styles.journeyTrackStage}
      onMouseEnter={() => {
        hoverPauseRef.current = true;
      }}
      onMouseLeave={() => {
        hoverPauseRef.current = false;
      }}
      onFocusCapture={() => {
        focusPauseRef.current = true;
      }}
      onBlurCapture={(e) => {
        if (!stageRef.current?.contains(e.relatedTarget as Node | null)) {
          focusPauseRef.current = false;
        }
      }}
    >
      <div className="relative z-30 mb-1 flex justify-end pr-2">
        <button
          type="button"
          onClick={() => setManualPause((prev) => !prev)}
          aria-pressed={manualPause}
          className="border-line/80 bg-card/85 text-subtle hover:border-primary/45 hover:text-primary-text inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold backdrop-blur-sm transition-colors"
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${manualPause ? "bg-amber-500" : "bg-emerald-500"}`}
          />
          <span>{manualPause ? resumeLabel : pauseLabel}</span>
        </button>
      </div>

      {/* True 360° 3D orbital stage: Back ring (z-5) -> Back cards (z-6..14) -> Front ring (z-16) -> Front cards (z-18..28) */}
      <div
        ref={trackRef}
        className={styles.marqueeTrack}
        data-paused={manualPause ? "true" : "false"}
      >
        <canvas
          ref={backCanvasRef}
          aria-hidden
          className={styles.journeyOrbitBack}
        />

        {steps.map((step, idx) => (
          <Link
            key={step.key}
            href={step.href}
            title={step.desc}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            className={styles.journeyGlassTile}
          >
            <span className={styles.journeyTileIcon}>
              <StepIcon kind={step.icon} />
            </span>
            <span className={styles.journeyTileTitle}>{step.title}</span>
            <span className="sr-only">{step.desc}</span>
          </Link>
        ))}

        <canvas
          ref={frontCanvasRef}
          aria-hidden
          className={styles.journeyOrbitFront}
        />
      </div>
    </div>
  );
}
