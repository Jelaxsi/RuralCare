"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { LanguageOption } from "@/lib/i18n/languages";
import { translateEstimatedTimeToCare } from "@/lib/i18n/time-to-care";
import type { TranslationKeys } from "@/lib/i18n/translations";
import { confidenceFromTranscript } from "@/lib/triage/confidence";
import {
  buildSpokenSummary,
  playSpokenSummary,
  speechRateForPriority,
} from "@/lib/tts/speech";
import type { Confidence, Priority, TriageResult } from "@/lib/types";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { EmergencyContacts } from "./EmergencyContacts";
import { NearbyHospitalsMap } from "./NearbyHospitalsMap";
import { ConfidenceBadge, MedicalCrossIcon } from "./PriorityBadge";
import { SoundWaveVisualizer } from "./SoundWaveVisualizer";

type Props = {
  result: TriageResult;
  t: TranslationKeys;
  patientId: string;
  patientName: string;
  age: string;
  transcript: string;
  location: string;
  lat: number | null;
  lng: number | null;
  languageOption: LanguageOption;
  timestamp: string;
  onNewAssessment: () => void;
  isStreaming?: boolean;
  suppressAutoSpeak?: boolean;
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

function formatAssessedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

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
  patientName,
  age,
  transcript,
  location,
  lat,
  lng,
  languageOption,
  timestamp,
  onNewAssessment,
  isStreaming = false,
  suppressAutoSpeak = false,
}: Props) {
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [copied, setCopied] = useState(false);
  const spokenText = buildSpokenSummary(result);
  const speechCode = languageOption.speechCode;
  const displayConfidence: Confidence = confidenceFromTranscript(transcript);
  const translatedTime = translateEstimatedTimeToCare(
    languageOption.translationKey,
    result.estimated_time_to_care,
  );
  const printRef = useRef<HTMLDivElement>(null);
  const timePulsing = result.estimated_time_to_care === "immediately";
  const assessedLabel = `${t.assessedAt} ${formatAssessedAt(timestamp)}`;
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
      void playSpokenSummary({
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
    if (muted || suppressAutoSpeak || isStreaming) {
      if (suppressAutoSpeak && !muted) setSpeaking(true);
      return;
    }
    void speak().catch(() => setNeedsTap(true));
  }, [muted, speak, suppressAutoSpeak, isStreaming]);

  const placeholder = (value: string) => value.trim() === "…";

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("ruralcare-audio-muted", String(next));
    if (next && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }

  function printResults() {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><title>RuralCare Triage</title><style>body{font-family:sans-serif;padding:24px;line-height:1.5}</style></head><body>${html}</body></html>`,
    );
    win.document.close();
    win.print();
  }

  async function shareResults() {
    const summary = [
      t.shareSummaryTitle,
      `${t.sharePatientLabel}: ${patientName || t.shareUnknown}, ${t.ageLabel}: ${age || t.shareUnknown}`,
      `${t.sharePriorityLabel}: ${result.priority}`,
      `${t.shareAssessmentLabel}: ${result.reason}`,
      `${t.shareTimeLabel}: ${formatAssessedAt(timestamp)}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: t.shareSummaryTitle, text: summary });
        return;
      }
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[Share] Failed:", err);
    }
  }

  return (
    <div ref={printRef} className="space-y-3 page-fade-in">
      {result.priority === "P1" && (
        <StaggerCard index={cardIndex++}>
          <EmergencyContacts t={t} />
        </StaggerCard>
      )}

      <StaggerCard index={cardIndex++}>
        <section
          id="triage-print-priority"
          className={`mx-4 rounded-[20px] border-2 p-6 ${PRIORITY_BANNER[result.priority]} ${
            result.priority === "P1" ? "pulse-red border-red-500" : "border-transparent"
          } ${isStreaming ? "animate-pulse" : ""}`}
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {t.assignedPriority}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ConfidenceBadge confidence={displayConfidence} t={t} />
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

          <p className={`break-words text-[clamp(48px,14vw,72px)] font-black leading-none ${PRIORITY_TEXT[result.priority]}`}>
            {result.priority}
          </p>
          <p className="mt-1 break-words text-xl text-white/80">{result.likely_condition}</p>
          <p className="mt-2 break-words text-sm italic text-white/50">{result.reason}</p>
          <p className="mt-3 text-xs text-white/30">{assessedLabel}</p>
          <p className="mt-1 text-xs text-white/25">
            {t.patientIdLabel}: {patientId}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
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
              {t.listenAgain}
            </button>
            <button type="button" onClick={printResults} className="text-xs text-white/50 hover:text-white">
              {t.printResult}
            </button>
            <button type="button" onClick={() => void shareResults()} className="text-xs text-white/50 hover:text-white">
              {copied ? t.copied : t.shareResult}
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
          <p className="break-words text-sm leading-relaxed text-white/60">
            {placeholder(result.what_is_happening) && isStreaming ? "…" : result.what_is_happening}
          </p>
          {result.specialist_needed && (
            <p className="mt-3 break-words text-sm text-white/60">
              <span className="text-white/40">{t.specialistNeeded}: </span>
              {result.specialist_needed}
            </p>
          )}
          <p className="mt-3 break-words text-sm text-white/60">
            <span className="text-white/40">{t.followUp}: </span>
            {result.follow_up}
          </p>
          <p className="mt-3 break-words text-sm text-white/50">
            <span className="text-white/40">{t.clinicalReasoning}: </span>
            {result.clinical_reasoning}
          </p>
        </section>
      </StaggerCard>

      {!isStreaming && result.immediate_actions.length > 0 && (
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
                <label className="flex flex-1 items-start gap-2 break-words text-sm leading-relaxed text-white/60">
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
      )}

      {!isStreaming && result.warning_signs.length > 0 && (
      <StaggerCard index={cardIndex++}>
        <section className="result-card-premium">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400/80">
            ⚠ {t.warningSigns}
          </h3>
          <ul className="space-y-1.5">
            {result.warning_signs.map((sign) => (
              <li key={sign} className="flex items-start gap-2 break-words text-sm text-white/60">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {sign}
              </li>
            ))}
          </ul>
        </section>
      </StaggerCard>
      )}

      {!isStreaming && result.do_not_do.length > 0 && (
      <StaggerCard index={cardIndex++}>
        <section className="result-card-premium">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-400/80">
            ✕ {t.doNotDo}
          </h3>
          <ul className="space-y-1.5">
            {result.do_not_do.map((item) => (
              <li key={item} className="flex items-start gap-2 break-words text-sm text-white/60">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </StaggerCard>
      )}

      {!isStreaming && (
      <StaggerCard index={cardIndex++}>
        <NearbyHospitalsMap lat={lat} lng={lng} locationLabel={location} priority={result.priority} t={t} />
      </StaggerCard>
      )}

      <div className="mx-4 mt-2">
        <DisclaimerBanner text={t.disclaimerResult} size="sm" />
      </div>

      <div className="no-print mx-4 mt-4 pb-4">
        <button
          type="button"
          onClick={onNewAssessment}
          className="btn-touch w-full rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white/80 transition hover:bg-white/10"
        >
          {t.startNewAssessment}
        </button>
      </div>
    </div>
  );
}
