"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { LanguageOption } from "@/lib/i18n/languages";
import type { TranslationKeys } from "@/lib/i18n/translations";
import {
  buildSpokenSummary,
  playSpokenSummary,
  speechRateForPriority,
} from "@/lib/tts/speech";
import type { Priority, TriageResult } from "@/lib/types";
import { NearbyHospitalsMap } from "./NearbyHospitalsMap";
import { ConfidenceBadge, MedicalCrossIcon } from "./PriorityBadge";
import { SoundWaveVisualizer } from "./SoundWaveVisualizer";

type Props = {
  result: TriageResult;
  t: TranslationKeys;
  patientId: string;
  location: string;
  lat: number | null;
  lng: number | null;
  languageOption: LanguageOption;
  timestamp: string;
};

const PRIORITY_GRADIENT: Record<Priority, string> = {
  P1: "from-danger/25 via-danger/10 to-transparent",
  P2: "from-warning/25 via-warning/10 to-transparent",
  P3: "from-success/25 via-success/10 to-transparent",
};

const PRIORITY_BORDER: Record<Priority, string> = {
  P1: "border-l-danger",
  P2: "border-l-warning",
  P3: "border-l-success",
};

const PRIORITY_TEXT: Record<Priority, string> = {
  P1: "text-danger",
  P2: "text-warning",
  P3: "text-success",
};

