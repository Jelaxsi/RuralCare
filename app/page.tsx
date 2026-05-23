"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { MedicalCrossIcon } from "@/components/PriorityBadge";
import { MicSoundWave } from "@/components/SoundWaveVisualizer";
import { SystemStatus, ThemeToggle } from "@/components/SystemStatus";
import { TriageResults } from "@/components/TriageResults";
import { WARD_OPTIONS, hospitalConfig } from "@/lib/hospital/config";
import {
  getLanguageLabel,
  getLanguageOption,
  type LanguageCode,
} from "@/lib/i18n/languages";
import { getTranslations } from "@/lib/i18n/translations";
import type { TriageResult } from "@/lib/types";

type TranscriptWord = { text: string; confidence: number; final: boolean };

type WebkitSpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{ 0: { transcript: string; confidence?: number }; isFinal: boolean }>;
      }) => void)
    | null;
};

function generatePatientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8).toUpperCase();
  }
  return `RC${Date.now().toString(36).toUpperCase()}`;
}

export default function TriagePage() {
  const [patientId] = useState(generatePatientId);
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [patientLocation, setPatientLocation] = useState("");
  const [ward, setWard] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("english");

  const languageOption = getLanguageOption(language);
  const t = getTranslations(languageOption.translationKey);

  const [recording, setRecording] = useState(false);
  const [words, setWords] = useState<TranscriptWord[]>([]);
  const [manualSymptoms, setManualSymptoms] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [slowAnalysis, setSlowAnalysis] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [resultTimestamp, setResultTimestamp] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const recognitionRef = useRef<WebkitSpeechRecognitionLike | null>(null);
  const slowTimerRef = useRef<number | null>(null);

  const transcriptFull = useMemo(() => {
    const spoken = words.map((w) => w.text).join(" ").trim();
    return spoken || manualSymptoms.trim();
  }, [words, manualSymptoms]);

  const resetSession = useCallback(() => {
    setWords([]);
    setResult(null);
    setResultTimestamp("");
    setSaveState("idle");
    setLastError(null);
    setAnalyzing(false);
    setSlowAnalysis(false);
  }, []);

  const startRecording = useCallback(() => {
    resetSession();
    setRecording(true);
    setLastError(null);

    try {
      const w = window as Window & { webkitSpeechRecognition?: new () => WebkitSpeechRecognitionLike };
      if (!w.webkitSpeechRecognition) {
        throw new Error("Web Speech API is not available. Please use Chrome or type symptoms manually.");
      }

      const recognition = new w.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageOption.speechCode;

      recognition.onresult = (event) => {
        const next: TranscriptWord[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const r = event.results[i];
          const text = r[0]?.transcript?.trim();
          if (!text) continue;
          next.push({
            text,
            confidence: r[0]?.confidence ?? (r.isFinal ? 0.9 : 0.5),
            final: r.isFinal,
          });
        }
        setWords(next);
      };

      recognition.onerror = (event) => {
        setLastError(event.error ? `Speech error: ${event.error}` : "Speech recognition error");
        setRecording(false);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Could not start microphone");
      setRecording(false);
    }
  }, [languageOption.speechCode, resetSession]);

  const stopAndAnalyze = useCallback(async () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }

    const transcriptBody = transcriptFull;
    if (!transcriptBody) {
      setLastError("Please speak or type symptoms before analysis.");
      setRecording(false);
      return;
    }

    setAnalyzing(true);
    setSlowAnalysis(false);
    slowTimerRef.current = window.setTimeout(() => setSlowAnalysis(true), 10_000);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patientName,
          age,
          gender,
          location: patientLocation,
          ward,
          chiefComplaint,
          patientId,
          language: getLanguageLabel(language),
          transcript: transcriptBody,
          persist: false,
        }),
      });

      const data = (await res.json()) as TriageResult & { error?: string };

      if (!res.ok) {
        setLastError(data.error ?? "Analysis failed");
        return;
      }

      setResult(data);
      setResultTimestamp(new Date().toISOString());
    } catch {
      setLastError("Network error during analysis");
    } finally {
      if (slowTimerRef.current) window.clearTimeout(slowTimerRef.current);
      setAnalyzing(false);
      setSlowAnalysis(false);
      setRecording(false);
    }
  }, [age, chiefComplaint, gender, language, patientId, patientLocation, patientName, transcriptFull, ward]);

  const saveCase = useCallback(async () => {
    if (!result) return;
    setSaveState("saving");

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patientName,
          age,
          gender,
          location: patientLocation,
          ward,
          chiefComplaint,
          patientId,
          language: getLanguageLabel(language),
          transcript: transcriptFull,
          persist: true,
          triageResult: result,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setLastError(data.error ?? "Save failed");
        setSaveState("idle");
        return;
      }
      setSaveState("saved");
    } catch {
      setLastError("Network error while saving");
      setSaveState("idle");
    }
  }, [age, chiefComplaint, gender, language, patientId, patientLocation, patientName, result, transcriptFull, ward]);

  const newTriage = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setRecording(false);
    resetSession();
    setManualSymptoms("");
    setPatientName("");
    setAge("");
    setGender("");
    setPatientLocation("");
    setWard("");
    setChiefComplaint("");
    setLanguage("english");
  }, [resetSession]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
              <MedicalCrossIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">RuralCare</p>
              <p className="text-sm font-bold text-text-primary">Clinical Triage</p>
            </div>
          </div>

          <div className="hidden flex-1 text-center md:block">
            <p className="text-lg font-bold text-text-primary">{hospitalConfig.name}</p>
            <p className="text-sm text-text-muted">{t.poweredBy}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSelector value={language} onChange={setLanguage} />
            <ThemeToggle translationLang={languageOption.translationKey} />
            <SystemStatus translationLang={languageOption.translationKey} />
            <Link
              href="/dashboard"
              className="hidden rounded-lg border border-border px-4 py-2.5 text-base font-medium text-text-secondary hover:border-brand md:inline-flex"
            >
              {t.dashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {!result && !analyzing && (
          <>
            <section className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">{t.title}</h1>
              <p className="mt-3 max-w-2xl text-lg text-text-secondary">{t.subtitle}</p>
            </section>

            <section className="clinical-card mb-8" aria-labelledby="intake-heading">
              <div className="border-b border-border pb-4">
                <h2 id="intake-heading" className="text-xl font-semibold text-text-primary">
                  {t.patientDetails}
                </h2>
                <p className="mt-1 text-base text-text-muted">{t.captureContext}</p>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-text-secondary">{t.patientIdLabel}</span>
                  <input
                    type="text"
                    readOnly
                    value={patientId}
                    aria-readonly="true"
                    className="input-field bg-surface-muted font-mono"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-text-secondary">{t.patientNameLabel}</span>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    aria-label={t.patientNameLabel}
                    className="input-field"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-text-secondary">{t.ageLabel}</span>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    aria-label={t.ageLabel}
                    className="input-field"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-text-secondary">{t.genderLabel}</span>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    aria-label={t.genderLabel}
                    className="input-field"
                  >
                    <option value="">{t.genderPreferNot}</option>
                    <option value="male">{t.genderMale}</option>
                    <option value="female">{t.genderFemale}</option>
                    <option value="other">{t.genderOther}</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-text-secondary">{t.locationLabel}</span>
                  <input
                    type="text"
                    value={patientLocation}
                    onChange={(e) => setPatientLocation(e.target.value)}
                    placeholder={t.locationPlaceholder}
                    aria-label={t.locationLabel}
                    className="input-field"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-text-secondary">{t.wardLabel}</span>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    aria-label={t.wardLabel}
                    className="input-field"
                  >
                    <option value="">{t.wardPlaceholder}</option>
                    {WARD_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-text-secondary">{t.chiefComplaintLabel}</span>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder={t.chiefComplaintPlaceholder}
                    aria-label={t.chiefComplaintLabel}
                    className="input-field"
                  />
                </label>
              </div>
            </section>

            <section className="mb-8 flex flex-col items-center">
              <div className="relative flex flex-col items-center">
                {!recording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    aria-label={t.startBtn}
                    className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-white shadow-lg ring-8 ring-brand/20 transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand"
                  >
                    <MicIcon />
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-p1-rose text-white shadow-lg ring-8 ring-p1-rose/20">
                      <MicIcon />
                    </div>
                    <MicSoundWave active={recording} />
                    <p className="flex items-center gap-2 text-base font-medium text-text-secondary">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-p1-rose" aria-hidden />
                      {t.listening}
                    </p>
                  </div>
                )}
              </div>

              {recording && (
                <button type="button" onClick={() => void stopAndAnalyze()} className="btn-primary mt-8">
                  {t.stopBtn}
                </button>
              )}

              {!recording && transcriptFull && (
                <button type="button" onClick={() => void stopAndAnalyze()} className="btn-primary mt-8">
                  {t.stopBtn}
                </button>
              )}
            </section>

            <section className="clinical-card mb-8">
              <h2 className="text-lg font-semibold text-text-primary">{t.transcriptTitle}</h2>
              <p className="mt-1 text-sm text-text-muted">{t.transcriptPreview}</p>
              <div
                className="mt-4 max-h-40 min-h-[120px] overflow-y-auto rounded-lg border border-border bg-surface-muted p-4 text-base leading-relaxed"
                aria-live="polite"
                aria-label={t.transcriptTitle}
              >
                {words.length === 0 && !manualSymptoms && (
                  <span className="text-text-muted">{t.transcriptWaiting}</span>
                )}
                {words.map((w, i) => (
                  <span
                    key={`${w.text}-${i}`}
                    className={w.final && w.confidence >= 0.7 ? "text-text-primary" : "text-text-muted"}
                  >
                    {w.text}{" "}
                  </span>
                ))}
              </div>
            </section>

            <section className="clinical-card">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-text-secondary">{t.manualPlaceholder}</span>
                <textarea
                  value={manualSymptoms}
                  onChange={(e) => setManualSymptoms(e.target.value)}
                  rows={4}
                  aria-label={t.manualPlaceholder}
                  className="input-field resize-y"
                />
              </label>
              <p className="mt-3 text-sm text-text-muted">{t.micFooter}</p>
            </section>
          </>
        )}

        {analyzing && (
          <section className="clinical-card space-y-4" aria-live="polite">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-brand/20" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            </div>
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-32 w-full" />
            <p className="text-base font-medium text-text-secondary">
              {slowAnalysis ? t.analyzingSlow : t.analyzing}
            </p>
          </section>
        )}

        {result && !analyzing && (
          <>
            <TriageResults
              result={result}
              t={t}
              patientName={patientName}
              patientId={patientId}
              location={patientLocation}
              languageOption={languageOption}
              timestamp={resultTimestamp}
            />
            <div className="mt-8 flex flex-col gap-4 sm:flex-row no-print">
              <button
                type="button"
                onClick={() => void saveCase()}
                disabled={saveState !== "idle"}
                className="btn-primary"
              >
                {saveState === "saved" ? t.caseSaved : saveState === "saving" ? t.saving : t.saveCase}
              </button>
              <button type="button" onClick={newTriage} className="btn-secondary">
                {t.newTriage}
              </button>
              <Link href="/dashboard" className="btn-secondary text-center">
                {t.openDashboard}
              </Link>
            </div>
          </>
        )}

        {lastError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-p1-rose/40 bg-p1-rose/10 px-5 py-4 text-base text-p1-rose"
          >
            {lastError}
          </div>
        )}
      </main>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 13a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13a5 5 0 1 0 10 0M12 21v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
