"use client";

type Props = {
  message: string;
  retryLabel: string;
  onRetry: () => void;
};

export function DashboardErrorState({ message, retryLabel, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
        aria-hidden
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{message}</h2>
      <button
        type="button"
        onClick={onRetry}
        className="dash-focus-ring btn-touch mt-5 rounded-lg bg-[#7c3aed] px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
      >
        {retryLabel}
      </button>
    </div>
  );
}
