import { PANEL, Skeleton } from "./ui";

export type SkeletonVariant = "overview" | "table" | "chat";

/** Yuklanish holati: sahifa tuzilmasini takrorlaydigan kulrang bloklar. */
export function DashboardSkeleton({
  variant = "overview",
  label,
}: {
  variant?: SkeletonVariant;
  label: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="mt-3 mb-8 h-4 w-96 max-w-full" />
      {variant === "overview" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${PANEL} p-5`}>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-6 h-8 w-16" />
                <Skeleton className="mt-4 h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className={`${PANEL} p-5 lg:col-span-2`}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
            <div className={`${PANEL} p-5`}>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-6 h-2 w-full" />
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="mt-4 h-3 w-3/4" />
              ))}
            </div>
          </div>
        </>
      ) : null}
      {variant === "table" ? (
        <div className={`${PANEL} p-5`}>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-12 w-full sm:w-72" />
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border-line flex items-center gap-4 border-t py-4 first-of-type:mt-5"
            >
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="hidden h-4 w-32 md:block" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : null}
      {variant === "chat" ? (
        <div className={`${PANEL} flex flex-col gap-4 p-5`}>
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-10 w-1/2 self-end" />
          <Skeleton className="h-24 w-4/5" />
          <Skeleton className="mt-6 h-12 w-full" />
        </div>
      ) : null}
    </div>
  );
}
