"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./auth-globe.module.css";

/**
 * Exact sphere geometry measured from public/auth/auth-globe-core.png (1024x1024):
 * - Sphere center: cx = 496.6, cy = 468.3 (in 1000x1000 viewBox)
 * - Sphere radius: R = 367.7
 *
 * Orbit geometry calibrated to auth-globe-reference.png:
 * - Thin emerald diagonal ellipse tilted at -25.5 deg
 * - Rear arc (theta in [PI, 2*PI], sin < 0) renders behind globe (z-index: 2)
 * - Front arc (theta in [0, PI], sin >= 0) renders in front of globe (z-index: 4)
 * - Clicking/tapping or pressing Enter/Space releases a tasteful autumn leaf fall
 *   strictly clipped inside the glass sphere with foreground & background depth.
 */
const CX = 497;
const CY = 472;
const SPHERE_CX_RATIO = 0.4966;
const SPHERE_CY_RATIO = 0.4683;
const SPHERE_R_RATIO = 0.354;

const RX = 490;
const RY = 142;
const TILT_DEG = -25.5;
const TILT_RAD = (TILT_DEG * Math.PI) / 180;
const COS_T = Math.cos(TILT_RAD);
const SIN_T = Math.sin(TILT_RAD);

const ORBIT_DURATION_MS = 15000; // Calm 15s per full revolution (within 12-18s spec)
const INITIAL_PHASE = -0.18; // Upper-right bead position matching reference

function pointOnOrbit(theta: number) {
  const ex = RX * Math.cos(theta);
  const ey = RY * Math.sin(theta);
  const x = CX + ex * COS_T - ey * SIN_T;
  const y = CY + ex * SIN_T + ey * COS_T;
  const depth = Math.sin(theta); // > 0 = front, < 0 = rear
  return { x, y, depth };
}

function buildHalfArcPath(isFront: boolean): string {
  const start = isFront ? 0 : Math.PI;
  const end = isFront ? Math.PI : Math.PI * 2;
  const steps = 56;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = start + ((end - start) * i) / steps;
    const { x, y } = pointOnOrbit(theta);
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

const REAR_ARC_PATH = buildHalfArcPath(false);
const FRONT_ARC_PATH = buildHalfArcPath(true);

const SPARK_OFFSETS = [
  { offset: 1.55, radius: 3.1, opacity: 0.74 },
  { offset: 3.25, radius: 2.6, opacity: 0.62 },
  { offset: 4.9, radius: 2.9, opacity: 0.68 },
] as const;

// ---------- Autumn Snow-Globe Leaves Physics (depth-layered) ----------
type AutumnLeaf = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  tumblePhase: number;
  tumbleSpeed: number;
  color: string;
  accent: string;
  shape: "maple" | "birch";
  depth: "back" | "front";
  maxAlpha: number;
  alpha: number;
  life: number;
  maxLife: number;
};

// Tasteful golden, amber, and copper autumn palette
const AUTUMN_PALETTE: ReadonlyArray<[string, string]> = [
  ["#e89c1c", "#fef08a"], // Warm golden leaf
  ["#d97706", "#fde047"], // Rich amber
  ["#c85a17", "#fdba74"], // Burnished copper
  ["#b84a14", "#fed7aa"], // Deep copper-russet
  ["#ca8a04", "#fef9c3"], // Honey ochre
];

function createLeafBurst(count: number): AutumnLeaf[] {
  const leaves: AutumnLeaf[] = [];
  for (let i = 0; i < count; i++) {
    const isBack = i < Math.floor(count * 0.46);
    // Spawn near upper interior of the sphere so leaves drift downward naturally
    const spreadX = (Math.random() - 0.5) * 2 * SPHERE_R_RATIO * 0.74;
    const startX = SPHERE_CX_RATIO + spreadX;
    const startY =
      SPHERE_CY_RATIO -
      SPHERE_R_RATIO * (0.72 - Math.random() * (isBack ? 0.38 : 0.48));
    const [color, accent] =
      AUTUMN_PALETTE[Math.floor(Math.random() * AUTUMN_PALETTE.length)];
    const baseSize = isBack
      ? 0.0085 + Math.random() * 0.0055
      : 0.011 + Math.random() * 0.008;

    leaves.push({
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * 0.055,
      vy: isBack
        ? 0.02 + Math.random() * 0.035
        : -0.025 + Math.random() * 0.055,
      size: baseSize,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 2.1,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 1.5 + Math.random() * 1.6,
      swayAmp: isBack
        ? 0.022 + Math.random() * 0.02
        : 0.032 + Math.random() * 0.028,
      tumblePhase: Math.random() * Math.PI * 2,
      tumbleSpeed: 1.8 + Math.random() * 2.1,
      color,
      accent,
      shape: Math.random() > 0.45 ? "maple" : "birch",
      depth: isBack ? "back" : "front",
      maxAlpha: isBack ? 0.5 : 0.88,
      alpha: 0,
      life: 0,
      maxLife: 4.4 + Math.random() * 2.4,
    });
  }
  return leaves;
}

