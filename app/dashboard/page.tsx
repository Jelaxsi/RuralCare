"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type Priority = "P1" | "P2" | "P3";
type SortMode = "NEWEST" | "OLDEST" | "P1_FIRST" | "P3_FIRST";
type FilterMode = "ALL" | "P1" | "P2" | "P3" | "TODAY" | "WEEK";

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

function priorityWeight(p: Priority): number {
  return p === "P1" ? 1 : p === "P2" ? 2 : 3;
}

function formatTime(ts: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "2-digit",
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

function formatTimestampLong(ts: string) {
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

function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function shorten(s: string, n: number) {
  const x = (s ?? "").trim();
  if (x.length <= n) return x;
  return `${x.slice(0, Math.max(0, n))}…`;
}

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cases", { method: "GET", cache: "no-store" });
      if (!res.ok) throw new Error("Failed loading cases.");
      const data = (await res.json()) as CaseRecord[];
      setCases(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError("Unable to refresh cases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const base = cases.filter((c) => {
      const created = new Date(c.timestamp);
      if (filter === "P1" || filter === "P2" || filter === "P3") {
        if (c.priority !== filter) return false;
      }
      if (filter === "TODAY" && !isSameDay(created, now)) return false;
      if (filter === "WEEK" && created < weekAgo) return false;
      if (!q) return true;
      return `${c.name} ${c.location}`.toLowerCase().includes(q);
    });

    base.sort((a, b) => {
      if (sortMode === "NEWEST") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortMode === "OLDEST") {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortMode === "P1_FIRST") {
        const byPriority = priorityWeight(a.priority) - priorityWeight(b.priority);
        return byPriority || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      const byPriority = priorityWeight(b.priority) - priorityWeight(a.priority);
      return byPriority || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return base;
  }, [cases, filter, query, sortMode]);

  const stats = useMemo(() => {
    const inView = filtered;
    const total = inView.length;
    const p1 = inView.filter((c) => c.priority === "P1").length;
    const p2 = inView.filter((c) => c.priority === "P2").length;
    const p3 = inView.filter((c) => c.priority === "P3").length;
    const today = inView.filter((c) => isSameDay(new Date(c.timestamp), new Date())).length;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return { total, p1, p2, p3, today, p1Pct: pct(p1), p2Pct: pct(p2), p3Pct: pct(p3) };
  }, [filtered]);

  const deleteCase = useCallback(
    async (id: string) => {
      setDeletingIds((prev) => ({ ...prev, [id]: true }));
      try {
        const res = await fetch(`/api/triage?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setCases((prev) => prev.filter((x) => x.id !== id));
        setConfirmDeleteId(null);
        if (selectedCase?.id === id) setSelectedCase(null);
      } catch {
        setError("Unable to delete case.");
      } finally {
        window.setTimeout(() => {
          setDeletingIds((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 250);
      }
    },
    [selectedCase],
  );

  const exportCsv = useCallback(() => {
    const headers = ["ID", "Name", "Location", "Priority", "Reason", "Transcript", "Timestamp"];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((r) =>
      [r.id, r.name, r.location, r.priority, r.reason, r.transcript, r.timestamp]
        .map(esc)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const day = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ruralcare-cases-${day}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:border-accent/40 hover:bg-white/10"
              aria-label="Back to triage"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/25">
                <ArrowLeftIcon />
              </div>
              <div className="hidden leading-tight sm:flex sm:flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">RuralCare</span>
                <span className="text-sm font-semibold text-white">Triage</span>
              </div>
            </Link>
          </div>
          <div className="text-right">
            <div className="mb-2 flex items-center justify-end gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                Live Triage Dashboard
              </h1>
              <span className="relative mt-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-blink rounded-full bg-p3-emerald/70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-p3-emerald" />
              </span>
            </div>
            <div className="text-[11px] text-slate-500 md:text-xs">
              Auto-refresh • every <span className="font-semibold text-slate-300">10s</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-10 md:px-8 md:pt-14">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-4">
          <MetricCard
            title="Total Cases"
            value={stats.total}
            subtitle="all time (in view)"
            icon={<StackIcon />}
            accent="border-white/10"
          />
          <MetricCard
            title="P1 Critical"
            value={stats.p1}
            subtitle={`${stats.p1Pct}% of total`}
            icon={<AlertBadgeIcon />}
            accent="border-p1-rose/40 shadow-[0_0_28px_rgba(239,68,68,0.12)]"
          />
          <MetricCard
            title="P2 Urgent"
            value={stats.p2}
            subtitle={`${stats.p2Pct}% of total`}
            icon={<ClockIcon />}
            accent="border-p2-amber/40 shadow-[0_0_28px_rgba(245,158,11,0.10)]"
          />
          <MetricCard
            title="P3 Non-Urgent"
            value={stats.p3}
            subtitle={`${stats.p3Pct}% of total`}
            icon={<ShieldIcon />}
            accent="border-p3-emerald/40 shadow-[0_0_28px_rgba(16,185,129,0.10)]"
          />
          <MetricCard
            title="Cases Today"
            value={stats.today}
            subtitle="current date"
            icon={<TodayIcon />}
            accent="border-accent/40 shadow-[0_0_28px_rgba(124,58,237,0.12)]"
          />
        </section>

        <section className="mt-10 glass p-6 md:p-7">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="relative block w-full lg:max-w-xl">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <SearchIcon />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or location..."
                  className="w-full rounded-xl border border-white/10 bg-black/35 py-3 pl-11 pr-3 text-sm text-white outline-none transition focus:border-accent/40 focus:bg-black/45"
                  type="search"
                />
              </label>
              <div className="flex w-full items-center gap-3 lg:w-auto">
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 lg:w-[240px]"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                  <option value="P1_FIRST">Priority (P1 first)</option>
                  <option value="P3_FIRST">Priority (P3 first)</option>
                </select>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="btn-glow inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 hover:border-accent/40 hover:bg-white/10"
                >
                  <DownloadIcon />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterBtn active={filter === "ALL"} onClick={() => setFilter("ALL")}>
                All
              </FilterBtn>
              <FilterBtn active={filter === "P1"} onClick={() => setFilter("P1")}>
                P1 Critical
              </FilterBtn>
              <FilterBtn active={filter === "P2"} onClick={() => setFilter("P2")}>
                P2 Urgent
              </FilterBtn>
              <FilterBtn active={filter === "P3"} onClick={() => setFilter("P3")}>
                P3 Non-Urgent
              </FilterBtn>
              <FilterBtn active={filter === "TODAY"} onClick={() => setFilter("TODAY")}>
                Today
              </FilterBtn>
              <FilterBtn active={filter === "WEEK"} onClick={() => setFilter("WEEK")}>
                This Week
              </FilterBtn>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            {loading ? (
              <div className="flex items-center justify-center gap-3 px-8 py-20 text-sm text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Loading signals…
              </div>
            ) : error ? (
              <div className="px-8 py-20 text-center text-sm text-p1-rose">{error}</div>
            ) : filtered.length === 0 ? (
              <EmptyState hasAnyCases={cases.length > 0} query={query} filter={filter} />
            ) : (
              <div className="scrollbar-thin overflow-x-auto">
                <table className="min-w-[980px] w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/35 text-xs uppercase tracking-wider text-slate-400">
                      <Th>#</Th>
                      <Th>Patient</Th>
                      <Th>Location</Th>
                      <Th>Priority</Th>
                      <Th>Summary</Th>
                      <Th className="whitespace-nowrap">Time</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, idx) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedCase(row)}
                        className={`cursor-pointer border-b border-white/5 bg-white/[0.02] transition-all last:border-transparent hover:bg-white/[0.05] ${
                          deletingIds[row.id] ? "opacity-0" : "opacity-100"
                        }`}
                      >
                        <Td className="tabular-nums text-slate-500">{idx + 1}</Td>
                        <Td className="font-medium text-white">
                          <Link
                            href={`/history/${encodeURIComponent(row.id)}`}
                            className="hover:text-accent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {row.name}
                          </Link>
                        </Td>
                        <Td className="text-slate-300">{row.location}</Td>
                        <Td>
                          <PillBadge p={row.priority} />
                        </Td>
                        <Td className="max-w-[340px] truncate text-slate-300">
                          {shorten(row.transcript, 60)}
                        </Td>
                        <Td className="whitespace-nowrap text-xs text-slate-400 md:text-sm">
                          {formatTime(row.timestamp)}
                        </Td>
                        <Td className="relative text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId((prev) => (prev === row.id ? null : row.id));
                            }}
                            className="inline-flex rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:border-p1-rose/40 hover:text-p1-rose"
                            aria-label="Delete case"
                          >
                            <TrashIcon />
                          </button>
                          {confirmDeleteId === row.id && (
                            <div className="absolute right-2 top-12 z-20 w-40 rounded-xl border border-white/10 bg-slate-900/95 p-3 text-left text-xs shadow-xl">
                              <div className="text-slate-200">Delete this case?</div>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void deleteCase(row.id);
                                  }}
                                  className="rounded-md bg-p1-rose/80 px-2 py-1 font-semibold text-white"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-slate-300"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedCase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedCase(null)}
        >
          <div className="glass w-full max-w-3xl p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedCase.name}</h2>
                <div className="mt-1 text-sm text-slate-400">{selectedCase.location}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                aria-label="Close case details"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-4">
              <LargePillBadge p={selectedCase.priority} />
            </div>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-slate-500">Transcript</div>
              <p className="mt-2 rounded-xl border border-white/10 bg-black/25 p-4 text-slate-200">
                {selectedCase.transcript}
              </p>
            </div>
            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">AI Reason</div>
              <p className="mt-2 text-slate-300">{selectedCase.reason}</p>
            </div>
            <div className="mt-5 text-sm text-slate-400">{formatTimestampLong(selectedCase.timestamp)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  hasAnyCases,
  query,
  filter,
}: {
  hasAnyCases: boolean;
  query: string;
  filter: FilterMode;
}) {
  const filterText =
    filter === "P1" ? "P1" : filter === "P2" ? "P2" : filter === "P3" ? "P3" : "selected";
  return (
    <div className="flex flex-col items-center gap-5 px-8 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
        <ClipboardIcon />
      </div>
      <div className="max-w-sm">
        <div className="text-base font-semibold text-white">
          {!hasAnyCases
            ? "No cases yet"
            : query.trim()
              ? "No cases match your search"
              : filter === "P1" || filter === "P2" || filter === "P3"
                ? `No ${filterText} cases found`
                : "No matching cases"}
        </div>
        <div className="mt-2 text-sm text-slate-400">
          {!hasAnyCases ? (
            <>
              No cases yet. Start a triage{" "}
              <Link href="/" className="underline decoration-accent underline-offset-4 hover:text-accent">
                above.
              </Link>
            </>
          ) : (
            "Try another filter or clear your search."
          )}
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-4 font-semibold ${className}`}>
      <span>{children}</span>
    </th>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-white/10 px-6 py-4 align-middle ${className}`}>{children}</td>;
}

function PillBadge({ p }: { p: Priority }) {
  const cls =
    p === "P1"
      ? "bg-p1-rose/20 text-red-50 ring-red-400/35"
      : p === "P2"
        ? "bg-p2-amber/20 text-amber-50 ring-p2-amber/35"
        : "bg-p3-emerald/20 text-emerald-50 ring-p3-emerald/35";
  const label = p === "P1" ? "P1 Critical" : p === "P2" ? "P2 Urgent" : "P3 Non-Urgent";
  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ring-1 ${cls}`}>
      {label}
    </span>
  );
}

function LargePillBadge({ p }: { p: Priority }) {
  const cls =
    p === "P1"
      ? "bg-p1-rose/25 text-red-50 ring-red-400/45"
      : p === "P2"
        ? "bg-p2-amber/25 text-amber-50 ring-p2-amber/45"
        : "bg-p3-emerald/25 text-emerald-50 ring-p3-emerald/45";
  const label = p === "P1" ? "P1 Critical" : p === "P2" ? "P2 Urgent" : "P3 Non-Urgent";
  return (
    <span className={`inline-flex items-center rounded-full px-5 py-2 text-sm font-bold ring-1 ${cls}`}>
      {label}
    </span>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-glow rounded-xl px-5 py-2.5 text-sm font-semibold ring-1 transition ${
        active
          ? "border border-accent/40 bg-accent/25 text-white ring-accent/30 shadow-[0_0_20px_rgba(124,58,237,0.25)]"
          : "border border-white/10 bg-white/5 text-slate-300 ring-transparent hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className={`glass flex items-center gap-4 p-4 md:p-5 ${accent}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-accent">
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</div>
        <div className="mt-1 text-2xl tabular-nums font-extrabold text-white md:text-3xl">{value}</div>
        <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 18 8 12l6-6" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 13 6 3 6-3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m12 21-6-3V9l6-4 6 4v9l-6 3Z" />
    </svg>
  );
}

function AlertBadgeIcon() {
  return (
    <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#EF4444" aria-hidden>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 21H10M12 17V13M21 17V7a4 4 0 00-4-4H9a4 4 0 00-4 4v10a2 2 0 002 2h12a2 2 0 002-2Z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" aria-hidden>
      <circle cx="12" cy="13" r="9" strokeWidth="2" />
      <path strokeWidth="2" strokeLinecap="round" d="M12 9v6l4 3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#10B981" aria-hidden>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 3 7 4v6c0 5-7 8-7 8s-7-3-7-8V7l7-4ZM9.5 12.5 11 14l4-5"
      />
    </svg>
  );
}

function TodayIcon() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#8B5CF6" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" strokeWidth="2" />
      <path strokeWidth="2" d="M8 3v4M16 3v4M4 10h16" />
      <circle cx="12" cy="15" r="2.2" fill="#8B5CF6" stroke="none" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden className="text-slate-500">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 3h6v2H9zM9 21h6M7 21H6a2 2 0 01-2-2V5h16v14a2 2 0 01-2 2h-1"
      />
      <path strokeWidth="2" strokeLinecap="round" d="M8 11h8M8 15h8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <circle cx="11.5" cy="11.5" r="6.5" strokeWidth="2.5" />
      <path strokeLinecap="round" strokeWidth="2.5" d="m17 17 4 4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M9 7V4h6v3m-8 0 1 12h8l1-12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeWidth="2.5" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
