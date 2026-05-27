"use client";

type Props = {
  heading: string;
  subtext: string;
};

export function DashboardEmptyState({ heading, subtext }: Props) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-surface-muted text-violet-500 dark:text-violet-400"
        aria-hidden
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{heading}</h2>
      <p className="mt-2 max-w-sm text-sm text-text-muted">{subtext}</p>
    </div>
  );
}
