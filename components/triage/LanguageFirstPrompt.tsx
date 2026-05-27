"use client";

import { useEffect, useState } from "react";
import {
  LANGUAGE_GROUPS,
  LANGUAGE_OPTIONS,
  type LanguageCode,
} from "@/lib/i18n/languages";

type Props = {
  onSelect: (code: LanguageCode) => void;
};

export function LanguageFirstPrompt({ onSelect }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <section
      className={`mx-4 mb-6 scroll-mt-24 rounded-2xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 p-5 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-labelledby="language-prompt-heading"
    >
      <h2 id="language-prompt-heading" className="text-center text-base font-bold text-text-primary sm:text-lg">
        Select your language to begin
      </h2>
      <p className="mt-1 text-center text-sm text-text-muted">
        अपनी भाषा चुनें · மொழியை தேர்ந்தெடுக்கவும்
      </p>
      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto" role="listbox" aria-label="Select language">
        {LANGUAGE_GROUPS.map((group) => {
          const items = LANGUAGE_OPTIONS.filter((l) => l.group === group.id);
          if (!items.length) return null;
          return (
            <div key={group.id}>
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {group.flag} {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    role="option"
                    aria-selected={false}
                    aria-label={`Select language: ${opt.label}`}
                    onClick={() => onSelect(opt.code)}
                    className="triage-focus-ring rounded-full border border-border bg-surface-card px-3 py-2 text-sm font-medium text-text-primary transition hover:border-[#7c3aed] hover:bg-[#7c3aed]/10"
                  >
                    <span aria-hidden>{opt.flag}</span> {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
