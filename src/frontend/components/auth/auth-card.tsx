import type { ReactNode } from "react";
import { Reveal } from "@/frontend/components/ds/motion";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="page-x font-ui max-w-md py-12 sm:py-16">
      <Reveal>
        <div className="border-line bg-card/90 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/15 pointer-events-none absolute -top-20 -right-20 size-52 rounded-full blur-3xl"
          />
          <div className="relative z-10">
            <h1 className="text-h2 text-text font-extrabold tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-subtle mt-2 text-sm">{subtitle}</p>
            ) : null}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
