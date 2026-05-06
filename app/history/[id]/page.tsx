"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Priority = "P1" | "P2" | "P3";
type CaseRecord = {
  id: string;
  name: string;
  location: string;
  language: string;
  transcript: string;
  priority: Priority;
  reason: string;
  timestamp: string;
};

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
    <div className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:border-accent/40"
          >
            <span aria-hidden>←</span> Back to Dashboard
          </Link>
        </div>

        <div className="glass p-6 md:p-8">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Patient History — {selected?.name ?? "Unknown"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">Timeline of all captured triage entries for this patient.</p>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="glass p-10 text-center text-slate-400">Loading history…</div>
          ) : error ? (
            <div className="glass p-10 text-center text-p1-rose">{error}</div>
          ) : !selected ? (
            <div className="glass p-10 text-center text-slate-300">Case not found.</div>
          ) : history.length === 0 ? (
            <div className="glass p-10 text-center text-slate-300">No history available.</div>
          ) : (
            <div className="relative space-y-4 before:absolute before:bottom-0 before:left-4 before:top-0 before:w-px before:bg-white/10">
              {history.map((entry) => (
                <div key={entry.id} className="glass relative ml-8 p-5">
                  <span className="absolute -left-[26px] top-6 h-3 w-3 rounded-full bg-accent" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-slate-400">{formatTimestamp(entry.timestamp)}</div>
                    <PriorityBadge priority={entry.priority} />
                  </div>
                  <div className="mt-2 text-sm text-slate-300">{entry.location}</div>
                  <p className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-slate-200">
                    {entry.transcript}
                  </p>
                  <p className="mt-4 text-sm text-slate-300">{entry.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cls =
    priority === "P1"
      ? "bg-p1-rose/20 text-red-50 ring-red-400/35"
      : priority === "P2"
        ? "bg-p2-amber/20 text-amber-50 ring-p2-amber/35"
        : "bg-p3-emerald/20 text-emerald-50 ring-p3-emerald/35";
  const label =
    priority === "P1" ? "P1 Critical" : priority === "P2" ? "P2 Urgent" : "P3 Non-Urgent";
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ring-1 ${cls}`}>
      {label}
    </span>
  );
}
