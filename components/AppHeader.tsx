import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  subtitle?: string;
  right?: ReactNode;
  showAbout?: boolean;
  dashboardLabel?: string;
};

export function AppHeader({
  subtitle = "Emergency Triage System",
  right,
  showAbout = true,
  dashboardLabel = "Dashboard",
}: Props) {
  return (
    <header className="app-nav">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 items-center gap-2 transition hover:opacity-90">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
            <span className="text-lg font-bold text-white" aria-hidden>
              +
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">RuralCare</p>
            <p className="hidden truncate text-xs text-white/40 sm:block">{subtitle}</p>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {showAbout && (
            <Link
              href="/about"
              className="hidden rounded-lg border border-white/10 px-2.5 py-2 text-xs text-white/70 transition hover:bg-white/5 sm:inline-flex sm:px-3 sm:text-sm"
            >
              About
            </Link>
          )}
          <Link
            href="/dashboard"
            className="hidden rounded-lg border border-white/10 px-2.5 py-2 text-xs text-white/70 transition hover:bg-white/5 sm:inline-flex sm:px-3 sm:text-sm"
          >
            {dashboardLabel}
          </Link>
          {right}
        </div>
      </div>
    </header>
  );
}
