import type { ReactNode } from "react";

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
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="text-muted mt-2 text-sm">{subtitle}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
