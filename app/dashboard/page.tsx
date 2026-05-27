"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ThemeToggle } from "@/components/SystemStatus";
import { WARD_OPTIONS, hospitalConfig } from "@/lib/hospital/config";
import type { CaseRecord, Priority, Shift } from "@/lib/types";

type SortMode = "NEWEST" | "OLDEST" | "P1_FIRST" | "P3_FIRST";
type FilterMode = "ALL" | "P1" | "P2" | "P3" | "TODAY" | "WEEK";

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

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getShift(date: Date): Shift {
  const h = date.getHours();
  if (h >= 6 && h < 14) return "morning";
  if (h >= 14 && h < 22) return "evening";
  return "night";
}

function shiftLabel(s: Shift) {
  return s === "morning" ? "Morning" : s === "evening" ? "Evening" : "Night";
}

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [wardFilter, setWardFilter] = useState("");
  const [shift, setShift] = useState<Shift>("morning");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST");
  const [sortCol, setSortCol] = useState<string>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cases", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
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
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    let base = cases.filter((c) => {
      const created = new Date(c.timestamp);
      if (filter === "P1" || filter === "P2" || filter === "P3") {
        if (c.priority !== filter) return false;
      }
      if (filter === "TODAY" && !isSameDay(created, now)) return false;
      if (filter === "WEEK" && created < weekAgo) return false;
      if (wardFilter && (c.ward ?? "") !== wardFilter) return false;
      if (getShift(created) !== shift) return false;
      if (!q) return true;
      return `${c.name} ${c.location} ${c.patientId}`.toLowerCase().includes(q);
    });

    base.sort((a, b) => {
      if (sortMode === "NEWEST") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortMode === "OLDEST") return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortMode === "P1_FIRST") {
        const pw = priorityWeight(a.priority) - priorityWeight(b.priority);
        return pw || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      const pw = priorityWeight(b.priority) - priorityWeight(a.priority);
      return pw || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    if (sortCol === "name") {
      base = [...base].sort((a, b) =>
        sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
      );
    }

    return base;
  }, [cases, filter, query, shift, sortCol, sortDir, sortMode, wardFilter]);

  const stats = useMemo(() => {
    const today = cases.filter((c) => isSameDay(new Date(c.timestamp), new Date()));
    const avgMs =
      today.length > 0
        ? Math.round(today.reduce((s, c) => s + (c.responseTimeMs ?? 0), 0) / today.length)
        : 0;
    return {
      totalToday: today.length,
      p1: today.filter((c) => c.priority === "P1").length,
      p2: today.filter((c) => c.priority === "P2").length,
      p3: today.filter((c) => c.priority === "P3").length,
      avgResponse: avgMs > 0 ? `${(avgMs / 1000).toFixed(1)}s` : "—",
    };
  }, [cases]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCsv = useCallback(() => {
    const rows = (selectedIds.size ? filtered.filter((c) => selectedIds.has(c.id)) : filtered);
    const headers = ["ID", "PatientID", "Name", "Age", "Gender", "Location", "Ward", "Priority", "Condition", "Timestamp"];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [r.id, r.patientId, r.name, r.age ?? "", r.gender ?? "", r.location, r.ward ?? "", r.priority, r.likely_condition, r.timestamp]
          .map(String)
          .map(esc)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ruralcare-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, selectedIds]);

  const markResolved = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await fetch("/api/triage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, resolved: true }),
    });
    setSelectedIds(new Set());
    void load();
  }, [load, selectedIds]);

  const printShiftReport = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Shift Report</title>
      <style>body{font-family:Inter,sans-serif;padding:32px;color:#1e293b}h1{color:#1e3a5f}
      table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #e2e8f0;padding:8px;text-align:left}
      .p1{background:#fef2f2}.p2{background:#fffbeb}.p3{background:#ecfdf5}</style></head><body>
      <h1>${hospitalConfig.name} — Shift Report</h1>
      <p>Shift: ${shiftLabel(shift)} · ${new Date().toLocaleString()}</p>
      <p>Total today: ${stats.totalToday} | P1: ${stats.p1} | P2: ${stats.p2} | P3: ${stats.p3} | Avg response: ${stats.avgResponse}</p>
      <table><thead><tr><th>Patient</th><th>Priority</th><th>Condition</th><th>Ward</th><th>Time</th></tr></thead><tbody>
      ${filtered
        .map(
          (c) =>
            `<tr class="${c.priority === "P1" ? "p1" : c.priority === "P2" ? "p2" : "p3"}"><td>${c.name}</td><td>${c.priority}</td><td>${c.likely_condition}</td><td>${c.ward ?? "—"}</td><td>${formatTime(c.timestamp)}</td></tr>`,
        )
        .join("")}
      </tbody></table></body></html>
    `);
    win.document.close();
    win.print();
  };

  const openCase = (c: CaseRecord) => {
    setSelectedCase(c);
    setPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-90" aria-label="Back to RuralCare home">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-lg font-bold text-white">
              +
            </div>
            <div>
              <p className="font-bold text-text-primary">RuralCare</p>
              <p className="text-sm text-text-muted">← Home · Command Center</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle translationLang="english" />
            <Link href="/" className="btn-secondary py-2 text-sm">
              Triage
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">Live Triage Dashboard</h1>
          <div className="flex gap-2 rounded-lg border border-border bg-surface-card p-1">
            {(["morning", "evening", "night"] as Shift[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShift(s)}
                className={`rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  shift === s ? "bg-brand text-white" : "text-text-secondary hover:bg-surface-muted"
                }`}
              >
                {shiftLabel(s)}
              </button>
            ))}
          </div>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <KpiCard title="Total today" value={stats.totalToday} />
          <KpiCard title="P1 Critical" value={stats.p1} accent="text-p1-rose" />
          <KpiCard title="P2 Urgent" value={stats.p2} accent="text-p2-amber" />
          <KpiCard title="P3 Non-urgent" value={stats.p3} accent="text-p3-emerald" />
          <KpiCard title="Avg response" value={stats.avgResponse} isText />
        </section>

        <section className="clinical-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, location, patient ID…"
              aria-label="Search cases"
              className="input-field lg:max-w-md"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                aria-label="Filter by ward"
                className="input-field w-auto"
              >
                <option value="">All wards</option>
                {WARD_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Sort cases"
                className="input-field w-auto"
              >
                <option value="NEWEST">Newest first</option>
                <option value="OLDEST">Oldest first</option>
                <option value="P1_FIRST">P1 first</option>
                <option value="P3_FIRST">P3 first</option>
              </select>
              <button type="button" onClick={exportCsv} className="btn-secondary py-2 text-sm">
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => void markResolved()}
                disabled={!selectedIds.size}
                className="btn-secondary py-2 text-sm disabled:opacity-50"
              >
                Mark resolved ({selectedIds.size})
              </button>
              <button type="button" onClick={printShiftReport} className="btn-primary py-2 text-sm">
                Print shift report
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["ALL", "P1", "P2", "P3", "TODAY", "WEEK"] as FilterMode[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  filter === f ? "bg-brand text-white" : "border border-border text-text-secondary"
                }`}
              >
                {f === "ALL" ? "All" : f === "TODAY" ? "Today" : f === "WEEK" ? "This week" : f}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            {loading ? (
              <div className="p-12 text-center text-text-muted">Loading cases…</div>
            ) : error ? (
              <div className="p-12 text-center text-p1-rose">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-text-muted">
                {cases.length === 0 ? "No cases recorded yet." : "No cases match filters."}
              </div>
            ) : (
              <table className="min-w-[900px] w-full text-left text-base">
                <thead className="border-b border-border bg-surface-muted text-sm uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-3"><span className="sr-only">Select</span></th>
                    <SortableTh label="Patient" col="name" sortCol={sortCol} sortDir={sortDir} onSort={(c, d) => { setSortCol(c); setSortDir(d); }} />
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Ward</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Condition</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => openCase(row)}
                      className={`cursor-pointer border-b border-border transition hover:bg-surface-muted ${
                        row.priority === "P1"
                          ? "bg-p1-rose/5"
                          : row.priority === "P2"
                            ? "bg-p2-amber/5"
                            : "bg-p3-emerald/5"
                      } ${row.resolved ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          aria-label={`Select case ${row.name}`}
                          className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        <Link href={`/history/${encodeURIComponent(row.id)}`} onClick={(e) => e.stopPropagation()} className="hover:text-brand">
                          {row.name}
                        </Link>
                        <span className="ml-2 text-xs text-text-muted">{row.patientId}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{row.location}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.ward ?? "—"}</td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={row.priority} t={{ priorityCritical: "Critical", priorityUrgent: "Urgent", priorityNonUrgent: "Non-urgent", assignedPriority: "" }} size="sm" />
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-text-secondary">{row.likely_condition}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text-muted">{formatTime(row.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-3 text-sm text-text-muted">Auto-refresh every 30 seconds</p>
        </section>
      </main>

      {panelOpen && selectedCase && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setPanelOpen(false)} aria-hidden />
          <aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-surface-card shadow-2xl animate-slide-in"
            role="dialog"
            aria-label="Case details"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-bold text-text-primary">{selectedCase.name}</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close panel"
                className="rounded-lg border border-border p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <PriorityBadge
                priority={selectedCase.priority}
                t={{ priorityCritical: "Critical", priorityUrgent: "Urgent", priorityNonUrgent: "Non-urgent", assignedPriority: "Priority" }}
              />
              <Detail label="Patient ID" value={selectedCase.patientId} />
              <Detail label="Condition" value={selectedCase.likely_condition} />
              <Detail label="ICD-10" value={selectedCase.icd_code ?? "—"} />
              <Detail label="Location" value={selectedCase.location} />
              <Detail label="Ward" value={selectedCase.ward ?? "—"} />
              <Detail label="Hospital" value={selectedCase.hospital} />
              <div>
                <p className="text-sm font-semibold text-text-muted">Transcript</p>
                <p className="mt-1 rounded-lg border border-border bg-surface-muted p-3 text-base text-text-primary">{selectedCase.transcript}</p>
              </div>
              <Detail label="Reason" value={selectedCase.reason} />
              <Detail label="Time" value={new Date(selectedCase.timestamp).toLocaleString()} />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value, accent = "", isText = false }: { title: string; value: number | string; accent?: string; isText?: boolean }) {
  return (
    <div className="clinical-card">
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <p className={`mt-2 ${isText ? "text-2xl" : "text-3xl"} font-bold tabular-nums ${accent || "text-text-primary"}`}>{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-muted">{label}</p>
      <p className="mt-1 text-base text-text-primary">{value}</p>
    </div>
  );
}

function SortableTh({
  label,
  col,
  sortCol,
  sortDir,
  onSort,
}: {
  label: string;
  col: string;
  sortCol: string;
  sortDir: "asc" | "desc";
  onSort: (col: string, dir: "asc" | "desc") => void;
}) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => onSort(col, sortCol === col && sortDir === "asc" ? "desc" : "asc")}
        className="font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {label} {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
      </button>
    </th>
  );
}
