"use client";

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-lg border border-border bg-surface-muted p-4">
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-white/10" />
          </div>
          <div className="h-6 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}
