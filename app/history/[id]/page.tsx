"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { getTranslations } from "@/lib/i18n/translations";
import type { CaseRecord } from "@/lib/types";

function formatTimestamp(ts: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

const t = getTranslations("english");

export default function PatientHistoryPage() {
  const params = useParams<{ id: string }>();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/cases", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load cases");
        const data = (await res.json()) as CaseRecord[];
        setCases(Array.isArray(data) ? data : []);
      } catch {
        setError("Unable to load patient history.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const selected = useMemo(
    () => cases.find((c) => c.id === decodeURIComponent(params.id ?? "")) ?? null,
    [cases, params.id],
  );
  const history = useMemo(() => {
    if (!selected) return [];
    return cases
      .filter((c) => c.name.trim().toLowerCase() === selected.name.trim().toLowerCase())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [cases, selected]);

  return (
    <div className="min-h-screen bg-surface-light px-4 py-10 dark:bg-surface-dark md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="btn-secondary mb-6 inline-flex text-sm">
          ← Back to Dashboard
        </Link>

        <div className="clinical-card">
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
            Patient History — {selected?.name ?? "Unknown"}
          </h1>
          <p className="mt-2 text-base text-text-muted">
            {selected?.location ?? "—"} · {history.length} visit{history.length === 1 ? "" : "s"}
          </p>

          {loading ? (
            <p className="mt-8 text-text-muted">Loading…</p>
          ) : error ? (
            <p className="mt-8 text-p1-rose">{error}</p>
          ) : history.length === 0 ? (
            <p className="mt-8 text-text-muted">No history found.</p>
          ) : (
            <ol className="mt-8 space-y-4">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className={`rounded-xl border border-border p-5 ${
                    entry.priority === "P1"
                      ? "border-p1-rose/30 bg-p1-rose/5"
                      : entry.priority === "P2"
                        ? "border-p2-amber/30 bg-p2-amber/5"
                        : "border-p3-emerald/30 bg-p3-emerald/5"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <PriorityBadge priority={entry.priority} t={t} size="sm" />
                    <time className="text-sm text-text-muted">{formatTimestamp(entry.timestamp)}</time>
                  </div>
                  <p className="mt-3 font-semibold text-text-primary">{entry.likely_condition}</p>
                  <p className="mt-2 text-base text-text-secondary">{entry.transcript}</p>
                  <p className="mt-2 text-sm text-text-muted">{entry.reason}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
