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
  gender?: string;
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
  P1: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20",
  P2: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20",
  P3: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20",
};

const PRIORITY_TEXT: Record<Priority, string> = {
  P1: "text-red-700 dark:text-red-400",
  P2: "text-amber-700 dark:text-amber-400",
  P3: "text-emerald-700 dark:text-emerald-400",
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
  gender = "",
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
    const caseUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/history/${encodeURIComponent(patientId)}`
        : "https://rural-care-swart.vercel.app";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(caseUrl)}`;
    const priorityColor =
      result.priority === "P1" ? "#dc2626" : result.priority === "P2" ? "#d97706" : "#059669";
    const actionsHtml = result.immediate_actions
      .map((step, i) => `<li><strong>${i + 1}.</strong> ${step}</li>`)
      .join("");
    const emergencyHtml =
      result.call_emergency && result.emergency_number
        ? `<p class="emergency">🚨 Call ${result.emergency_number} immediately</p>`
        : "";

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>RuralCare Triage Card</title>
<style>
@page { size: A4; margin: 16mm; }
body { font-family: Inter, Arial, sans-serif; color: #1e293b; line-height: 1.5; max-width: 180mm; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 16px; }
.logo { font-size: 24px; font-weight: 900; color: #7c3aed; }
.meta { font-size: 12px; color: #64748b; text-align: right; }
.patient { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 14px; }
.priority { text-align: center; padding: 20px; border-radius: 12px; border: 3px solid ${priorityColor}; margin-bottom: 16px; }
.priority-badge { font-size: 64px; font-weight: 900; color: ${priorityColor}; }
.condition { font-size: 20px; font-weight: 700; margin-top: 8px; }
.actions ol { padding-left: 20px; }
.actions li { margin-bottom: 8px; }
.footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
.disclaimer { font-size: 11px; color: #64748b; max-width: 70%; }
.emergency { color: #dc2626; font-weight: bold; font-size: 16px; margin: 12px 0; }
.sign { margin-top: 32px; font-size: 13px; }
</style></head><body>
<div class="header">
  <div class="logo">+ RuralCare</div>
  <div class="meta">${formatAssessedAt(timestamp)}<br/>${t.patientIdLabel}: ${patientId}</div>
</div>
<div class="patient">
  <div><strong>${t.patientNameLabel}:</strong> ${patientName || "—"}</div>
  <div><strong>${t.ageLabel}:</strong> ${age || "—"}</div>
  <div><strong>${t.genderLabel}:</strong> ${gender || "—"}</div>
  <div><strong>${t.locationLabel}:</strong> ${location || "—"}</div>
</div>
<div class="priority">
  <div class="priority-badge">${result.priority}</div>
  <div class="condition">${result.likely_condition}</div>
  <p style="margin-top:8px;font-style:italic">${result.reason}</p>
</div>
${emergencyHtml}
<div class="actions">
  <h3>${t.immediateActions}</h3>
  <ol>${actionsHtml}</ol>
</div>
<div class="footer">
  <div>
    <p class="disclaimer">${t.printAiDisclaimer}</p>
    <p class="sign">${t.printDoctorSign}</p>
  </div>
  <img src="${qrUrl}" alt="QR" width="100" height="100"/>
</div>
</body></html>`);
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
      {!isStreaming && (
        <div className={`results-back-bar ${result.priority === "P1" ? "border-red-500/40" : ""}`}>
          <button type="button" onClick={onNewAssessment} className="results-back-btn">
            {t.backToAssessment}
          </button>
          {result.priority === "P1" && (
            <span className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
              {t.callEmergencyNow}
            </span>
          )}
        </div>
      )}

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
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40">
              {t.assignedPriority}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ConfidenceBadge confidence={displayConfidence} t={t} />
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-medium ${
                  timePulsing
                    ? "animate-pulse border-red-300 bg-red-100 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                    : "border-gray-200 bg-gray-100 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                }`}
              >
                {t.estimatedTime}: {translatedTime}
              </span>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? t.unmuteAudio : t.muteAudio}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:text-gray-800 dark:border-white/10 dark:text-white/50 dark:hover:text-white"
              >
                {muted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>

          <p className={`break-words text-[clamp(48px,14vw,72px)] font-black leading-none ${PRIORITY_TEXT[result.priority]}`}>
            {result.priority}
          </p>
          <p className="mt-1 break-words text-xl text-gray-800 dark:text-white/80">{result.likely_condition}</p>
          <p className="mt-2 break-words text-sm italic text-gray-600 dark:text-white/50">{result.reason}</p>
          <p className="mt-3 text-xs text-gray-400 dark:text-white/30">{assessedLabel}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-white/30">
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
            <button type="button" onClick={() => void speak()} className="text-xs text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white">
              {t.listenAgain}
            </button>
            <button type="button" onClick={printResults} className="text-xs text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white">
              {t.printResult}
            </button>
            <button type="button" onClick={() => void shareResults()} className="text-xs text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white">
              {copied ? t.copied : t.shareResult}
            </button>
          </div>
        </section>
      </StaggerCard>

      <StaggerCard index={cardIndex++}>
        <section className="result-card-premium">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-white/70">
            <MedicalCrossIcon className="h-4 w-4 text-violet-400" />
            {t.clinicalSummary}
          </h3>
          <p className="mb-2 text-xs uppercase tracking-wider text-gray-400 dark:text-white/40">{t.whatsHappening}</p>
          <p className="break-words text-sm leading-relaxed text-gray-600 dark:text-white/60">
            {placeholder(result.what_is_happening) && isStreaming ? "…" : result.what_is_happening}
          </p>
          {result.specialist_needed && (
            <p className="mt-3 break-words text-sm text-gray-600 dark:text-white/60">
              <span className="text-gray-400 dark:text-white/40">{t.specialistNeeded}: </span>
              {result.specialist_needed}
            </p>
          )}
          <p className="mt-3 break-words text-sm text-gray-600 dark:text-white/60">
            <span className="text-gray-400 dark:text-white/40">{t.followUp}: </span>
            {result.follow_up}
          </p>
          <p className="mt-3 break-words text-sm text-gray-500 dark:text-white/50">
            <span className="text-gray-400 dark:text-white/40">{t.clinicalReasoning}: </span>
            {result.clinical_reasoning}
          </p>
        </section>
      </StaggerCard>

      {!isStreaming && result.immediate_actions.length > 0 && (
      <StaggerCard index={cardIndex++}>
        <section id="triage-print-actions" className="result-card-premium">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-white/70">
            {t.immediateActions}
          </h3>
          <ol className="space-y-2">
            {result.immediate_actions.map((step, idx) => (
              <li key={step} className="flex items-start gap-2 py-1.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-300">
                  {idx + 1}
                </span>
                <label className="flex flex-1 items-start gap-2 break-words text-sm leading-relaxed text-gray-600 dark:text-white/60">
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
              <li key={sign} className="flex items-start gap-2 break-words text-sm text-gray-600 dark:text-white/60">
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
              <li key={item} className="flex items-start gap-2 break-words text-sm text-gray-600 dark:text-white/60">
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

      <div className="no-print mx-4 mt-4 space-y-3 pb-4">
        {result.priority === "P1" && (
          <button
            type="button"
            onClick={onNewAssessment}
            className="btn-touch w-full rounded-xl border border-gray-200 bg-gray-100 py-3 font-semibold text-gray-800 transition hover:bg-gray-200 dark:border-white/20 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
          >
            {t.backToAssessment}
          </button>
        )}
        <button
          type="button"
          onClick={onNewAssessment}
          className="btn-touch w-full rounded-xl border border-gray-200 bg-white py-3 font-medium text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
        >
          {t.startNewAssessment}
        </button>
      </div>
    </div>
  );
}
