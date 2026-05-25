"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { LanguageOption } from "@/lib/i18n/languages";
import { translateEstimatedTimeToCare } from "@/lib/i18n/time-to-care";
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

const PRIORITY_BANNER: Record<Priority, string> = {
  P1: "bg-gradient-to-br from-red-500/15 to-red-500/5 border-red-500/20",
  P2: "bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/20",
  P3: "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/20",
};

const PRIORITY_TEXT: Record<Priority, string> = {
  P1: "text-red-400",
  P2: "text-amber-400",
  P3: "text-emerald-400",
};

function StaggerCard({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div className="animate-stagger" style={{ animationDelay: `${index * 100}ms` }}>
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
  const spokenText = buildSpokenSummary(result, t);
  const speechCode = languageOption.speechCode;
  const translatedTime = translateEstimatedTimeToCare(
    languageOption.translationKey,
    result.estimated_time_to_care,
  );
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

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      await playSpokenSummary({
        text: spokenText,
        speechCode,
        speed: speechRateForPriority(result.priority),
      });

      window.setTimeout(() => {
        setSpeaking(false);
        setDelivered(true);
      }, spokenText.length * 45);
    } catch {
      setNeedsTap(true);
      setSpeaking(false);
    }
  }, [muted, result.priority, spokenText, speechCode]);

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
    if (next && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }

  function printSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>RuralCare</title></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div ref={printRef} className="space-y-3">
      {result.priority === "P1" && (
        <StaggerCard index={cardIndex++}>
          <div className="mx-4 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <span className="animate-pulse text-2xl" aria-hidden>🚨</span>
            <div>
              <p className="font-semibold text-red-300">{t.callEmergency}</p>
              <div className="mt-2 flex gap-2">
                <a href="tel:1990" className="rounded-xl bg-red-500/20 px-4 py-2 text-lg font-bold text-white">
                  1990
                </a>
                <a href="tel:119" className="rounded-xl border border-white/10 px-4 py-2 text-lg font-bold text-white/80">
                  119
                </a>
              </div>
            </div>
          </div>
        </StaggerCard>
      )}

      <StaggerCard index={cardIndex++}>
        <section
          id="triage-print-priority"
          className={`mx-4 rounded-[20px] border p-6 ${PRIORITY_BANNER[result.priority]}`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {t.assignedPriority}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ConfidenceBadge confidence={result.confidence} t={t} />
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-medium ${
                  timePulsing
                    ? "animate-pulse border-red-500/40 bg-red-500/10 text-red-300"
                    : "border-white/10 bg-white/5 text-white/60"
                }`}
              >
                {t.estimatedTime}: {translatedTime}
              </span>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? t.unmuteAudio : t.muteAudio}
                className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:text-white"
              >
                {muted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>

          <p className={`text-[72px] font-black leading-none ${PRIORITY_TEXT[result.priority]}`}>
            {result.priority}
          </p>
          <p className="mt-1 text-xl text-white/80">{result.likely_condition}</p>
          <p className="mt-2 text-sm italic text-white/50">{result.reason}</p>
          <p className="mt-3 text-xs text-white/30">
            ID: {patientId} · {new Date(timestamp).toLocaleString()}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {speaking && (
              <div className="flex items-center gap-2 text-violet-400">
                <SoundWaveVisualizer active bars={5} color="bg-violet-500" size="sm" />
                <span className="text-xs">{t.speaking}</span>
              </div>
            )}
            {delivered && !speaking && (
              <span className="text-xs text-emerald-400">✓ {t.messageDelivered}</span>
            )}
            {needsTap && (
              <button type="button" onClick={() => void speak()} className="text-xs text-violet-400 underline">
                {t.tapToHear}
              </button>
            )}
            <button type="button" onClick={() => void speak()} className="text-xs text-white/50 hover:text-white">
              {t.replayAudio}
            </button>
            <button type="button" onClick={() => printSection("triage-print-priority")} className="text-xs text-white/50 hover:text-white">
              {t.printResult}
            </button>
          </div>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section className="result-card-premium">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
            <MedicalCrossIcon className="h-4 w-4 text-violet-400" />
            {t.clinicalSummary}
          </h3>
          <p className="mb-2 text-xs uppercase tracking-wider text-white/40">{t.whatsHappening}</p>
          <p className="text-sm leading-relaxed text-white/60">{result.what_is_happening}</p>
          {result.specialist_needed && (
            <p className="mt-3 text-sm text-white/60">
              <span className="text-white/40">{t.specialistNeeded}: </span>
              {result.specialist_needed}
            </p>
          )}
          <p className="mt-3 text-sm text-white/60">
            <span className="text-white/40">{t.followUp}: </span>
            {result.follow_up}
          </p>
          <p className="mt-3 text-sm text-white/50">
            <span className="text-white/40">{t.clinicalReasoning}: </span>
            {result.clinical_reasoning}
          </p>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section id="triage-print-actions" className="result-card-premium">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/70">
            {t.immediateActions}
          </h3>
          <ol className="space-y-2">
            {result.immediate_actions.map((step, idx) => (
              <li key={step} className="flex items-start gap-2 py-1.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                  {idx + 1}
                </span>
                <label className="flex flex-1 items-start gap-2 text-sm leading-relaxed text-white/60">
                  <input
                    type="checkbox"
                    checked={Boolean(checkedActions[idx])}
                    onChange={(e) => setCheckedActions((prev) => ({ ...prev, [idx]: e.target.checked }))}
                    className="mt-1"
                  />
                  {step}
                </label>
              </li>
            ))}
          </ol>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section className="result-card-premium">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400/80">
            ⚠ {t.warningSigns}
          </h3>
          <ul className="space-y-1.5">
            {result.warning_signs.map((sign) => (
              <li key={sign} className="flex items-start gap-2 text-sm text-white/60">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {sign}
              </li>
            ))}
          </ul>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section className="result-card-premium">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-400/80">
            ✕ {t.doNotDo}
          </h3>
          <ul className="space-y-1.5">
            {result.do_not_do.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </StaggerCard>

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
