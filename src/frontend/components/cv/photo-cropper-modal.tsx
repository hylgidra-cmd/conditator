"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  imageSrc: string;
  aspect?: "square" | "portrait";
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
};

/**
 * Telegram / Instagram uslubidagi rasmni surish (pan) va kattalashtirish (zoom) cropper oynasi.
 */
export function PhotoCropperModal({
  imageSrc,
  aspect = "square",
  onCancel,
  onConfirm,
}: Props) {
  const frameW = 260;
  const frameH = aspect === "portrait" ? 330 : 260;

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const baseScale = Math.max(frameW / imgSize.w, frameH / imgSize.h);
  const effectiveScale = baseScale * zoom;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    setOffset({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
    });
  }

  function onPointerUp() {
    dragRef.current.active = false;
  }

  function handleSave() {
    const img = imgRef.current;
    if (!img) return;
    const outW = aspect === "portrait" ? 360 : 400;
    const outH = aspect === "portrait" ? 456 : 400;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);

    const ratio = outW / frameW;
    const drawW = imgSize.w * effectiveScale * ratio;
    const drawH = imgSize.h * effectiveScale * ratio;
    const drawX = (outW - drawW) / 2 + offset.x * ratio;
    const drawY = (outH - drawH) / 2 + offset.y * ratio;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    onConfirm(canvas.toDataURL("image/jpeg", 0.88));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Rasmni moslash
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Rasmni barmoq yoki sichqoncha bilan suring va yaqinlashtiring.
        </p>

        <div className="flex justify-center">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ width: frameW, height: frameH }}
            className="relative cursor-grab touch-none overflow-hidden rounded-2xl border-2 border-[#F07A1A] bg-slate-950 active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              style={{
                width: imgSize.w * effectiveScale,
                height: imgSize.h * effectiveScale,
                maxWidth: "none",
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
              className="pointer-events-none absolute top-1/2 left-1/2 select-none"
            />
            {aspect === "square" && (
              <div className="pointer-events-none absolute inset-3 rounded-full border-2 border-dashed border-white/70" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Kattalashtirish</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#F07A1A]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-[#F07A1A] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#d86912]"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
