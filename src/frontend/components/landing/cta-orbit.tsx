"use client";

import { useEffect, useRef } from "react";
import styles from "./sections.module.css";

/**
 * Pure infinite-resolution vector 3D extruded emerald optical crystal block
 * housing the official faceted CANDIDATOR 'C' mark — razor-sharp at any DPI/zoom,
 * zero raster blur or fog.
 */
function CrystalCBlockSvg() {
  return (
    <svg
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="pointer-events-none size-46 select-none drop-shadow-[0_24px_34px_rgba(2,28,19,0.52)] sm:size-54 lg:size-[232px]"
    >
      <defs>
        {/* 3D Extruded Right/Bottom Crystal Glass Side-Wall Gradient */}
        <linearGradient id="ctaCubeSideWall" x1="185" y1="36" x2="246" y2="236" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ecfdf5" stopOpacity="0.92" />
          <stop offset="22%" stopColor="#6ee7b7" stopOpacity="0.82" />
          <stop offset="56%" stopColor="#10b981" stopOpacity="0.78" />
          <stop offset="84%" stopColor="#a7f3d0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
        </linearGradient>

        {/* Front Emerald Optical Crystal Face Gradient */}
        <linearGradient id="ctaCubeFrontFace" x1="56" y1="38" x2="205" y2="235" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="38%" stopColor="#10b981" />
          <stop offset="76%" stopColor="#059669" />
          <stop offset="100%" stopColor="#046c4e" />
        </linearGradient>

        {/* Inner Recessed Emerald Chamber Depth */}
        <linearGradient id="ctaCubeInnerChamber" x1="68" y1="54" x2="196" y2="222" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
          <stop offset="52%" stopColor="#05875e" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#034d35" stopOpacity="0.98" />
        </linearGradient>

        {/* Glossy Top-Left Specular Glass Reflection Across Crystal Face */}
        <linearGradient id="ctaCubeGlassSheen" x1="60" y1="36" x2="170" y2="155" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.52" />
          <stop offset="42%" stopColor="#d1fae5" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>

        {/* Outer Bevel Rim Specular Highlight */}
        <linearGradient id="ctaCubeRimOuter" x1="48" y1="32" x2="222" y2="242" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#a7f3d0" />
          <stop offset="70%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#ecfdf5" />
        </linearGradient>

        {/* 3D Extruded Side Depth of the White 'C' Mark */}
        <linearGradient id="ctaCExtrude" x1="95" y1="75" x2="195" y2="205" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="55%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>

        {/* Pure Crisp Diamond-White Front & Top Facets of CANDIDATOR 'C' */}
        <linearGradient id="ctaCFrontTop" x1="95" y1="72" x2="185" y2="145" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0fdf4" />
        </linearGradient>
        <linearGradient id="ctaCFrontLeft" x1="88" y1="95" x2="142" y2="205" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ecfdf5" />
        </linearGradient>
        <linearGradient id="ctaCFrontBottom" x1="95" y1="158" x2="188" y2="208" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>

        {/* Crisp Shadow Cast by the 3D White 'C' onto the Inner Emerald Chamber */}
        <filter id="ctaCShadow" x="-15%" y="-15%" width="135%" height="135%">
          <feDropShadow dx="5" dy="7" stdDeviation="4.5" floodColor="#022c1e" floodOpacity="0.48" />
        </filter>
      </defs>

      {/* Tilted 3D Perspective Group ( crisp vector math — zero bitmap blur! ) */}
      <g transform="translate(140 140) rotate(9) skewX(-6) translate(-140 -140)">
        {/* 1. Back/Right 3D Extruded Optical Crystal Side-Wall (offset +20px X, +10px Y) */}
        <rect
          x="68"
          y="46"
          width="166"
          height="182"
          rx="36"
          fill="url(#ctaCubeSideWall)"
          stroke="#ecfdf5"
          strokeOpacity="0.82"
          strokeWidth="1.6"
        />

        {/* Internal Glass Corner Refraction Ribs Connecting Front & Back Crystal Faces */}
        <line x1="196" y1="44" x2="216" y2="54" stroke="#ffffff" strokeOpacity="0.78" strokeWidth="2" strokeLinecap="round" />
        <line x1="212" y1="72" x2="232" y2="82" stroke="#a7f3d0" strokeOpacity="0.65" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="212" y1="192" x2="232" y2="202" stroke="#ffffff" strokeOpacity="0.82" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="188" y1="216" x2="208" y2="226" stroke="#a7f3d0" strokeOpacity="0.72" strokeWidth="1.8" strokeLinecap="round" />

        {/* 2. Front Beveled Emerald Optical Crystal Slab */}
        <rect
          x="48"
          y="36"
          width="166"
          height="182"
          rx="36"
          fill="url(#ctaCubeFrontFace)"
          stroke="url(#ctaCubeRimOuter)"
          strokeWidth="2.6"
        />

        {/* 3. Recessed Inner Crystal Chamber with Crisp Inner Bevel Rim */}
        <rect
          x="60"
          y="48"
          width="142"
          height="158"
          rx="27"
          fill="url(#ctaCubeInnerChamber)"
          stroke="#a7f3d0"
          strokeOpacity="0.55"
          strokeWidth="1.4"
        />

        {/* 4. Glossy Diagonal Top-Left Crystal Specular Sheen */}
        <path
          d="M 76 38 H 184 C 199 38 212 50 212 66 V 104 C 162 112 108 138 50 176 V 66 C 50 50 61 38 76 38 Z"
          fill="url(#ctaCubeGlassSheen)"
        />

        {/* 5. Official CANDIDATOR 3D Faceted Hexagon 'C' Emblem (100% Vector, Pure Crisp White!) */}
        <g transform="translate(65 62) scale(1.32)" filter="url(#ctaCShadow)">
          {/* 3D Right Extrusion Depth Wall of 'C' (+4.5px X, +2.5px Y) */}
          <path
            d="M54.5 9.5 L90.5 30.5 L73.5 40.5 L54.5 29.5 L35.5 40.5 L35.5 64.5 L54.5 75.5 L73.5 64.5 L90.5 74.5 L54.5 95.5 L18.5 74.5 L18.5 30.5 Z"
            fill="url(#ctaCExtrude)"
          />

          {/* Main Pure-White Faceted Hexagon 'C' Body */}
          <path
            d="M50 7 L86 28 L69 38 L50 27 L31 38 L31 62 L50 73 L69 62 L86 72 L50 93 L14 72 L14 28 Z"
            fill="url(#ctaCFrontLeft)"
          />
          {/* Top Bright Diamond-White Facet */}
          <path
            d="M50 7 L86 28 L69 38 L50 27 L14 28 Z"
            fill="url(#ctaCFrontTop)"
          />
          {/* Left Vertical Crisp White Facet */}
          <path
            d="M14 28 L31 38 L31 62 L14 72 Z"
            fill="#ffffff"
          />
          {/* Bottom Mint-Tinted White Facet */}
          <path
            d="M50 73 L69 62 L86 72 L50 93 L14 72 L31 62 Z"
            fill="url(#ctaCFrontBottom)"
          />
          {/* Razor-Sharp Specular Edge Outline on 'C' */}
          <path
            d="M50 7 L86 28 L69 38 L50 27 L31 38 L31 62 L50 73 L69 62 L86 72 L50 93 L14 72 L14 28 Z"
            stroke="#ffffff"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        </g>

        {/* Top-Left & Bottom-Right Specular Corner Glints on Crystal Block */}
        <path
          d="M 55 68 C 55 49 67 38 86 38"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 186 217 C 204 217 213 206 213 188"
          stroke="#ecfdf5"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * Section 6 Studio-3D Centerpiece:
 * - Infinite-resolution vector 3D beveled emerald crystal 'C' block (z-20)
 * - Dual synchronized 60fps HTML5 Canvases (backCanvas z-10, frontCanvas z-30)
 *   rendering a 100% seamless closed 360° 3D diamond-emerald crystal torus ring,
 *   travelling golden-champagne caustics, 4-ray diamond lens flares, and two
 *   intersecting hairline golden-mint starlight orbits.
 */
export function CtaOrbit() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const backCv = backCanvasRef.current;
    const frontCv = frontCanvasRef.current;
    if (!wrap || !backCv || !frontCv) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let rafId = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(260, Math.round(rect.width));
      const h = Math.max(220, Math.round(rect.height));
      for (const cv of [backCv, frontCv]) {
        if (cv.width !== w * dpr || cv.height !== h * dpr) {
          cv.width = w * dpr;
          cv.height = h * dpr;
        }
      }
    };

    const drawStarFlare = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      warm: boolean,
      alpha = 1,
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, radius);
      rg.addColorStop(0, "#ffffff");
      rg.addColorStop(
        0.24,
        warm ? "rgba(254, 240, 138, 0.96)" : "rgba(167, 243, 208, 0.96)",
      );
      rg.addColorStop(0.58, "rgba(52, 211, 153, 0.42)");
      rg.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1.35;
      ctx.lineCap = "round";
      const spike = radius * 0.78;
      ctx.beginPath();
      ctx.moveTo(x - spike, y);
      ctx.lineTo(x + spike, y);
      ctx.moveTo(x, y - spike * 0.72);
      ctx.lineTo(x, y + spike * 0.72);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2.2, radius * 0.14), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawSide = (
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

      const cx = Math.round(width * 0.5);
      const cy = Math.round(height * 0.53);
      const rx = Math.min(width * 0.43, 236);
      const ry = Math.min(height * 0.29, 82);
      const mainTilt = -0.34;

      const projectOrbit = (
        theta: number,
        orx: number,
        ory: number,
        tiltRad: number,
      ) => {
        const lx = Math.cos(theta) * orx;
        const ly = Math.sin(theta) * ory;
        const c = Math.cos(tiltRad);
        const s = Math.sin(tiltRad);
        return {
          x: cx + lx * c - ly * s,
          y: cy + lx * s + ly * c,
        };
      };

      // ---------- 1. Secondary Intersecting Hairline Golden-Mint Filaments ----------
      const drawFilament = (
        orx: number,
        ory: number,
        tiltRad: number,
        strokeColor: string,
        lw: number,
      ) => {
        const sTh = frontHalf ? 0 : Math.PI;
        const eTh = frontHalf ? Math.PI : Math.PI * 2;
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) {
          const th = sTh + ((eTh - sTh) * i) / 64;
          const p = projectOrbit(th, orx, ory, tiltRad);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
      };

      drawFilament(
        rx * 0.94,
        ry * 1.24,
        -0.58,
        frontHalf ? "rgba(254, 240, 138, 0.48)" : "rgba(167, 243, 208, 0.38)",
        1.15,
      );
      drawFilament(
        rx * 1.07,
        ry * 0.72,
        0.07,
        frontHalf ? "rgba(253, 230, 138, 0.44)" : "rgba(110, 231, 183, 0.28)",
        1.05,
      );

      // ---------- 2. Seamless 360° Closed 3D Crystal-Glass Torus Ring ----------
      // Exact integer-pixel complementary clip (zero shadowBlur inside clip so zero shadow step!)
      ctx.save();
      const splitL = cx - 98;
      const splitR = cx + 98;
      ctx.beginPath();
      if (frontHalf) {
        ctx.rect(0, 0, splitL, height);
        ctx.rect(splitR, 0, width - splitR, height);
        ctx.rect(splitL, cy, splitR - splitL, height - cy);
      } else {
        ctx.rect(splitL, 0, splitR - splitL, cy);
      }
      ctx.clip();

      const M = 160;
      const outerPts: Array<{ x: number; y: number }> = [];
      const innerPts: Array<{ x: number; y: number }> = [];
      const wallPts: Array<{ x: number; y: number }> = [];
      const glowOuterPts: Array<{ x: number; y: number }> = [];
      const glowInnerPts: Array<{ x: number; y: number }> = [];

      for (let i = 0; i < M; i++) {
        const th = (i / M) * Math.PI * 2;
        const bendBoost = Math.pow(Math.abs(Math.cos(th)), 1.4);
        const frontBoost = Math.max(0, Math.sin(th));
        const bandW = 13 + bendBoost * 15 + frontBoost * 6;
        const depthWall = 4.5 + bendBoost * 4.5 + frontBoost * 3.5;

        outerPts.push(projectOrbit(th, rx + bandW * 0.55, ry + bandW * 0.36, mainTilt));
        innerPts.push(projectOrbit(th, rx - bandW * 0.45, ry - bandW * 0.34, mainTilt));
        glowOuterPts.push(projectOrbit(th, rx + bandW * 0.85, ry + bandW * 0.58, mainTilt));
        glowInnerPts.push(projectOrbit(th, rx - bandW * 0.75, ry - bandW * 0.54, mainTilt));
        wallPts.push({
          x: outerPts[i].x + 1.5,
          y: outerPts[i].y + depthWall,
        });
      }

      // Soft ambient emerald halo polygon (replaces shadowBlur so clip edges are 100% invisible!)
      ctx.beginPath();
      ctx.moveTo(glowOuterPts[0].x, glowOuterPts[0].y);
      for (let i = 1; i < M; i++) ctx.lineTo(glowOuterPts[i].x, glowOuterPts[i].y);
      ctx.closePath();
      ctx.moveTo(glowInnerPts[0].x, glowInnerPts[0].y);
      for (let i = M - 1; i >= 0; i--) ctx.lineTo(glowInnerPts[i].x, glowInnerPts[i].y);
      ctx.closePath();
      ctx.fillStyle = "rgba(110, 231, 183, 0.14)";
      ctx.fill("evenodd");

      // Pass 2A: Closed 360° Extruded Lower Crystal Side-Wall
      const wallGrad = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
      wallGrad.addColorStop(0, "rgba(236, 253, 245, 0.62)");
      wallGrad.addColorStop(0.24, "rgba(52, 211, 153, 0.36)");
      wallGrad.addColorStop(0.55, "rgba(6, 95, 70, 0.44)");
      wallGrad.addColorStop(0.82, "rgba(110, 231, 183, 0.48)");
      wallGrad.addColorStop(1, "rgba(255, 255, 255, 0.68)");

      ctx.beginPath();
      ctx.moveTo(outerPts[0].x, outerPts[0].y);
      for (let i = 1; i < M; i++) ctx.lineTo(outerPts[i].x, outerPts[i].y);
      ctx.closePath();
      ctx.moveTo(wallPts[0].x, wallPts[0].y);
      for (let i = M - 1; i >= 0; i--) ctx.lineTo(wallPts[i].x, wallPts[i].y);
      ctx.closePath();
      ctx.fillStyle = wallGrad;
      ctx.fill("evenodd");

      // Pass 2B: Closed 360° Translucent Diamond-Emerald-Champagne Crystal Ring Face
      const glassGrad = ctx.createLinearGradient(
        cx - rx,
        cy + ry * 0.5,
        cx + rx,
        cy - ry * 0.5,
      );
      glassGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      glassGrad.addColorStop(0.18, "rgba(254, 243, 199, 0.52)");
      glassGrad.addColorStop(0.48, "rgba(167, 243, 208, 0.36)");
      glassGrad.addColorStop(0.76, "rgba(52, 211, 153, 0.44)");
      glassGrad.addColorStop(1, "rgba(255, 255, 255, 0.84)");

      ctx.beginPath();
      ctx.moveTo(outerPts[0].x, outerPts[0].y);
      for (let i = 1; i < M; i++) ctx.lineTo(outerPts[i].x, outerPts[i].y);
      ctx.closePath();
      ctx.moveTo(innerPts[0].x, innerPts[0].y);
      for (let i = M - 1; i >= 0; i--) ctx.lineTo(innerPts[i].x, innerPts[i].y);
      ctx.closePath();
      ctx.fillStyle = glassGrad;
      ctx.fill("evenodd");

      // Pass 2C: Travelling 60fps Internal Caustic Shimmer Ribbon
      const causticAngle = (t * 0.65) % (Math.PI * 2);
      for (const offset of [0, Math.PI]) {
        const cCenter = causticAngle + offset;
        const cStart = cCenter - 0.38;
        const cEnd = cCenter + 0.38;
        const pA = projectOrbit(cStart, rx, ry, mainTilt);
        const pB = projectOrbit(cEnd, rx, ry, mainTilt);
        const cg = ctx.createLinearGradient(pA.x, pA.y, pB.x, pB.y);
        cg.addColorStop(0, "rgba(255, 255, 255, 0)");
        cg.addColorStop(0.5, "rgba(254, 249, 195, 0.82)");
        cg.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        for (let k = 0; k <= 24; k++) {
          const th = cStart + ((cEnd - cStart) * k) / 24;
          const pt = projectOrbit(th, rx + 2, ry + 1, mainTilt);
          if (k === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = cg;
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Pass 2D: Closed 360° Specular Diamond-White Bevel Rims
      const strokeClosed = (
        arr: Array<{ x: number; y: number }>,
        color: string,
        lw: number,
      ) => {
        ctx.beginPath();
        ctx.moveTo(arr[0].x, arr[0].y);
        for (let i = 1; i < arr.length; i++) ctx.lineTo(arr[i].x, arr[i].y);
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineJoin = "round";
        ctx.stroke();
      };

      strokeClosed(outerPts, "rgba(255, 255, 255, 0.96)", 2.1);
      strokeClosed(innerPts, "rgba(209, 250, 229, 0.86)", 1.5);
      strokeClosed(wallPts, "rgba(167, 243, 208, 0.68)", 1.15);

      ctx.restore();

      // ---------- 3. Specular Lens Flares & Orbiting 3D Starlight Orbs ----------
      if (frontHalf) {
        const leftBend = projectOrbit(Math.PI * 0.9, rx + 4, ry + 2, mainTilt);
        const frontMid = projectOrbit(Math.PI * 0.44, rx, ry, mainTilt);
        const rightGleam = projectOrbit(Math.PI * 0.06, rx - 2, ry, mainTilt);

        drawStarFlare(
          ctx,
          leftBend.x,
          leftBend.y,
          24 + Math.sin(t * 2.4) * 3,
          true,
          0.95,
        );
        drawStarFlare(
          ctx,
          frontMid.x,
          frontMid.y,
          17 + Math.cos(t * 2.9) * 2.5,
          false,
          0.9,
        );
        drawStarFlare(
          ctx,
          rightGleam.x,
          rightGleam.y,
          22 + Math.sin(t * 2.1 + 1.2) * 3,
          true,
          0.92,
        );
      }

      const filamentStars = [
        {
          orx: rx * 0.94,
          ory: ry * 1.24,
          tilt: -0.58,
          phase: 3.65,
          speed: 0.28,
          r: 13,
          warm: true,
        },
        {
          orx: rx * 0.94,
          ory: ry * 1.24,
          tilt: -0.58,
          phase: 4.35,
          speed: 0.28,
          r: 11,
          warm: false,
        },
        {
          orx: rx * 1.07,
          ory: ry * 0.72,
          tilt: 0.07,
          phase: 0.52,
          speed: 0.34,
          r: 16,
          warm: true,
        },
      ];

      for (const st of filamentStars) {
        const th = (st.phase + t * st.speed) % (Math.PI * 2);
        const isFront = Math.sin(th) >= 0;
        if (isFront !== frontHalf) continue;
        const p = projectOrbit(th, st.orx, st.ory, st.tilt);
        drawStarFlare(ctx, p.x, p.y, st.r, st.warm, isFront ? 0.95 : 0.82);
      }

      ctx.restore();
    };

    const renderFrame = (timeSec: number) => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bCtx = backCv.getContext("2d");
      const fCtx = frontCv.getContext("2d");
      if (!bCtx || !fCtx) return;
      drawSide(bCtx, rect.width, rect.height, dpr, timeSec, false);
      drawSide(fCtx, rect.width, rect.height, dpr, timeSec, true);
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
      resize();
      if (mq.matches || document.hidden || !visible) {
        renderFrame(1.2);
        return;
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (mq.matches || !rafId) renderFrame(1.2);
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);

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
    <div
      ref={wrapRef}
      aria-hidden
      className="relative mx-auto flex h-[260px] w-full max-w-[580px] items-center justify-center sm:h-[300px] lg:h-[325px]"
    >
      {/* Luminous emerald-mint volumetric aura behind the 3D crystal sculpture */}
      <div className="pointer-events-none absolute h-52 w-72 rounded-full bg-emerald-300/28 blur-3xl" />

      {/* Back half of thick 3D crystal orbital ring & starlight filaments (behind C block) */}
      <canvas
        ref={backCanvasRef}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      />

      {/* Levitating Infinite-Resolution Vector 3D Emerald Crystal 'C' Block */}
      <div className={`${styles.ctaCubeFloat} relative z-20 select-none`}>
        <CrystalCBlockSvg />
      </div>

      {/* Front half of thick 3D crystal orbital ring & starlight flares (in front of C block) */}
      <canvas
        ref={frontCanvasRef}
        className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      />
    </div>
  );
}
