import { cn } from "./cn";

/*
 * Dekorativ shakllar kutubxonasi. Hammasi aria-hidden, rang `currentColor` dan
 * (masalan `text-primary`, `text-violet`, `text-ink`), oʻlcham `className` orqali.
 * Joylashtirish: ota element `relative`, shakl `absolute` + top/left sinflari.
 */
type DecorProps = { className?: string };

/** Qalin halqa (PDF: statistika kartasi burchagidagi apelsin halqa). */
export function Ring({
  className,
  thickness = 8,
}: DecorProps & { thickness?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 64"
      fill="none"
      className={cn("text-primary size-16", className)}
    >
      <circle
        cx="32"
        cy="32"
        r={32 - thickness / 2}
        stroke="currentColor"
        strokeWidth={thickness}
      />
    </svg>
  );
}

/** Burilgan kvadrat (PDF: binafsha kvadratlar). Faqat dekor uchun binafsha. */
export function Square({
  className,
  rotate = 18,
}: DecorProps & { rotate?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      className={cn("text-violet size-10", className)}
    >
      <rect
        x="6"
        y="6"
        width="28"
        height="28"
        rx="3"
        fill="currentColor"
        transform={`rotate(${rotate} 20 20)`}
      />
    </svg>
  );
}

/** Toʻgʻri burchakli uchburchak (PDF: hero pastidagi qora uchburchak). */
export function Triangle({
  className,
  flip = false,
}: DecorProps & { flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 60 60"
      className={cn("text-ink size-14", className)}
    >
      <path
        d={flip ? "M0 0 L60 60 L0 60 Z" : "M60 0 L60 60 L0 60 Z"}
        fill="currentColor"
      />
    </svg>
  );
}

/** Yarim doira (PDF: hero rasmi chetidagi qora yarim doira). */
export function HalfCircle({ className }: DecorProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 60 120"
      className={cn("text-ink h-24 w-12", className)}
    >
      <path d="M60 0 A60 60 0 0 0 60 120 Z" fill="currentColor" />
    </svg>
  );
}

/** Kichik kvadrat nuqta (konfetti). */
export function Dot({ className }: DecorProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={cn("text-primary size-3", className)}
    >
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="2"
        fill="currentColor"
        transform="rotate(12 6 6)"
      />
    </svg>
  );
}

/** Qoʻlda chizilgan halqali strelka (PDF: statistika ostidagi strelka). */
export function SquiggleArrow({ className }: DecorProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 60"
      fill="none"
      className={cn("text-ink/70 h-14 w-40", className)}
    >
      <path
        d="M4 12c14 22 36 40 62 38 18-1.5 22-18 9-20-14-2-14 18 4 22 24 5 52-8 74-34"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M140 14l13 4-3 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Spiral chiziq (PDF: profil boʻlimidagi qoʻlda chizilgan halqalar). */
export function Spiral({ className }: DecorProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 60"
      fill="none"
      className={cn("text-primary h-12 w-24", className)}
    >
      <path
        d="M4 40c6-22 22-30 26-18 4 14-14 24-12 8 2-18 26-26 30-10 4 14-14 22-11 6 3-16 28-22 32-6 3 14-12 20-9 5 3-14 26-18 34-4 4 8 2 16-6 20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Uzuq-uzuq egri strelka (PDF: qadamlardan "Yangi intervyu" kartasiga). */
export function DashedArrow({ className }: DecorProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 50"
      fill="none"
      className={cn("text-primary h-10 w-44", className)}
    >
      <path
        d="M196 10C150 4 70 6 12 40"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="5 6"
        strokeLinecap="round"
      />
      <path
        d="M10 28 8 42l14-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Konsentrik yupqa yoylar (PDF: profil rasmi ortidagi apelsin chiziqlar). */
export function ConcentricArcs({
  className,
  count = 6,
}: DecorProps & { count?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      fill="none"
      className={cn("text-primary size-64", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx="100"
          cy="100"
          r={40 + i * 11}
          stroke="currentColor"
          strokeOpacity={0.55 - i * 0.06}
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}

/** Qalin burchak qavsi (PDF: "+100 000" kartasining burchaklari). */
export function CornerBracket({
  className,
  corner = "top-left",
}: DecorProps & { corner?: "top-left" | "bottom-right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 32 32"
      fill="none"
      className={cn(
        "size-8",
        corner === "top-left" ? "text-ink" : "text-primary rotate-180",
        className,
      )}
    >
      <path
        d="M4 30V14C4 8.5 8.5 4 14 4h14"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Ustma-ust burchak strelkalari (PDF: hero oʻng chetidagi apelsin belgilar). */
export function Chevrons({ className }: DecorProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 52"
      fill="none"
      className={cn("text-primary h-13 w-5", className)}
    >
      <path
        d="m4 4 12 11L4 26M4 26l12 11L4 48"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Hero rasmi ortidagi kompozitsiya: katta apelsin gradient doira + diagonal tasma.
 * Rasm (kesilgan, shaffof fonli) shu blokning ichiga, ustiga qoʻyiladi.
 */
export function HeroBackdrop({ className }: DecorProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <div className="from-primary/90 via-primary/40 absolute top-[-30%] right-[-25%] h-[150%] w-[70%] rotate-[32deg] rounded-[3rem] bg-gradient-to-b to-transparent" />
      <div className="from-primary via-primary/70 to-glow absolute top-1/2 left-1/2 aspect-square h-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br" />
    </div>
  );
}

/** Rasm ostidagi yumshoq doira tagfon (tungi rejimda oq fonli kesilgan rasmlar uchun). */
export function SoftBlob({ className }: DecorProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "from-glow to-peach pointer-events-none absolute aspect-square rounded-full bg-radial blur-2xl",
        className,
      )}
    />
  );
}

/** Xira nuqtali xarita naqshi (PDF: "+100 000" ortidagi dunyo xaritasi oʻrniga neytral naqsh). */
export function DotGrid({ className }: DecorProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        "text-ink/10 pointer-events-none absolute inset-0 size-full",
        className,
      )}
    >
      <defs>
        <pattern
          id="ds-dot-grid"
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.4" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ds-dot-grid)" />
    </svg>
  );
}
