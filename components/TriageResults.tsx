"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LanguageOption } from "@/lib/i18n/languages";
import type { TranslationKeys } from "@/lib/i18n/translations";
import {
  buildSpokenSummary,
  playSpokenSummary,
  speechRateForPriority,
} from "@/lib/tts/speech";
import type { TriageResult } from "@/lib/types";
import { NearbyHospitalsMap } from "./NearbyHospitalsMap";
import { ConfidenceBadge, MedicalCrossIcon, PriorityBadge } from "./PriorityBadge";
import { SoundWaveVisualizer } from "./SoundWaveVisualizer";

type Props = {
  result: TriageResult;
  t: TranslationKeys;
  patientName: string;
  patientId: string;
  location: string;
  languageOption: LanguageOption;
  languageLabel: string;
  timestamp: string;
  lat: number | null;
  lng: number | null;
};

export function TriageResults({
  result,
  t,
  patientId,
  location,
  languageOption,
  languageLabel,
  timestamp,
  lat,
  lng,
}: Props) {
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spokenText = buildSpokenSummary(result);
  const printRef = useRef<HTMLDivElement>(null);
  const priorityBorder =
    result.priority === "P1"
      ? "border-l-danger bg-danger/5"
      : result.priority === "P2"
        ? "border-l-warning bg-warning/5"
        : "border-l-success bg-success/5";

  useEffect(() => {
    const stored = localStorage.getItem("ruralcare-audio-muted");
    if (stored === "true") setMuted(true);
  }, []);

  const speak = useCallback(async () => {
    if (muted) return;
    setSpeaking(true);
    setDelivered(false);
    setNeedsTap(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const playback = await playSpokenSummary({
        text: spokenText,
        languageLabel,
        valseaLanguage: languageOption.valseaLanguage,
        speechCode: languageOption.speechCode,
        speed: speechRateForPriority(result.priority),
      });

      if (playback.audio) {
        audioRef.current = playback.audio;
        playback.audio.onended = () => {
          setSpeaking(false);
          setDelivered(true);
        };
      } else {
        window.setTimeout(() => {
          setSpeaking(false);
          setDelivered(true);
        }, spokenText.length * 45);
      }
    } catch {
      setNeedsTap(true);
      setSpeaking(false);
    }
  }, [languageLabel, languageOption, muted, result.priority, spokenText]);

  useEffect(() => {
    if (muted) return;
    const timer = window.setTimeout(() => {
      void speak().catch(() => setNeedsTap(true));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [muted, speak]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("ruralcare-audio-muted", String(next));
    if (next && audioRef.current) {
      audioRef.current.pause();
      setSpeaking(false);
    }
  }

  function printSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>RuralCare Triage</title>
      <style>
        body { font-family: Inter, sans-serif; padding: 24px; color: #1e293b; }
        h1 { color: #1e3a5f; } .badge { font-size: 32px; font-weight: bold; }
        .meta { color: #64748b; font-size: 14px; margin-bottom: 16px; }
        ol li { margin-bottom: 8px; }
      </style></head><body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  }

  const timePulsing = result.estimated_time_to_care === "immediately";

  return (
    <div ref={printRef} className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{t.resultTitle}</h2>

      {result.priority === "P1" && (
        <div className="animate-slide-up rounded-2xl border border-danger/50 bg-danger/15 px-5 py-4 text-center font-bold text-danger">
          🚨 {t.emergencyBanner} — 1990
        </div>
      )}

      {/* Priority card */}
      <section
        id="triage-print-priority"
        className={`glass-card border-l-4 p-6 md:p-8 animate-slide-up ${priorityBorder}`}
        aria-labelledby="priority-heading"
      >
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? t.unmuteAudio : t.muteAudio}
            className="rounded-lg border border-border p-2 text-text-secondary hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
          </button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <PriorityBadge priority={result.priority} t={t} />
            <h2 id="priority-heading" className="mt-4 text-2xl font-bold text-text-primary md:text-3xl">
              {result.likely_condition}
            </h2>
            {result.icd_code && (
              <p className="mt-1 text-sm text-text-muted">
                {t.icdCode}: <span className="font-mono">{result.icd_code}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <ConfidenceBadge confidence={result.confidence} t={t} />
            <div
              className={`rounded-lg border border-border bg-surface-muted px-4 py-2 text-base ${
                timePulsing ? "animate-pulse border-p1-rose/40 text-p1-rose" : "text-text-secondary"
              }`}
            >
              <span className="text-sm font-medium">{t.estimatedTime}: </span>
              <span className="font-semibold capitalize">{result.estimated_time_to_care}</span>
            </div>
            <p className="text-sm text-text-muted">
              ID: {patientId} · {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {speaking && (
            <div className="flex items-center gap-2 text-brand-violet">
              <SoundWaveVisualizer active color="bg-brand-violet" />
              <span className="text-sm font-medium">{t.speaking}</span>
            </div>
          )}
          {delivered && !speaking && (
            <span className="text-sm font-medium text-p3-emerald">✓ {t.messageDelivered}</span>
          )}
          {needsTap && (
            <button
              type="button"
              onClick={() => void speak()}
              className="rounded-lg border border-brand bg-brand/10 px-4 py-2 text-base font-medium text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {t.tapToHear}
            </button>
          )}
          <button
            type="button"
            onClick={() => void speak()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-base font-medium text-text-secondary hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <SpeakerOnIcon />
            {t.replayAudio}
          </button>
          <button
            type="button"
            onClick={() => printSection("triage-print-priority")}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-base font-medium text-text-secondary hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t.printResult}
          </button>
        </div>
      </section>

      {/* Clinical summary */}
      <section className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <MedicalCrossIcon className="h-5 w-5 text-brand" />
          {t.clinicalSummary}
        </h3>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">{t.whatsHappening}</p>
            <p className="mt-2 text-base leading-relaxed text-text-primary">{result.what_is_happening}</p>
          </div>
          {result.specialist_needed && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">{t.specialistNeeded}</p>
              <p className="mt-1 text-base text-text-primary">{result.specialist_needed}</p>
            </div>
          )}
          {result.medications_to_avoid.length > 0 && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">{t.medicationsToAvoid}</p>
              <ul className="mt-2 list-disc pl-5 text-base text-text-primary">
                {result.medications_to_avoid.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-text-muted">{t.followUp}</p>
            <p className="mt-1 text-base text-text-primary">{result.follow_up}</p>
          </div>
        </div>
      </section>

      {/* Immediate actions */}
      <section id="triage-print-actions" className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-text-primary">{t.immediateActions}</h3>
          <button
            type="button"
            onClick={() => printSection("triage-print-actions")}
            className="text-sm font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t.printActions}
          </button>
        </div>
        <ol className="mt-4 space-y-3">
          {result.immediate_actions.map((step, idx) => (
            <li key={step} className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-3">
              <input
                type="checkbox"
                id={`action-${idx}`}
                checked={Boolean(checkedActions[idx])}
                onChange={(e) => setCheckedActions((prev) => ({ ...prev, [idx]: e.target.checked }))}
                className="mt-1 h-5 w-5 rounded border-border text-brand focus:ring-brand"
                aria-label={`Step ${idx + 1}: ${step}`}
              />
              <label htmlFor={`action-${idx}`} className="text-base text-text-primary">
                <span className="mr-2 font-bold text-brand">{idx + 1}.</span>
                {step}
              </label>
            </li>
          ))}
        </ol>
      </section>

      {/* Warning signs */}
      <section className="rounded-2xl border border-p2-amber/40 bg-p2-amber/5 p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-p2-amber">
          <WarningIcon />
          {t.warningSigns}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">{t.warningSignsSubtitle}</p>
        <ul className="mt-4 space-y-2">
          {result.warning_signs.map((sign) => (
            <li key={sign} className="flex items-start gap-2 text-base text-text-primary">
              <span className="text-p2-amber" aria-hidden>⚠</span>
              {sign}
            </li>
          ))}
        </ul>
      </section>

      {/* Do not do */}
      <section className="rounded-2xl border border-p1-rose/40 bg-p1-rose/5 p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-p1-rose">
          <StopIcon />
          {t.doNotDo}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">{t.doNotDoSubtitle}</p>
        <ul className="mt-4 space-y-2">
          {result.do_not_do.map((item) => (
            <li key={item} className="flex items-start gap-2 text-base text-text-primary">
              <span className="text-p1-rose" aria-hidden>✕</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Emergency contacts */}
      {(result.priority === "P1" || result.priority === "P2") && (
        <section className="rounded-2xl border border-p1-rose/30 bg-surface-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary">{t.emergencyContacts}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Ambulance (Suwa Seriya)", number: "1990", icon: "🚑", urgent: true },
              { label: "Police", number: "119", icon: "👮", urgent: false },
              { label: "Fire & Rescue", number: "110", icon: "🚒", urgent: false },
            ].map((c) => (
              <a
                key={c.number}
                href={`tel:${c.number}`}
                className={`flex flex-col items-center rounded-xl border p-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  c.urgent
                    ? "border-p1-rose/40 bg-p1-rose/10 hover:bg-p1-rose/15"
                    : "border-border bg-surface-muted hover:bg-surface-light"
                }`}
              >
                <span className="text-2xl" aria-hidden>{c.icon}</span>
                <span className="mt-2 text-sm text-text-secondary">{c.label}</span>
                <span className="mt-1 text-2xl font-black text-text-primary">{c.number}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Nearest hospitals map */}
      <NearbyHospitalsMap lat={lat} lng={lng} locationLabel={location} priority={result.priority} t={t} />
    </div>
  );
}

function SpeakerOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
    </svg>
  );
}
