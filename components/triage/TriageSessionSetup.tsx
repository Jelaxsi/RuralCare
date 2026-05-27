"use client";

type Props = {
  message: string;
  exiting?: boolean;
};

export function TriageSessionSetup({ message, exiting = false }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
      className={`flex items-center justify-center gap-2 px-4 py-3 text-sm text-text-muted transition-opacity duration-500 ${
        exiting ? "pointer-events-none opacity-0" : "animate-triage-fade-in opacity-100"
      }`}
    >
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#7c3aed]/30 border-t-[#7c3aed]"
        aria-hidden
      />
      <span>{message}</span>
    </div>
  );
}

function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400 ${className}`}
      aria-hidden
    />
  );
}

export function PatientIdBadge({
  label,
  patientId,
  loading,
  failed,
}: {
  label: string;
  patientId: string;
  loading: boolean;
  failed: boolean;
}) {
  if (failed) return null;

  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 font-mono text-xs text-violet-600 dark:text-violet-300">
      <span>{label}:</span>
      {loading ? (
        <InlineSpinner />
      ) : (
        <span className="animate-triage-fade-in" suppressHydrationWarning>
          {patientId}
        </span>
      )}
    </div>
  );
}