function StaggerCard({
  index,
  children,
  className = "",
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`animate-stagger ${className}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {children}
    </div>
  );
}

export function TriageResults({
  result,
  t,
  patientId,
  location,
  lat,
  lng,
  languageOption,
  timestamp,
}: Props) {
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spokenText = buildSpokenSummary(result, t.callEmergency);
  const printRef = useRef<HTMLDivElement>(null);
  const timePulsing = result.estimated_time_to_care === "immediately";
  let cardIndex = 0;

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
  }, [languageOption, muted, result.priority, spokenText]);

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

  return (
    <div ref={printRef} className="space-y-5">
      <StaggerCard index={cardIndex++}>
        <section
          id="triage-print-priority"
          className={`relative overflow-hidden rounded-2xl border border-white/[0.06] border-l-4 bg-gradient-to-r p-6 md:p-8 ${PRIORITY_GRADIENT[result.priority]} ${PRIORITY_BORDER[result.priority]}`}
          aria-labelledby="priority-heading"
        >
          {result.priority === "P1" && (
            <div className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-danger">
              🚨 {t.emergencyBanner} — 1990
            </div>
          )}

          <div className="absolute right-4 top-4">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? t.unmuteAudio : t.muteAudio}
              className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-white/60 transition hover:border-white/20 hover:text-white"
            >
              {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            </button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`text-[72px] font-black leading-none ${PRIORITY_TEXT[result.priority]}`}>
                {result.priority}
              </p>
              <h2 id="priority-heading" className="mt-2 text-2xl font-bold text-white md:text-3xl">
                {result.likely_condition}
              </h2>
              {result.icd_code && (
                <p className="mt-1 text-sm text-white/40">
                  {t.icdCode}: <span className="font-mono">{result.icd_code}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ConfidenceBadge confidence={result.confidence} t={t} />
              <div
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  timePulsing
                    ? "animate-pulse border-danger/40 bg-danger/10 text-danger"
                    : "border-white/10 bg-white/[0.05] text-white/70"
                }`}
              >
                {t.estimatedTime}: {result.estimated_time_to_care}
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-white/40">
            ID: {patientId} · {new Date(timestamp).toLocaleString()}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {speaking && (
              <div className="flex items-center gap-2 text-primary">
                <SoundWaveVisualizer active color="bg-primary" />
                <span className="text-sm font-medium">{t.speaking}</span>
              </div>
            )}
            {delivered && !speaking && (
              <span className="text-sm font-medium text-success">✓ {t.messageDelivered}</span>
            )}
            {needsTap && (
              <button
                type="button"
                onClick={() => void speak()}
                className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              >
                {t.tapToHear}
              </button>
            )}
            <button
              type="button"
              onClick={() => void speak()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              <SpeakerOnIcon />
              {t.replayAudio}
            </button>
            <button
              type="button"
              onClick={() => printSection("triage-print-priority")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              {t.printResult}
            </button>
          </div>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section className={`result-card border-l-4 ${PRIORITY_BORDER[result.priority]}`}>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <MedicalCrossIcon className="h-5 w-5 text-primary" />
            {t.clinicalSummary}
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{t.whatsHappening}</p>
              <p className="mt-2 text-base leading-relaxed text-white/90">{result.what_is_happening}</p>
            </div>
            {result.specialist_needed && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{t.specialistNeeded}</p>
                <p className="mt-1 text-base text-white/90">{result.specialist_needed}</p>
              </div>
            )}
            {result.medications_to_avoid.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{t.medicationsToAvoid}</p>
                <ul className="mt-2 list-disc pl-5 text-base text-white/90">
                  {result.medications_to_avoid.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{t.followUp}</p>
              <p className="mt-1 text-base text-white/90">{result.follow_up}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{t.clinicalReasoning}</p>
              <p className="mt-2 text-base leading-relaxed text-white/60">{result.clinical_reasoning}</p>
            </div>
          </div>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section id="triage-print-actions" className="result-card border-l-4 border-l-primary">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-white">{t.immediateActions}</h3>
            <button
              type="button"
              onClick={() => printSection("triage-print-actions")}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t.printActions}
            </button>
          </div>
          <ol className="mt-4 space-y-3">
            {result.immediate_actions.map((step, idx) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
              >
                <input
                  type="checkbox"
                  id={`action-${idx}`}
                  checked={Boolean(checkedActions[idx])}
                  onChange={(e) => setCheckedActions((prev) => ({ ...prev, [idx]: e.target.checked }))}
                  className="mt-1 h-5 w-5 rounded border-white/20 text-primary focus:ring-primary"
                  aria-label={`Step ${idx + 1}: ${step}`}
                />
                <label htmlFor={`action-${idx}`} className="text-base text-white/90">
                  <span className="mr-2 font-bold text-primary">{idx + 1}.</span>
                  {step}
                </label>
              </li>
            ))}
          </ol>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section className="result-card border-l-4 border-l-warning">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-warning">
            <WarningIcon />
            {t.warningSigns}
          </h3>
          <p className="mt-1 text-sm text-white/50">{t.warningSignsSubtitle}</p>
          <ul className="mt-4 space-y-2">
            {result.warning_signs.map((sign) => (
              <li key={sign} className="flex items-start gap-2 text-base text-white/90">
                <span className="text-warning" aria-hidden>⚠</span>
                {sign}
              </li>
            ))}
          </ul>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section className="result-card border-l-4 border-l-danger">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-danger">
            <StopIcon />
            {t.doNotDo}
          </h3>
          <p className="mt-1 text-sm text-white/50">{t.doNotDoSubtitle}</p>
          <ul className="mt-4 space-y-2">
            {result.do_not_do.map((item) => (
              <li key={item} className="flex items-start gap-2 text-base text-white/90">
                <span className="text-danger" aria-hidden>✕</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </StaggerCard>

      {(result.priority === "P1" || result.priority === "P2") && (
        <StaggerCard index={cardIndex++}>
          <section className="result-card border-l-4 border-l-danger">
            <h3 className="text-lg font-semibold text-white">{t.emergencyContacts}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Ambulance (Suwa Seriya)", number: "1990", icon: "🚑", urgent: true },
                { label: "Police", number: "119", icon: "👮", urgent: false },
                { label: "Fire & Rescue", number: "110", icon: "🚒", urgent: false },
              ].map((c) => (
                <a
                  key={c.number}
                  href={`tel:${c.number}`}
                  className={`flex flex-col items-center rounded-xl border p-4 text-center transition ${
                    c.urgent
                      ? "border-danger/40 bg-danger/10 hover:bg-danger/15"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>{c.icon}</span>
                  <span className="mt-2 text-sm text-white/50">{c.label}</span>
                  <span className="mt-1 text-2xl font-black text-white">{c.number}</span>
                </a>
              ))}
            </div>
          </section>
        </StaggerCard>
      )}

      <StaggerCard index={cardIndex++}>
        <NearbyHospitalsMap
          lat={lat}
          lng={lng}
          locationLabel={location}
          priority={result.priority}
          t={t}
        />
      </StaggerCard>
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
