import { cn } from "./cn";

/** Logo belgisi: alanga/tomchi shakli, ichida kichik yorugʻlik tomchisi. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 28" className={cn("h-7 w-6", className)}>
      <path
        d="M12 1.5c.6 3.7 3 5.6 5.2 7.9 2.1 2.2 3.8 4.6 3.8 8.2A9 9 0 0 1 3 17.6c0-3.4 1.6-5.6 3.3-7.4.4 1.9 1.4 3 2.7 3.5C8.5 9 9.6 4.6 12 1.5Z"
        className="fill-primary"
      />
      <path
        d="M12.3 13.2c1.6 1.6 3.2 3 3.2 5.2a3.5 3.5 0 0 1-7 0c0-1.3.6-2.2 1.3-3 .2.9.7 1.4 1.3 1.6-.2-1.4.2-2.8 1.2-3.8Z"
        className="fill-canvas"
      />
    </svg>
  );
}

/** "JUMIS" + kichik "AI" belgisi. Matnlar tarjimadan keladi. */
export function Logo({
  name,
  tag,
  className,
  tone = "default",
}: {
  name: string;
  tag: string;
  className?: string;
  /** `night`: toʻq fonda (footer). */
  tone?: "default" | "night";
}) {
  return (
    <span className={cn("font-ui inline-flex items-center gap-2", className)}>
      <LogoMark
        className={
          tone === "night" ? "[&>path:last-child]:fill-night" : undefined
        }
      />
      <span
        className={cn(
          "text-xl font-extrabold tracking-tight",
          tone === "night" ? "text-on-night" : "text-text",
        )}
      >
        {name}
      </span>
      <span className="bg-primary text-on-primary -ml-0.5 self-start rounded px-1 py-px text-[0.625rem] leading-tight font-extrabold tracking-wide">
        {tag}
      </span>
    </span>
  );
}
