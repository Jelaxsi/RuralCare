"use client";

import { useEffect, useRef, useState } from "react";
import {
  LANGUAGE_GROUPS,
  LANGUAGE_OPTIONS,
  type LanguageCode,
  type LanguageOption,
} from "@/lib/i18n/languages";
import { getTranslations } from "@/lib/i18n/translations";

export function LanguageSelector({
  value,
  onChange,
}: {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
}) {
  const selected = LANGUAGE_OPTIONS.find((l) => l.code === value) ?? LANGUAGE_OPTIONS[0];
  const t = getTranslations(selected.translationKey);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = query.trim()
    ? LANGUAGE_OPTIONS.filter((l) => l.label.toLowerCase().includes(query.toLowerCase()))
    : LANGUAGE_OPTIONS;

  return (
    <div ref={ref} className="relative max-w-[min(100vw-8rem,280px)]">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t.preferredLanguage}: ${selected.label}`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-full border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 backdrop-blur-md transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08] sm:px-4 sm:text-base"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0" aria-hidden>
            {selected.flag}
          </span>
          <span className="max-w-[200px] truncate">{selected.label}</span>
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t.preferredLanguage}
          className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1117]/95"
        >
          <div className="border-b border-gray-200 p-2 dark:border-white/10">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchLanguage}
              aria-label={t.searchLanguage}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/10 dark:bg-[#121826] dark:text-white dark:placeholder-white/30"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {LANGUAGE_GROUPS.map((group) => {
              const items = filtered.filter((l) => l.group === group.id);
              if (!items.length) return null;
              return (
                <div key={group.id} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/50">
                    {group.flag} {group.label}
                  </div>
                  {items.map((opt) => (
                    <LanguageOptionButton
                      key={opt.code}
                      option={opt}
                      selected={value === opt.code}
                      onSelect={() => {
                        onChange(opt.code);
                        setOpen(false);
                        setQuery("");
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageOptionButton({
  option,
  selected,
  onSelect,
}: {
  option: LanguageOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        selected
          ? "bg-brand/10 font-semibold text-brand dark:bg-brand/20"
          : "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-white/[0.06]"
      }`}
    >
      <span aria-hidden>{option.flag}</span>
      {option.label}
    </button>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className={`shrink-0 text-gray-500 transition dark:text-white/50 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
