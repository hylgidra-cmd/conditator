import type { ReactNode } from "react";
import { cn } from "./cn";

/** Jadval uchun yagona shishasimon konteyner (gorizontal skroll va chekka radius bilan). */
export function TableWrap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line bg-card/90 shadow-soft overflow-hidden rounded-3xl border backdrop-blur-md",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-line bg-card-cool/70 text-subtle border-b text-xs font-bold uppercase tracking-wider">
      {children}
    </thead>
  );
}

export function Th({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-3.5 whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-line/70 hover:bg-primary-soft/25 border-b transition-colors last:border-b-0",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3.5 align-middle", className)}>{children}</td>;
}
