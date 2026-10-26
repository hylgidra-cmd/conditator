"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

/** Sayt header/footer i: dashboard oʻz sidebar va topbar iga ega, u yerda yashiriladi. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))
    return null;
  return children;
}
