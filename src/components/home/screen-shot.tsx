import Image from "next/image";

export type ScreenName = "vacancy" | "matches" | "candidate";

/** Ilovaning haqiqiy skrinshoti: yorug' va tungi rejim uchun alohida rasm. */
export function ScreenShot({
  name,
  alt,
  priority,
  className,
}: {
  name: ScreenName;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const common = {
    width: 1640,
    height: 1240,
    sizes: "(min-width: 1024px) 640px, 100vw",
    priority,
    className: "h-auto w-full",
  };
  return (
    <div
      className={`border-border bg-surface overflow-hidden rounded-lg border ${className ?? ""}`}
    >
      <div className="theme-light-only">
        <Image src={`/screens/${name}-light.png`} alt={alt} {...common} />
      </div>
      <div className="theme-dark-only">
        <Image src={`/screens/${name}-dark.png`} alt={alt} {...common} />
      </div>
    </div>
  );
}
