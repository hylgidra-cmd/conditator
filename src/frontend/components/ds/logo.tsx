import { cn } from "./cn";

/**
 * Candidator Neo-Editorial Emerald logotipi:
 * 3D oltiburchak/kub (Hexagon Cube) ichida oq "C" ramzi (2 va 4-rasm shabloniga mos).
 */
export function LogoMark({
  className,
}: {
  className?: string;
  tone?: "default" | "night";
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className={cn("h-9 w-9 shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="candidator-hex-top"
          x1="15"
          y1="8"
          x2="85"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient
          id="candidator-hex-left"
          x1="12"
          y1="26"
          x2="50"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient
          id="candidator-hex-right"
          x1="50"
          y1="48"
          x2="88"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>
      {/* 3D Hexagon Cube C */}
      <path
        d="M50 7 L86 28 L69 38 L50 27 L31 38 L31 62 L50 73 L69 62 L86 72 L50 93 L14 72 L14 28 Z"
        fill="url(#candidator-hex-left)"
      />
      <path
        d="M50 7 L86 28 L69 38 L50 27 L14 28 Z"
        fill="url(#candidator-hex-top)"
      />
      <path
        d="M14 28 L31 38 L31 62 L14 72 Z"
        fill="url(#candidator-hex-left)"
      />
      <path
        d="M50 73 L69 62 L86 72 L50 93 L14 72 L31 62 Z"
        fill="url(#candidator-hex-right)"
      />
    </svg>
  );
}

/**
 * Candidator to'liq logotipi:
 * Zumrad nishon + "CANDIDATOR".
 */
export function Logo({
  name = "CANDIDATOR",
  className,
  tone = "default",
}: {
  name?: string;
  tag?: string;
  className?: string;
  tone?: "default" | "night";
}) {
  return (
    <span className={cn("font-ui inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} className="h-8 w-8 sm:h-9 sm:w-9" />
      <span
        className={cn(
          "text-lg font-black tracking-tight sm:text-xl",
          tone === "night" ? "text-white" : "text-foreground",
        )}
      >
        {name}
      </span>
    </span>
  );
}
