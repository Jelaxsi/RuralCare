"use client";

import { useState } from "react";
import type { TranslationKeys } from "@/lib/i18n/translations";

type Props = {
  caseId: string;
  t: TranslationKeys;
};

export function PatientFeedback({ caseId, t }: Props) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(nextHelpful: boolean) {
    if (saving || submitted) return;
    setHelpful(nextHelpful);
    setSaving(true);
    try {
      await fetch("/api/triage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [caseId],
          feedbackHelpful: nextHelpful,
          feedbackComment: comment.trim() || undefined,
        }),
      });
      setSubmitted(true);
    } catch {
      setHelpful(null);
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="no-print mx-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t.feedbackThanks}</p>
      </div>
    );
  }

  return (
    <div className="no-print mx-4 rounded-2xl border border-border bg-surface-card p-4">
      <p className="mb-3 text-center text-sm font-medium text-text-primary">{t.feedbackQuestion}</p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit(true)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            helpful === true
              ? "bg-emerald-600 text-white"
              : "border border-border bg-surface-muted text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
          }`}
        >
          {t.feedbackYes}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit(false)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            helpful === false
              ? "bg-red-600 text-white"
              : "border border-border bg-surface-muted text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
          }`}
        >
          {t.feedbackNo}
        </button>
      </div>
      {helpful !== null && (
        <div className="mt-3">
          <label className="sr-only">{t.feedbackComment}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.feedbackComment}
            className="form-input h-16 resize-none rounded-xl text-sm"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit(helpful)}
            className="btn-touch mt-2 w-full rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
