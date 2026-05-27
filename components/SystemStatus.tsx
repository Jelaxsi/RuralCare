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
          setStatus(
            data.status === "ok" || data.status === "online"
              ? "online"
              : data.status === "degraded"
                ? "degraded"
                : "offline",
          );
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
          ? t.systemDegraded
          : t.systemOffline;

  const dotClass =
    status === "online"
      ? "bg-success"
      : status === "degraded"
        ? "bg-warning"
        : status === "checking"
          ? "bg-white/30"
          : "bg-danger";

  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 backdrop-blur-sm transition-opacity duration-500 dark:border-white/10 dark:bg-white/[0.05] ${
        status === "checking" ? "animate-triage-fade-in" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label={`System status: ${label}`}
    >
      {status === "checking" ? (
        <>
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#7c3aed]/30 border-t-[#7c3aed]"
            aria-hidden
          />
          <span className="text-xs font-medium text-gray-600 dark:text-white/70">{label}</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            {status === "online" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70 opacity-75 motion-reduce:animate-none" />
            )}
            {status === "degraded" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning/70 opacity-75 motion-reduce:animate-none" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
          </span>
          <span className="text-xs font-medium text-gray-600 dark:text-white/70">{label}</span>
        </>
      )}
    </div>
  );
}

export function ThemeToggle({
  translationLang,
}: {
  translationLang: TranslationLanguage;
}) {
  const t = getTranslations(translationLang);
  const [dark, setDark] = useState(true);

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
      title={dark ? t.lightMode : t.darkMode}
      className="theme-toggle-btn"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
