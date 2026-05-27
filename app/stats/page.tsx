"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/SystemStatus";
import { useSavedLanguage } from "@/lib/i18n/useSavedLanguage";
import type { CaseRecord } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

const PRIORITY_COLORS = { P1: "#ef4444", P2: "#f59e0b", P3: "#10b981" };

export default function StatsPage() {
  const { t, langOption } = useSavedLanguage();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cases", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as CaseRecord[];
      setCases(Array.isArray(data) ? data : []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const byMonth = new Map<string, number>();
    const byPriority = { P1: 0, P2: 0, P3: 0 };
    const byCondition = new Map<string, number>();
    const byLanguage = new Map<string, number>();
    let oldest: Date | null = null;

    for (const c of cases) {
      const d = new Date(c.timestamp);
      if (!oldest || d < oldest) oldest = d;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + 1);
      byPriority[c.priority] += 1;
      byCondition.set(c.likely_condition, (byCondition.get(c.likely_condition) ?? 0) + 1);
      byLanguage.set(c.language, (byLanguage.get(c.language) ?? 0) + 1);
    }

    const monthData = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));

    const priorityData = (["P1", "P2", "P3"] as const).map((p) => ({
      name: p,
      value: byPriority[p],
    }));

    const topConditions = Array.from(byCondition.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const langData = Array.from(byLanguage.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => ({ lang, count }));

    const daySpan =
      oldest && cases.length
        ? Math.max(1, Math.ceil((Date.now() - oldest.getTime()) / 86400000))
        : 1;

    return {
      total: cases.length,
      monthData,
      priorityData,
      topConditions,
      langData,
      avgPerDay: (cases.length / daySpan).toFixed(1),
    };
  }, [cases]);

  return (
    <div className="min-h-screen bg-deep">
      <AppHeader
        right={<ThemeToggle translationLang={langOption.translationKey} />}
      />
      <main className="mx-auto max-w-5xl px-4 pb-10 pt-[calc(64px+32px)]">
        <h1 className="hero-title mb-2 text-left">{t.statsTitle}</h1>
        <p className="mb-8 text-text-muted">
          {t.statsTotalCases}: <strong className="text-text-primary">{loading ? "…" : stats.total}</strong>
          {" · "}
          {t.statsAvgPerDay}: <strong className="text-text-primary">{loading ? "…" : stats.avgPerDay}</strong>
        </p>

        {loading ? (
          <p className="text-text-muted">{t.dashLoading}</p>
        ) : cases.length === 0 ? (
          <p className="text-text-muted">{t.dashNoCases}</p>
        ) : (
          <div className="space-y-8">
            <section className="clinical-card">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.statsByMonth}</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.monthData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <div className="grid gap-8 md:grid-cols-2">
              <section className="clinical-card">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.statsByPriority}</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={stats.priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {stats.priorityData.map((entry) => (
                        <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </section>

              <section className="clinical-card">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.statsByLanguage}</h2>
                <ul className="space-y-2">
                  {stats.langData.map(({ lang, count }) => (
                    <li key={lang} className="flex justify-between text-sm text-text-secondary">
                      <span>{lang}</span>
                      <span className="font-semibold tabular-nums text-text-primary">{count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="clinical-card">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-violet-400">{t.statsTopConditions}</h2>
              <ul className="space-y-2">
                {stats.topConditions.map(([name, count]) => (
                  <li key={name} className="flex justify-between gap-4 text-sm">
                    <span className="text-text-secondary">{name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-text-primary">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/dashboard" className="text-sm text-violet-400 underline">
            Dashboard
          </Link>
          <Link href="/" className="text-sm text-violet-400 underline">
            {t.notFoundHome}
          </Link>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
