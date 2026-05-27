import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  subtitle?: string;
  right?: ReactNode;
  showAbout?: boolean;
  dashboardLabel?: string;
  backLabel?: string;
  onBack?: () => void;
};

export function AppHeader({
  subtitle = "Emergency Triage System",
  right,
  showAbout = true,
  dashboardLabel = "Dashboard",
  backLabel,
  onBack,
}: Props) {
  return (
    <header className="app-nav">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2">
        {onBack && backLabel ? (
          <button
            type="button"
            onClick={onBack}
            className="app-nav-link inline-flex min-w-0 items-center gap-1.5 font-medium"
          >
            <span aria-hidden>←</span>
            <span className="truncate">{backLabel}</span>
          </button>
        ) : (
          <Link href="/" className="flex min-w-0 items-center gap-2 transition hover:opacity-90">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
              <span className="text-lg font-bold text-white" aria-hidden>
                +
              </span>
            </div>
            <div className="min-w-0">
              <p className="app-nav-title truncate text-base font-semibold">RuralCare</p>
              <p className="app-nav-subtitle hidden truncate text-xs sm:block">{subtitle}</p>
            </div>
          </Link>
        )}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {showAbout && (
            <Link href="/about" className="app-nav-link hidden sm:inline-flex">
              About
            </Link>
          )}
          <Link href="/dashboard" className="app-nav-link hidden sm:inline-flex">
            {dashboardLabel}
          </Link>
          {right}
        </div>
      </div>
    </header>
  );
}
