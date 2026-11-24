/**
 * Vibrant glowing emerald silhouette & constellation network map of Uzbekistan.
 * Positioned behind the upper crystal globe matching the deployed reference contrast.
 */
export function HeroUzbMap({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 420"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="uzbFillRich" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.92" />
          <stop offset="48%" stopColor="#10b981" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.82" />
        </linearGradient>
        <radialGradient id="uzbOuterAura" cx="52%" cy="48%" r="52%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#10b981" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="uzbBorderNeon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#a7f3d0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ecfdf5" stopOpacity="0.9" />
        </linearGradient>
        <filter id="uzbBloom" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="uzbStarGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft emerald ambient halo behind map */}
      <ellipse cx="330" cy="188" rx="285" ry="155" fill="url(#uzbOuterAura)" />

      {/* Vivid Uzbekistan geographical silhouette */}
      <path
        d="M 52 96 L 94 74 L 138 78 L 166 44 L 194 64 L 222 104 L 258 106 L 288 128 L 326 122 L 358 148 L 398 146 L 424 128 L 456 96 L 486 98 L 494 124 L 516 128 L 542 120 L 584 122 L 592 146 L 568 172 L 538 178 L 496 168 L 478 188 L 454 202 L 436 226 L 454 252 L 452 292 L 422 322 L 386 306 L 368 274 L 326 266 L 278 242 L 242 224 L 204 202 L 154 198 L 116 176 L 84 166 L 62 132 Z"
        fill="url(#uzbFillRich)"
        stroke="url(#uzbBorderNeon)"
        strokeWidth="2.6"
        strokeLinejoin="round"
        filter="url(#uzbBloom)"
      />

      {/* Crisp interior constellation network */}
      <g stroke="#d1fae5" strokeOpacity="0.62" strokeWidth="1.25">
        <line x1="112" y1="118" x2="178" y2="86" />
        <line x1="178" y1="86" x2="218" y2="152" />
        <line x1="112" y1="118" x2="218" y2="152" />
        <line x1="218" y1="152" x2="298" y2="176" />
        <line x1="298" y1="176" x2="368" y2="196" />
        <line x1="368" y1="196" x2="462" y2="152" />
        <line x1="368" y1="196" x2="412" y2="278" />
        <line x1="298" y1="176" x2="348" y2="246" />
        <line x1="348" y1="246" x2="412" y2="278" />
        <line x1="462" y1="152" x2="554" y2="146" />
        <line x1="418" y1="146" x2="462" y2="152" />
        <line x1="298" y1="176" x2="334" y2="144" />
        <line x1="334" y1="144" x2="418" y2="146" />
        <line x1="178" y1="86" x2="256" y2="124" />
        <line x1="256" y1="124" x2="298" y2="176" />
        <line x1="462" y1="152" x2="436" y2="226" />
      </g>

      {/* Bright glowing city constellation stars */}
      <g filter="url(#uzbStarGlow)">
        {[
          [112, 118, 3.8],
          [178, 86, 4.4],
          [218, 152, 4.4],
          [256, 124, 3.4],
          [298, 176, 4.5],
          [348, 246, 4.8],
          [368, 196, 5.2],
          [418, 146, 3.8],
          [462, 152, 5.8],
          [554, 146, 4.8],
          [412, 278, 4.4],
        ].map(([cx, cy, r], idx) => (
          <g key={idx}>
            <circle cx={cx} cy={cy} r={r * 2.4} fill="#fef08a" fillOpacity="0.28" />
            <circle cx={cx} cy={cy} r={r} fill="#ffffff" />
          </g>
        ))}
      </g>
    </svg>
  );
}
