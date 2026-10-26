import Image from "next/image";
import { cn } from "./cn";

export type AvatarTone =
  "primary" | "violet" | "teal" | "sun" | "night" | "cool";

// Rasmsiz avatar fonlari (PDF dagi rangli doiralar). Matn har birida AA dan yuqori.
const TONES: Record<AvatarTone, string> = {
  primary: "bg-primary text-on-primary",
  violet: "bg-[#d9d0ff] text-[#2a1a73]",
  teal: "bg-[#bfe9e4] text-[#0d3d38]",
  sun: "bg-[#ffd66b] text-[#4a3500]",
  night: "bg-night text-on-night",
  cool: "bg-card-cool text-text",
};

const SIZES = {
  sm: "size-8 text-[0.6875rem]",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
} as const;

const PIXELS = { sm: 32, md: 44, lg: 56, xl: 80 } as const;

export type AvatarProps = {
  initials: string;
  /** Rasm boʻlsa `public/images/` dan; boʻlmasa bosh harflar chiziladi. */
  src?: string;
  alt?: string;
  tone?: AvatarTone;
  size?: keyof typeof SIZES;
  className?: string;
};

/** Toʻliq doira avatar. Rasmsiz holatda bosh harflar (soxta odam rasmlari ishlatilmaydi). */
export function Avatar({
  initials,
  src,
  alt = "",
  tone = "cool",
  size = "md",
  className,
}: AvatarProps) {
  return (
    <span
      className={cn(
        "font-ui relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold",
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={PIXELS[size]}
          height={PIXELS[size]}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden={alt ? undefined : true}>{initials}</span>
      )}
    </span>
  );
}

/**
 * Bir-birining ustiga chiqqan avatarlar qatori. Koʻp boʻlsa oxirida "+N".
 * Guruh bitta rasm sifatida o'qiladi: `label` majburiy.
 */
export function AvatarGroup({
  people,
  label,
  max = 3,
  size = "md",
  moreLabel,
  className,
}: {
  people: Omit<AvatarProps, "size" | "className">[];
  label: string;
  max?: number;
  size?: AvatarProps["size"];
  /** Masalan "+12". Berilmasa ortiqchasi koʻrsatilmaydi. */
  moreLabel?: string;
  className?: string;
}) {
  const shown = people.slice(0, max);
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("flex items-center", className)}
    >
      {shown.map((person, i) => (
        <Avatar
          key={i}
          {...person}
          alt=""
          size={size}
          className={cn("ring-card ring-[3px]", i > 0 && "-ml-3")}
        />
      ))}
      {moreLabel && people.length > max ? (
        <span
          aria-hidden
          className={cn(
            "font-ui bg-ink text-on-ink ring-card -ml-3 inline-flex items-center justify-center rounded-full font-bold ring-[3px]",
            SIZES[size],
          )}
        >
          {moreLabel}
        </span>
      ) : null}
    </span>
  );
}