function drawAutumnLeaf(
  ctx: CanvasRenderingContext2D,
  leaf: AutumnLeaf,
  canvasSize: number,
) {
  const px = leaf.x * canvasSize;
  const py = leaf.y * canvasSize;
  const s = leaf.size * canvasSize;
  const tumble = 0.35 + 0.65 * Math.abs(Math.cos(leaf.tumblePhase));

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(leaf.rotation);
  ctx.scale(1, tumble);
  ctx.globalAlpha = leaf.alpha;
  // Background-depth leaves use soft atmospheric blending so architecture & map stay dominant
  if (leaf.depth === "back") {
    ctx.globalCompositeOperation = "soft-light";
  } else {
    ctx.shadowColor = "rgba(69, 26, 3, 0.24)";
    ctx.shadowBlur = Math.max(2, s * 0.25);
    ctx.shadowOffsetY = Math.max(1, s * 0.12);
  }

  const grad = ctx.createLinearGradient(-s, -s, s, s);
  grad.addColorStop(0, leaf.accent);
  grad.addColorStop(0.55, leaf.color);
  grad.addColorStop(1, "#7c2d12");
  ctx.fillStyle = grad;

  ctx.beginPath();
  if (leaf.shape === "maple") {
    ctx.moveTo(0, -s * 1.15);
    ctx.lineTo(s * 0.28, -s * 0.45);
    ctx.lineTo(s * 0.96, -s * 0.56);
    ctx.lineTo(s * 0.5, -s * 0.02);
    ctx.lineTo(s * 0.84, s * 0.46);
    ctx.lineTo(s * 0.24, s * 0.34);
    ctx.lineTo(0, s * 0.84);
    ctx.lineTo(-s * 0.24, s * 0.34);
    ctx.lineTo(-s * 0.84, s * 0.46);
    ctx.lineTo(-s * 0.5, -s * 0.02);
    ctx.lineTo(-s * 0.96, -s * 0.56);
    ctx.lineTo(-s * 0.28, -s * 0.45);
    ctx.closePath();
  } else {
    ctx.moveTo(0, -s * 1.1);
    ctx.bezierCurveTo(s * 0.82, -s * 0.52, s * 0.78, s * 0.44, 0, s * 0.88);
    ctx.bezierCurveTo(-s * 0.78, s * 0.44, -s * 0.82, -s * 0.52, 0, -s * 1.1);
    ctx.closePath();
  }
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 251, 235, 0.4)";
  ctx.lineWidth = Math.max(0.6, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.6);
  ctx.lineTo(0, s * 1.12);
  ctx.stroke();

  ctx.restore();
}

export function AuthBackgroundRibbons() {
  return (
    <div className={styles.studioBackdrop} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/auth/auth-bg-light.webp"
        alt=""
        className={styles.studioBgLight}
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/auth/auth-bg-dark.webp"
        alt=""
        className={styles.studioBgDark}
        draggable={false}
      />
    </div>
  );
}

