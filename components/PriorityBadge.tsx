import type { Confidence, Priority } from "@/lib/types";
import type { TranslationKeys } from "@/lib/i18n/translations";

export function PriorityBadge({
  priority,
  t,
  size = "lg",
}: {
  priority: Priority;
  t: TranslationKeys;
  size?: "sm" | "lg";
}) {
  const config =
    priority === "P1"
      ? { label: t.priorityCritical, bg: "bg-p1-rose", ring: "ring-p1-rose/30", text: "text-white" }
      : priority === "P2"
        ? { label: t.priorityUrgent, bg: "bg-p2-amber", ring: "ring-p2-amber/30", text: "text-white" }
        : { label: t.priorityNonUrgent, bg: "bg-p3-emerald", ring: "ring-p3-emerald/30", text: "text-white" };

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${config.bg} ${config.ring} ${config.text}`}
      >
        <AlertIcon priority={priority} />
        {priority} · {config.label}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex flex-col rounded-2xl px-8 py-5 shadow-lg ring-4 ${config.bg} ${config.ring}`}
    >
      <span className="text-sm font-semibold uppercase tracking-widest text-white/80">
        {t.assignedPriority}
      </span>
      <span className="mt-1 text-6xl font-black text-white">{priority}</span>
      <span className="mt-1 text-sm font-semibold uppercase tracking-wider text-white/90">
        {config.label}
      </span>
    </div>
  );
}

function AlertIcon({ priority }: { priority: Priority }) {
  const color = priority === "P1" ? "text-white" : priority === "P2" ? "text-white" : "text-white";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={color} aria-hidden>
      {priority === "P3" ? (
        <path d="M9 12l2 2 4-4M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      ) : (
        <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      )}
    </svg>
  );
}

export function ConfidenceBadge({
  confidence,
  t,
}: {
  confidence: Confidence;
  t: TranslationKeys;
}) {
  const label =
    confidence === "high" ? t.confidenceHigh : confidence === "medium" ? t.confidenceMedium : t.confidenceLow;
  const cls =
    confidence === "high"
      ? "border-p3-emerald/40 bg-p3-emerald/10 text-p3-emerald"
      : confidence === "medium"
        ? "border-p2-amber/40 bg-p2-amber/10 text-p2-amber"
        : "border-text-muted/40 bg-surface-muted text-text-secondary";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function MedicalCrossIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4" y="9" width="16" height="6" rx="1.35" fill="currentColor" />
      <rect x="9" y="4" width="6" height="16" rx="1.35" fill="currentColor" />
    </svg>
  );
}
