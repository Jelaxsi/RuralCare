"use client";

import { useEffect, useState } from "react";
import { getTranslations } from "@/lib/i18n/translations";
import type { TranslationLanguage } from "@/lib/i18n/languages";

type HealthStatus = "online" | "degraded" | "offline" | "checking";

export function SystemStatus({ translationLang }: { translationLang: TranslationLanguage }) {
  const t = getTranslations(translationLang);
  const [status, setStatus] = useState<HealthStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error("offline");
        const data = (await res.json()) as { status?: string };
        if (!cancelled) {
          setStatus(data.status === "online" ? "online" : "degraded");
        }
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }
    void check();
    const id = window.setInterval(check, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const label =
    status === "checking"
      ? t.systemChecking
      : status === "online"
        ? t.systemLive
        : status === "degraded"
          ? "Degraded"
          : t.systemOffline;

  const dotClass =
    status === "online"
      ? "bg-p3-emerald"
      : status === "degraded"
        ? "bg-p2-amber"
        : status === "checking"
          ? "bg-text-muted"
          : "bg-p1-rose";

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-border bg-surface-card px-3 py-2"
      role="status"
      aria-live="polite"
      aria-label={`System status: ${label}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        {status === "online" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-p3-emerald/60 opacity-75" />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotClass}`} />
      </span>
      <span className="text-sm font-medium text-text-secondary">{label}</span>
    </div>
  );
}

export function ThemeToggle({
  translationLang,
}: {
  translationLang: TranslationLanguage;
}) {
  const t = getTranslations(translationLang);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ruralcare-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t.lightMode : t.darkMode}
      className="rounded-lg border border-border bg-surface-card p-2.5 text-text-secondary transition hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
