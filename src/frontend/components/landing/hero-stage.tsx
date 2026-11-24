"use client";

import { useEffect, useRef } from "react";
import styles from "./hero.module.css";

type Props = {
  studentAlt: string;
  employerAlt: string;
  globeAlt: string;
};

type OrbitOrb = {
  phase: number;
  speed: number;
  ring: "primary" | "secondary" | "gold";
  radius: number;
  flare: boolean;
  tint: string;
};

const ORBIT_ORBS: OrbitOrb[] = [
  { phase: 0.25, speed: 0.52, ring: "primary", radius: 5.8, flare: true, tint: "#fde047" },
  { phase: 1.5, speed: 0.46, ring: "primary", radius: 6.4, flare: true, tint: "#ffffff" },
  { phase: 2.75, speed: 0.54, ring: "primary", radius: 5.5, flare: true, tint: "#fbbf24" },
  { phase: 4.15, speed: 0.44, ring: "primary", radius: 4.2, flare: false, tint: "#a7f3d0" },
  { phase: 0.9, speed: 0.39, ring: "secondary", radius: 4.8, flare: true, tint: "#fef08a" },
  { phase: 3.4, speed: 0.41, ring: "secondary", radius: 4.4, flare: false, tint: "#6ee7b7" },
  { phase: 1.1, speed: 0.33, ring: "gold", radius: 3.4, flare: false, tint: "#fde68a" },
  { phase: 2.2, speed: 0.36, ring: "gold", radius: 3.0, flare: false, tint: "#fef08a" },
];

function drawLightOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  tint: string,
  flare: boolean,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const haloR = r * (flare ? 4.8 : 3.4);
  const grad = ctx.createRadialGradient(x, y, 0, x, y, haloR);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.24, tint);
  grad.addColorStop(0.54, "rgba(16, 185, 129, 0.52)");
  grad.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, haloR, 0, Math.PI * 2);
  ctx.fill();

  if (flare) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    const arm = r * 3.1;
    ctx.beginPath();
    ctx.moveTo(x - arm, y);
    ctx.lineTo(x + arm, y);
    ctx.moveTo(x, y - arm * 0.85);
    ctx.lineTo(x, y + arm * 0.85);
    ctx.stroke();

    // Subtle diagonal secondary rays for rich diamond starburst look
    ctx.lineWidth = 0.9;
    const diag = arm * 0.55;
    ctx.beginPath();
    ctx.moveTo(x - diag, y - diag);
    ctx.lineTo(x + diag, y + diag);
    ctx.moveTo(x + diag, y - diag);
    ctx.lineTo(x - diag, y + diag);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Photorealistic layered Hero stage matching the deployed visual richness with true 3D independent motion:
 * - z-0: Holographic emerald Uzbekistan constellation map
 * - z-10: Back halves of dual intersecting 3D crystal-emerald glass ribbons + orbiting orbs (behind globe)
 * - z-20: Stationary crystal Registan globe + tilted glass frames with head pop-out independent float
 * - z-30: Front halves of dual 3D crystal-emerald glass ribbons + specular reflections + golden flares
 */
