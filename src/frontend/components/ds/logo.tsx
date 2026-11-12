import { cn } from "./cn";

/**
 * Candidator yangi vektor SVG logo belgisi:
 * Qora (yoki oq) "C" harfi (#1A1A1A), ichida to'q sariq galstuk (#F07A1A).
 */
export function LogoMark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "night";
}) {
  const cColor = tone === "night" ? "#FFFFFF" : "#1A1A1A";
  const tieColor = "#F07A1A";

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className={cn("h-8 w-8 shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* "C" harfi — tekis, geometrik qora/oq aylana arkasi */}
      <path
        d="M 75 23 A 38 38 0 1 0 75 77 L 65 67 A 24 24 0 1 1 65 33 Z"
        fill={cColor}
      />
      {/* Galstuk tuguni (yuqori qism) */}
      <path
        d="M 43 32 Q 43 31 44 31 L 52 31 Q 53 31 53 32 L 52 40 Q 52 41 51 41 L 45 41 Q 44 41 44 40 Z"
        fill={tieColor}
      />
      {/* Galstuk asosiy qismi */}
      <path
        d="M 44.5 42.5 L 51.5 42.5 L 56 71 L 48 83 L 40 71 Z"
        fill={tieColor}
      />
    </svg>
  );
}

/**
 * Candidator to'liq logotipi:
 * Logo belgisi + "CANDIDATOR" matni.
 */
export function Logo({
  name = "CANDIDATOR",
  tag,
  className,
  tone = "default",
}: {
  name?: string;
  tag?: string;
  className?: string;
  /** `night`: to'q fonda (footer). */
  tone?: "default" | "night";
}) {
  return (
    <span className={cn("font-ui inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} className="h-7 w-7" />
      <span
        className={cn(
          "text-xl font-black tracking-tight",
          tone === "night" ? "text-white" : "text-[#1A1A1A] dark:text-white",
        )}
      >
        {name}
      </span>
      {tag ? (
        <span className="-ml-0.5 self-start rounded bg-[#F07A1A] px-1 py-px text-[0.625rem] leading-tight font-extrabold tracking-wide text-white">
          {tag}
        </span>
      ) : null}
    </span>
  );
}
