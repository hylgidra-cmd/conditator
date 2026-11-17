"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

function useIsDashboard() {
  const pathname = usePathname();
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/** Sayt header/footer i. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return useIsDashboard() ? null : children;
}

/** Sayt <main> i: sahifa kirish animatsiyasi bilan. */
export function SiteMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (useIsDashboard()) return children;
  return (
    <main key={pathname} className="ds-page-enter flex-1">
      {children}
    </main>
  );
}