export function HeroStage({ studentAlt, employerAlt, globeAlt }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const backCanvas = backCanvasRef.current;
    const frontCanvas = frontCanvasRef.current;
    if (!stage || !backCanvas || !frontCanvas) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let rafId = 0;

    const resizeCanvases = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(300, Math.round(rect.width));
      const h = Math.max(240, Math.round(rect.height));

      for (const cv of [backCanvas, frontCanvas]) {
        if (cv.width !== w * dpr || cv.height !== h * dpr) {
          cv.width = w * dpr;
          cv.height = h * dpr;
        }
      }
    };

    const drawOrbitHalf = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      dpr: number,
      t: number,
      frontHalf: boolean,
    ) => {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.62;

      const makeProjector = (rx: number, ry: number, tilt: number, yShift = 0) => {
        const cosT = Math.cos(tilt);
        const sinT = Math.sin(tilt);
        return (theta: number, scale = 1, yBias = 0) => {
          const lx = Math.cos(theta) * rx * scale;
          const ly = Math.sin(theta) * ry * scale + yBias;
          return {
            x: cx + lx * cosT - ly * sinT,
            y: cy + yShift + lx * sinT + ly * cosT,
          };
        };
      };

      // Primary wide sweeping 3D emerald glass ribbon
      const projPrimary = makeProjector(width * 0.475, height * 0.175, -0.11, 0);
      // Secondary steeper intersecting crystal glass ribbon (matching deployed dual-loop look)
      const projSecondary = makeProjector(width * 0.445, height * 0.195, -0.24, -10);
      // Outer golden dotted satellite thread
      const projGold = makeProjector(width * 0.49, height * 0.195, -0.09, 14);

      const startTheta = frontHalf ? 0 : Math.PI;
      const endTheta = frontHalf ? Math.PI : Math.PI * 2;
      const steps = 90;

      const draw3DGlassRibbon = (
        proj: (theta: number, scale?: number, yBias?: number) => { x: number; y: number },
        thicknessScale: number,
        isSecondary: boolean,
      ) => {
        const trace = (scale: number, yBias: number) => {
          ctx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const th = startTheta + ((endTheta - startTheta) * i) / steps;
            const pt = proj(th, scale, yBias);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
        };

        const strokePass = (
          scale: number,
          yBias: number,
          lw: number,
          style: string | CanvasGradient,
          blurColor?: string,
          blur = 0,
        ) => {
          ctx.save();
          if (blurColor && blur > 0) {
            ctx.shadowColor = blurColor;
            ctx.shadowBlur = blur;
          }
          trace(scale, yBias);
          ctx.lineWidth = lw * thicknessScale;
          ctx.strokeStyle = style;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        };

        const lx = cx - width * 0.48;
        const rx = cx + width * 0.48;

        // Pass 1: Ambient emerald glow halo
        strokePass(
          1.0,
          2,
          frontHalf ? 24 : 13,
          frontHalf
            ? isSecondary
              ? "rgba(16, 185, 129, 0.22)"
              : "rgba(16, 185, 129, 0.32)"
            : "rgba(16, 185, 129, 0.14)",
          "rgba(16, 185, 129, 0.72)",
          frontHalf ? 18 : 8,
        );

        // Pass 2: Deep forest-emerald 3D outer glass bevel edge
        const baseGrad = ctx.createLinearGradient(lx, cy, rx, cy);
        baseGrad.addColorStop(0, frontHalf ? "rgba(6, 95, 70, 0.78)" : "rgba(6, 95, 70, 0.42)");
        baseGrad.addColorStop(0.28, frontHalf ? "rgba(4, 120, 87, 0.94)" : "rgba(4, 120, 87, 0.56)");
        baseGrad.addColorStop(0.52, frontHalf ? "rgba(5, 150, 105, 0.98)" : "rgba(5, 150, 105, 0.6)");
        baseGrad.addColorStop(0.76, frontHalf ? "rgba(4, 120, 87, 0.94)" : "rgba(4, 120, 87, 0.56)");
        baseGrad.addColorStop(1, frontHalf ? "rgba(6, 95, 70, 0.78)" : "rgba(6, 95, 70, 0.42)");

        strokePass(
          1.0,
          0,
          frontHalf ? 15.5 : 9.2,
          baseGrad,
          "rgba(4, 120, 87, 0.65)",
          frontHalf ? 10 : 4,
        );

        // Pass 3: Luminous translucent emerald core body
        const coreGrad = ctx.createLinearGradient(lx, cy, rx, cy);
        coreGrad.addColorStop(0, frontHalf ? "rgba(167, 243, 208, 0.55)" : "rgba(167, 243, 208, 0.22)");
        coreGrad.addColorStop(0.32, frontHalf ? "rgba(52, 211, 153, 0.92)" : "rgba(52, 211, 153, 0.42)");
        coreGrad.addColorStop(0.5, frontHalf ? "rgba(209, 250, 229, 0.94)" : "rgba(209, 250, 229, 0.45)");
        coreGrad.addColorStop(0.72, frontHalf ? "rgba(16, 185, 129, 0.9)" : "rgba(16, 185, 129, 0.42)");
        coreGrad.addColorStop(1, frontHalf ? "rgba(167, 243, 208, 0.55)" : "rgba(167, 243, 208, 0.22)");

        strokePass(1.0, -0.5, frontHalf ? 8.2 : 4.8, coreGrad);

        // Pass 4: Dual razor-sharp crystal specular white ridges (top & bottom of glass tube)
        strokePass(
          0.992,
          -4.8 * thicknessScale,
          frontHalf ? 2.4 : 1.3,
          frontHalf ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.35)",
          "rgba(255, 255, 255, 0.85)",
          frontHalf ? 6 : 2,
        );
        strokePass(
          1.008,
          4.4 * thicknessScale,
          frontHalf ? 1.8 : 1.0,
          frontHalf ? "rgba(167, 243, 208, 0.82)" : "rgba(167, 243, 208, 0.28)",
        );
      };

      // Draw secondary intersecting glass loop first, then primary bold glass loop
      draw3DGlassRibbon(projSecondary, 0.72, true);
      draw3DGlassRibbon(projPrimary, 1.0, false);

      // Subtle golden outer orbital filament beneath main ribbon
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const th = startTheta + ((endTheta - startTheta) * i) / steps;
        const pt = projGold(th);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.lineWidth = frontHalf ? 1.5 : 0.9;
      ctx.strokeStyle = frontHalf ? "rgba(251, 191, 36, 0.55)" : "rgba(251, 191, 36, 0.18)";
      ctx.stroke();
      ctx.restore();

      // Continuous glowing energy comets racing along both loops
      const comets = [
        { proj: projPrimary, speed: 0.95, offset: 0 },
        { proj: projPrimary, speed: 0.95, offset: Math.PI },
        { proj: projSecondary, speed: -0.78, offset: 1.3 },
      ];
      for (const c of comets) {
        let head = (t * c.speed + c.offset) % (Math.PI * 2);
        if (head < 0) head += Math.PI * 2;
        const tailLen = 0.85;
        const segSteps = 22;
        let started = false;
        let pFirst: { x: number; y: number } | null = null;
        let pLast: { x: number; y: number } | null = null;
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= segSteps; i++) {
          let th = head - Math.sign(c.speed) * (tailLen - (tailLen * i) / segSteps);
          th = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const isFront = Math.sin(th) >= 0;
          if (isFront !== frontHalf) {
            started = false;
            continue;
          }
          const pt = c.proj(th, 1.0, -1);
          if (!pFirst) pFirst = pt;
          pLast = pt;
          if (!started) {
            ctx.moveTo(pt.x, pt.y);
            started = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        if (pFirst && pLast) {
          const cg = ctx.createLinearGradient(pFirst.x, pFirst.y, pLast.x, pLast.y);
          cg.addColorStop(0, "rgba(167, 243, 208, 0)");
          cg.addColorStop(0.6, frontHalf ? "rgba(254, 240, 138, 0.85)" : "rgba(167, 243, 208, 0.25)");
          cg.addColorStop(1, frontHalf ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.45)");
          ctx.lineWidth = frontHalf ? 4.8 : 2.5;
          ctx.lineCap = "round";
          ctx.shadowColor = "rgba(254, 240, 138, 0.95)";
          ctx.shadowBlur = frontHalf ? 16 : 6;
          ctx.strokeStyle = cg;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Radiant emerald core burst right at the lower front of the Registan sphere
      if (frontHalf) {
        const anchor = projPrimary(Math.PI * 0.5, 1.0, 2);
        const pulse = 0.88 + Math.sin(t * 2.5) * 0.12;
        drawLightOrb(ctx, anchor.x, anchor.y, 9.2 * pulse, "#6ee7b7", true, 0.96);
      }

      // Orbiting golden-white & emerald light orbs filtered strictly by depth
      for (const orb of ORBIT_ORBS) {
        const th = (orb.phase + t * orb.speed) % (Math.PI * 2);
        const sinTh = Math.sin(th);
        const isFront = sinTh >= 0;
        if (isFront !== frontHalf) continue;

        const proj =
          orb.ring === "primary"
            ? projPrimary
            : orb.ring === "secondary"
              ? projSecondary
              : projGold;
        const pt = proj(th);
        const depthScale = frontHalf ? 0.82 + sinTh * 0.4 : 0.55;
        drawLightOrb(
          ctx,
          pt.x,
          pt.y,
          orb.radius * depthScale,
          orb.tint,
          orb.flare && frontHalf,
          frontHalf ? 0.98 : 0.44,
        );
      }

      ctx.restore();
    };

    const renderFrame = (timeSec: number) => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bCtx = backCanvas.getContext("2d");
      const fCtx = frontCanvas.getContext("2d");
      if (!bCtx || !fCtx) return;

      drawOrbitHalf(bCtx, rect.width, rect.height, dpr, timeSec, false);
      drawOrbitHalf(fCtx, rect.width, rect.height, dpr, timeSec, true);
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
      renderFrame(now * 0.001);
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      resizeCanvases();
      if (mq.matches || document.hidden || !visible) {
        renderFrame(1.4);
        return;
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(() => {
      resizeCanvases();
      if (mq.matches || !rafId) renderFrame(1.4);
    });
    ro.observe(stage);

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
  }, []);

  return (
    <div ref={stageRef} className={styles.stageScene}>
      {/* Layer 0: Exact holographic Uzbekistan glowing network map */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/hero-uzb-map.png"
        alt=""
        aria-hidden
        width={930}
        height={320}
        className={styles.uzbMapLayer}
      />

      {/* Layer 1: Orbit BACK halves — occluded cleanly behind globe & cards */}
      <canvas
        ref={backCanvasRef}
        aria-hidden
        className={styles.orbitCanvasBack}
      />

      {/* Layer 2A: Independent Student Woman 3D Glass Card (exact deployed artwork, floats independently) */}
      <div className={styles.studentCardPos}>
        <div className={styles.studentFloat}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/hero-student-card.png"
            alt={studentAlt}
            width={441}
            height={467}
            className={styles.cardArtworkImg}
          />
        </div>
      </div>

      {/* Layer 2B: Stationary Center Crystal Registan Globe */}
      <div className={styles.globePos}>
        <div className={styles.globeGlowPedestal} aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/hero-globe.png"
          alt={globeAlt}
          width={380}
          height={380}
          className={styles.globeImg}
        />
      </div>

      {/* Layer 2C: Independent Employer Man 3D Glass Card (exact deployed artwork, staggered float) */}
      <div className={styles.employerCardPos}>
        <div className={styles.employerFloat}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/hero-employer-card.png"
            alt={employerAlt}
            width={387}
            height={442}
            className={styles.cardArtworkImg}
          />
        </div>
      </div>

      {/* Layer 3: Orbit FRONT halves + dual glass ribbons + golden starbursts */}
      <canvas
        ref={frontCanvasRef}
        aria-hidden
        className={styles.orbitCanvasFront}
      />
    </div>
  );
}
