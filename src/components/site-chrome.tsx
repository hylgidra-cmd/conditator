"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

function useIsDashboard() {
  const pathname = usePathname();
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/** Sayt header/footer i: dashboard oʻz sidebar va topbar iga ega, u yerda yashiriladi. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return useIsDashboard() ? null : children;
}

/** Sayt <main> i. Dashboard oʻz <main> ini chizadi (ikkita main boʻlmasligi uchun). */
export function SiteMain({ children }: { children: ReactNode }) {
  if (useIsDashboard()) return children;
  return <main className="flex-1">{children}</main>;
}