export function AuthGlobeStage() {
  const tGlobe = useTranslations("Auth.globe");
  const uid = useId().replace(/:/g, "");
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leavesRef = useRef<AutumnLeaf[]>([]);
  const leavesRafRef = useRef<number>(0);
  const reducedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [phase, setPhase] = useState(INITIAL_PHASE);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shaking, setShaking] = useState(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let inView = true;
    let tabVisible = !document.hidden;

    const updatePaused = () => setPaused(!(inView && tabVisible));

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        updatePaused();
      },
      { threshold: 0.05 },
    );
    observer.observe(el);

    const onVisibility = () => {
      tabVisible = !document.hidden;
      updatePaused();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 100);
      lastTime = now;
      setPhase(
        (prev) =>
          (prev + (dt / ORBIT_DURATION_MS) * Math.PI * 2) % (Math.PI * 2),
      );
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion, paused]);

  const renderLeavesFrame = useCallback((dtSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const targetPx = Math.max(1, Math.round(rect.width * dpr));
    if (canvas.width !== targetPx || canvas.height !== targetPx) {
      canvas.width = targetPx;
      canvas.height = targetPx;
    }

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    const list = leavesRef.current;
    if (list.length === 0) return false;

    const cx = SPHERE_CX_RATIO * size;
    const cy = SPHERE_CY_RATIO * size;
    const r = SPHERE_R_RATIO * size;
    const floorY = SPHERE_CY_RATIO + SPHERE_R_RATIO * 0.68;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const nextList: AutumnLeaf[] = [];
    // Draw back-depth leaves first, then front-depth leaves
    const ordered = [...list].sort((a, b) =>
      a.depth === b.depth ? 0 : a.depth === "back" ? -1 : 1,
    );

    for (const leaf of ordered) {
      if (dtSec > 0) {
        leaf.life += dtSec;
        if (leaf.life >= leaf.maxLife) continue;

        leaf.vy += (leaf.depth === "back" ? 0.055 : 0.075) * dtSec;
        const maxVy = leaf.depth === "back" ? 0.085 : 0.11;
        if (leaf.vy > maxVy) leaf.vy = maxVy;
        leaf.vx *= Math.pow(0.55, dtSec);
        leaf.swayPhase += leaf.swaySpeed * dtSec;
        leaf.tumblePhase += leaf.tumbleSpeed * dtSec;
        leaf.rotation += leaf.vRot * dtSec;

        leaf.x += (leaf.vx + Math.sin(leaf.swayPhase) * leaf.swayAmp) * dtSec;
        leaf.y += leaf.vy * dtSec;

        const targetFloor =
          leaf.depth === "back"
            ? SPHERE_CY_RATIO + SPHERE_R_RATIO * 0.45
            : floorY;
        if (leaf.y > targetFloor) {
          leaf.y = targetFloor;
          leaf.vy = 0;
          leaf.vx *= 0.82;
          leaf.vRot *= 0.82;
        }

        const dx = leaf.x - SPHERE_CX_RATIO;
        const dy = leaf.y - SPHERE_CY_RATIO;
        const dist = Math.hypot(dx, dy);
        const maxDist = SPHERE_R_RATIO * 0.92;
        if (dist > maxDist && dist > 0) {
          const scale = maxDist / dist;
          leaf.x = SPHERE_CX_RATIO + dx * scale;
          leaf.y = SPHERE_CY_RATIO + dy * scale;
          leaf.vx *= -0.3;
        }
      }

      const fadeIn = Math.min(1, leaf.life / 0.4);
      const fadeOut = Math.min(1, (leaf.maxLife - leaf.life) / 1.0);
      leaf.alpha = Math.max(0, Math.min(1, fadeIn * fadeOut)) * leaf.maxAlpha;

      drawAutumnLeaf(ctx, leaf, size);
      nextList.push(leaf);
    }

    // Subtle interior glass dome highlight arc over leaves so they stay sealed behind glass
    const domeGrad = ctx.createRadialGradient(
      cx - r * 0.34,
      cy - r * 0.38,
      r * 0.05,
      cx,
      cy,
      r,
    );
    domeGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    domeGrad.addColorStop(0.65, "rgba(255, 255, 255, 0)");
    domeGrad.addColorStop(1, "rgba(209, 250, 229, 0.08)");
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    leavesRef.current = nextList;
    return nextList.length > 0;
  }, []);

  const ensureLeavesLoop = useCallback(() => {
    if (leavesRafRef.current) return;
    if (reducedMotion) {
      renderLeavesFrame(0);
      return;
    }
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const alive = renderLeavesFrame(dt);
      if (alive) {
        leavesRafRef.current = requestAnimationFrame(step);
      } else {
        leavesRafRef.current = 0;
      }
    };
    leavesRafRef.current = requestAnimationFrame(step);
  }, [reducedMotion, renderLeavesFrame]);

  useEffect(() => {
    if (paused && leavesRafRef.current) {
      cancelAnimationFrame(leavesRafRef.current);
      leavesRafRef.current = 0;
    } else if (!paused && leavesRef.current.length > 0) {
      ensureLeavesLoop();
    }
  }, [paused, ensureLeavesLoop]);

  useEffect(() => {
    return () => {
      if (leavesRafRef.current) cancelAnimationFrame(leavesRafRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (reducedClearTimerRef.current)
        clearTimeout(reducedClearTimerRef.current);
    };
  }, []);

  const triggerAutumnLeaves = useCallback(() => {
    const burst = createLeafBurst(26);
    if (reducedMotion) {
      // Static tasteful autumn state that gently clears after 3.5s
      for (const leaf of burst) {
        leaf.life = 1.2;
        leaf.alpha = leaf.maxAlpha;
      }
      leavesRef.current = burst.slice(0, 16);
      renderLeavesFrame(0);
      if (reducedClearTimerRef.current)
        clearTimeout(reducedClearTimerRef.current);
      reducedClearTimerRef.current = setTimeout(() => {
        leavesRef.current = [];
        renderLeavesFrame(0);
      }, 3500);
      return;
    }

    // Controlled particle cap (max 58 leaves)
    leavesRef.current = [...leavesRef.current.slice(-32), ...burst];
    ensureLeavesLoop();

    setShaking(false);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    requestAnimationFrame(() => {
      setShaking(true);
      shakeTimerRef.current = setTimeout(() => setShaking(false), 560);
    });
  }, [ensureLeavesLoop, reducedMotion, renderLeavesFrame]);

  const bead = pointOnOrbit(phase);
  const beadIsFront = bead.depth >= 0;
  const beadScale = 0.84 + ((bead.depth + 1) / 2) * 0.24;

  // Short luminous specular trail gliding right behind the green bead along the same 3D orbit
  const buildTrailPath = (frontOnly: boolean) => {
    const pts: string[] = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = phase - (i / steps) * 0.42;
      const pt = pointOnOrbit(a);
      if ((pt.depth >= 0) === frontOnly) {
        pts.push(`${pts.length === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`);
      }
    }
    return pts.length >= 2 ? pts.join(" ") : "";
  };
  const rearTrailPath = buildTrailPath(false);
  const frontTrailPath = buildTrailPath(true);

  const sparks = SPARK_OFFSETS.map((item, idx) => {
    const pt = pointOnOrbit(phase + item.offset);
    return {
      idx,
      ...pt,
      radius: item.radius * (0.85 + ((pt.depth + 1) / 2) * 0.25),
      opacity: item.opacity * (0.65 + ((pt.depth + 1) / 2) * 0.35),
      isFront: pt.depth >= 0,
    };
  });

  const renderBead = (layer: "rear" | "front") => (
    <g
      transform={`translate(${bead.x.toFixed(2)}, ${bead.y.toFixed(2)}) scale(${beadScale.toFixed(3)})`}
    >
      <circle
        r="17"
        fill={`url(#beadGlow-${layer}-${uid})`}
        opacity={beadIsFront ? 0.8 : 0.45}
      />
      <circle
        r="10.2"
        fill={`url(#beadBody-${layer}-${uid})`}
        stroke="#a7f3d0"
        strokeWidth="1.05"
        strokeOpacity="0.88"
      />
      <ellipse
        cx="-3.1"
        cy="-3.6"
        rx="3.6"
        ry="2.2"
        transform="rotate(-25 -3.1 -3.6)"
        fill="#ffffff"
        opacity="0.9"
      />
    </g>
  );

  const renderSparks = (frontOnly: boolean) => {
    const layer = frontOnly ? "front" : "rear";
    return sparks
      .filter((s) => s.isFront === frontOnly)
      .map((s) => (
        <g
          key={s.idx}
          transform={`translate(${s.x.toFixed(2)}, ${s.y.toFixed(2)})`}
        >
          <circle
            r={s.radius * 2.5}
            fill={`url(#sparkGlow-${layer}-${uid})`}
            opacity={s.opacity * 0.7}
          />
          <circle r={s.radius} fill="#ecfdf5" opacity={s.opacity} />
        </g>
      ));
  };

  return (
    <div
      ref={stageRef}
      className={styles.stageWrap}
      role="button"
      tabIndex={0}
      aria-label={tGlobe("ariaLabel")}
      onClick={triggerAutumnLeaves}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerAutumnLeaves();
        }
      }}
    >
      {/* Layer 1: Restrained ambient glow + physically grounded pedestal contact & spread shadow */}
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.pedestalSpread} aria-hidden="true" />
      <div className={styles.pedestalContact} aria-hidden="true" />

      {/* Layer 2: Rear orbit segment + rear bead/sparks (visibly occluded by globe) */}
      <svg
        className={styles.rearOrbitLayer}
        viewBox="0 0 1000 1000"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={`rearStroke-${uid}`}
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#059669" stopOpacity="0.72" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.78" />
          </linearGradient>
          <radialGradient id={`beadGlow-rear-${uid}`}>
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.72" />
            <stop offset="55%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id={`beadBody-rear-${uid}`}
            cx="35%"
            cy="32%"
            r="68%"
          >
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="32%" stopColor="#34d399" />
            <stop offset="75%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </radialGradient>
          <radialGradient id={`sparkGlow-rear-${uid}`}>
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <filter
            id={`orbitGlowRear-${uid}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={REAR_ARC_PATH}
          stroke="#10b981"
          strokeWidth="4.8"
          strokeOpacity="0.15"
          strokeLinecap="round"
        />
        <path
          d={REAR_ARC_PATH}
          stroke={`url(#rearStroke-${uid})`}
          strokeWidth="2.1"
          strokeLinecap="round"
          filter={`url(#orbitGlowRear-${uid})`}
        />
        {rearTrailPath ? (
          <path
            d={rearTrailPath}
            stroke="#a7f3d0"
            strokeWidth="3.2"
            strokeOpacity="0.65"
            strokeLinecap="round"
            filter={`url(#orbitGlowRear-${uid})`}
          />
        ) : null}
        {renderSparks(false)}
        {!beadIsFront && renderBead("rear")}
      </svg>

      {/* Layer 3: Grounded transparent globe sitting firmly on the glossy tabletop + inside-sphere autumn leaves canvas */}
      <div className={styles.globeGroundedLayer}>
        <div
          className={`${styles.globeInner} ${shaking ? styles.globeShake : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/auth/auth-globe-core.png"
            alt={tGlobe("ariaLabel")}
            className={styles.globeImg}
            width={1024}
            height={1024}
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            className={styles.leavesCanvas}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Layer 4: Front orbit segment + front bead/sparks (in front of globe) */}
      <svg
        className={styles.frontOrbitLayer}
        viewBox="0 0 1000 1000"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={`frontStroke-${uid}`}
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#059669" stopOpacity="0.94" />
            <stop offset="35%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="68%" stopColor="#6ee7b7" stopOpacity="1" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.96" />
          </linearGradient>
          <radialGradient id={`beadGlow-front-${uid}`}>
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.82" />
            <stop offset="55%" stopColor="#10b981" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id={`beadBody-front-${uid}`}
            cx="35%"
            cy="32%"
            r="68%"
          >
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="32%" stopColor="#34d399" />
            <stop offset="75%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </radialGradient>
          <radialGradient id={`sparkGlow-front-${uid}`}>
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <filter
            id={`orbitGlowFront-${uid}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={FRONT_ARC_PATH}
          stroke="#10b981"
          strokeWidth="5.8"
          strokeOpacity="0.18"
          strokeLinecap="round"
        />
        <path
          d={FRONT_ARC_PATH}
          stroke={`url(#frontStroke-${uid})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          filter={`url(#orbitGlowFront-${uid})`}
        />
        <path
          d={FRONT_ARC_PATH}
          stroke="#d1fae5"
          strokeWidth="0.85"
          strokeOpacity="0.72"
          strokeLinecap="round"
        />
        {frontTrailPath ? (
          <path
            d={frontTrailPath}
            stroke="#ecfdf5"
            strokeWidth="3.8"
            strokeOpacity="0.82"
            strokeLinecap="round"
            filter={`url(#orbitGlowFront-${uid})`}
          />
        ) : null}
        {renderSparks(true)}
        {beadIsFront && renderBead("front")}
      </svg>
    </div>
  );
}
