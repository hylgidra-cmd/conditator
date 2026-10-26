/**
 * Rasm kelguncha neytral siluet (PDF dagi odamlar koʻchirilmaydi). Nisbat 4:5.
 * `standing`: noutbuk ushlagan (hero), `sitting`: oyoqlarini chalishtirib oʻtirgan (profil boʻlimi).
 */
export function FigurePlaceholder({
  label,
  pose = "standing",
}: {
  label: string;
  pose?: "standing" | "sitting";
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 400 500"
      className="size-full"
      preserveAspectRatio="xMidYMax meet"
    >
      {pose === "standing" ? (
        <>
          <g className="fill-white/55">
            <circle cx="200" cy="140" r="78" />
            <path d="M60 500c0-110 62-196 140-196s140 86 140 196Z" />
          </g>
          <rect
            x="92"
            y="352"
            width="216"
            height="128"
            rx="14"
            className="fill-white/70"
            transform="rotate(-8 200 416)"
          />
        </>
      ) : (
        <>
          <g className="fill-white/55">
            <circle cx="205" cy="110" r="62" />
            <path d="M95 360c0-100 50-170 110-170s110 70 110 170Z" />
            <path d="M40 470c10-60 70-100 165-100s155 40 165 100c2 14-8 24-22 24H62c-14 0-24-10-22-24Z" />
          </g>
          <rect
            x="120"
            y="300"
            width="170"
            height="104"
            rx="12"
            className="fill-white/70"
          />
        </>
      )}
    </svg>
  );
}
