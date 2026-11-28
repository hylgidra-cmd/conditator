import { cn } from "./cn";

/**
 * Candidator rasmiy logotipi:
 * 3D qora "C" harfi va markazida to'q sariq galstuk ramzi (`public/brand/logo-mark.png`).
 */
export function LogoMark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "night";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-colors",
        tone === "night"
          ? "bg-white/95 p-0.5 shadow-sm"
          : "dark:bg-white/95 dark:p-0.5 dark:shadow-sm",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-mark.png"
        alt=""
        aria-hidden
        width={40}
        height={40}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

/**
 * Candidator to'liq logotipi:
 * "C" + galstuk ramzi + "CANDIDATOR".
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
      <LogoMark tone={tone} className="h-9 w-9 sm:h-10 sm:w-10" />
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
