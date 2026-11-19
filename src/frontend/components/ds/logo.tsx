import { cn } from "./cn";

/**
 * Candidator Neo-Editorial Emerald logotipi:
 * Zumrad-Feruza (Emerald → Teal) squircle nishoni ichida "C" va galstuk ramzi.
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
          id="candidator-emerald-bg"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#062C22" />
          <stop offset="55%" stopColor="#047857" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient
          id="candidator-tie-grad"
          x1="40"
          y1="28"
          x2="58"
          y2="82"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="55%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="26"
        fill="url(#candidator-emerald-bg)"
      />
      {/* "C" harfi */}
      <path
        d="M 73 27 A 33 33 0 1 0 73 73 L 64 64 A 21 21 0 1 1 64 36 Z"
        fill="#FFFFFF"
      />
      {/* Galstuk tuguni */}
      <path
        d="M 44 33 Q 44 32 45 32 L 53 32 Q 54 32 54 33 L 53 41 Q 53 42 52 42 L 46 42 Q 45 42 45 41 Z"
        fill="url(#candidator-tie-grad)"
      />
      {/* Galstuk asosiy qismi */}
      <path
        d="M 45.5 43.5 L 52.5 43.5 L 57 69 L 49 80 L 41 69 Z"
        fill="url(#candidator-tie-grad)"
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
