"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { MicSoundWave } from "@/components/SoundWaveVisualizer";
import { SystemStatus } from "@/components/SystemStatus";
import { TriageResults } from "@/components/TriageResults";
import {
  getLanguageLabel,
  getLanguageOption,
  type LanguageCode,
} from "@/lib/i18n/languages";
import { getTranslations } from "@/lib/i18n/translations";
import type { TriageResult } from "@/lib/types";

async function resolveAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/osm/reverse?lat=${lat}&lon=${lng}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: string | null };
    return data.address ?? null;
  } catch {
    return null;
  }
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
      }) => void)
    | null;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function createClientPatientId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function TriagePage() {
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [patientLocation, setPatientLocation] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("english");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const languageOption = getLanguageOption(language);
  const t = getTranslations(languageOption.translationKey);

  const [recording, setRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [manualSymptoms, setManualSymptoms] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [resultTimestamp, setResultTimestamp] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isRecordingRef = useRef(false);
  const intentionalStopRef = useRef(false);

  useEffect(() => {
    setPatientId(createClientPatientId());
  }, []);

  const transcriptFull = useMemo(() => {
    const spoken = `${finalTranscript} ${interimTranscript}`.trim();
    return spoken || manualSymptoms.trim();
  }, [finalTranscript, interimTranscript, manualSymptoms]);

  const resetSession = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setResult(null);
    setResultTimestamp("");
    setSaveState("idle");
    setLastError(null);
    setAnalyzing(false);
  }, []);

  const stopRecognition = useCallback(() => {
    intentionalStopRef.current = true;
    isRecordingRef.current = false;
    setRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLastError(t.locationDenied);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const address = await resolveAddress(latitude, longitude);
        setPatientLocation(address ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setLocating(false);
      },
      () => {
        setLastError(t.locationDenied);
        setLocating(false);
      },
    );
  }, [t.locationDenied]);

  const startRecording = useCallback(() => {
    resetSession();
    setLastError(null);
    setFinalTranscript("");
    setInterimTranscript("");

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setLastError("Web Speech API is not available. Please use Chrome or type symptoms manually.");
      return;
    }

    intentionalStopRef.current = false;
    isRecordingRef.current = true;
    setRecording(true);

    try {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageOption.speechCode;

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript ?? "";
          if (event.results[i].isFinal) final += transcript;
          else interim += transcript;
        }
        if (final) setFinalTranscript((prev) => prev + final);
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech" && isRecordingRef.current) {
          try {
            recognition.start();
          } catch {
            /* already running */
          }
          return;
        }
        if (event.error === "aborted") return;
        if (event.error === "not-allowed") {
          setLastError("Microphone permission denied. Please allow access or type symptoms manually.");
          stopRecognition();
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current && !intentionalStopRef.current) {
          try {
            recognition.start();
          } catch {
            /* noop */
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      isRecordingRef.current = false;
      setRecording(false);
      setLastError(e instanceof Error ? e.message : "Could not start microphone");
    }
  }, [languageOption.speechCode, resetSession, stopRecognition]);

  const stopAndAnalyze = useCallback(async () => {
    stopRecognition();

    const transcriptBody = `${finalTranscript} ${interimTranscript}`.trim() || manualSymptoms.trim();
    if (!transcriptBody) {
      setLastError("Please speak or type symptoms before analysis.");
      return;
    }

    setAnalyzing(true);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patientName,
          age,
          gender,
          location: patientLocation,
          chiefComplaint,
          patientId: patientId || undefined,
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
      setAnalyzing(false);
    }
  }, [
    age,
    chiefComplaint,
    finalTranscript,
    gender,
    interimTranscript,
    language,
    manualSymptoms,
    patientId,
    patientLocation,
    patientName,
    stopRecognition,
  ]);

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
          chiefComplaint,
          patientId: patientId || undefined,
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
  }, [age, chiefComplaint, gender, language, patientId, patientLocation, patientName, result, transcriptFull]);

  const newTriage = useCallback(() => {
    stopRecognition();
    resetSession();
    setManualSymptoms("");
    setPatientName("");
    setAge("");
    setGender("");
    setPatientLocation("");
    setChiefComplaint("");
    setLanguage("english");
    setCoords(null);
    setPatientId(createClientPatientId());
  }, [resetSession, stopRecognition]);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      isRecordingRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  const hasSpeech = Boolean(finalTranscript || interimTranscript);

  return (
    <div className="min-h-screen bg-deep">
      {/* Fixed navbar */}
      <header className="app-nav">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
              <span className="text-lg font-bold text-white">+</span>
            </div>
            <div className="ml-2">
              <p className="text-base font-semibold text-white">RuralCare</p>
              <p className="hidden text-xs text-white/40 sm:block">{t.brandSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector value={language} onChange={setLanguage} />
            <SystemStatus translationLang={languageOption.translationKey} />
            <Link
              href="/dashboard"
              className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 sm:inline-flex"
            >
              {t.dashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl pb-10">
        {!result && !analyzing && (
          <>
            {/* Hero */}
            <section className="hero-section">
              <h1 className="hero-title">{t.title}</h1>
              <p className="mx-auto max-w-md text-base text-white/50">{t.subtitle}</p>
            </section>

            {/* Patient form */}
            <section className="form-card mb-6" aria-labelledby="intake-heading">
              <p id="intake-heading" className="mb-4 text-xs font-semibold uppercase tracking-widest text-violet-400/80">
                {t.patientDetails}
              </p>
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 font-mono text-xs text-violet-300">
                <span>{t.patientIdLabel}:</span>
                <span suppressHydrationWarning>{patientId || "--------"}</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label">{t.patientNameLabel}</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">{t.ageLabel}</label>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t.agePlaceholder}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">{t.genderLabel}</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="form-input">
                    <option value="">{t.genderPreferNot}</option>
                    <option value="male">{t.genderMale}</option>
                    <option value="female">{t.genderFemale}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">{t.locationLabel}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={patientLocation}
                      onChange={(e) => setPatientLocation(e.target.value)}
                      placeholder={t.locationPlaceholder}
                      className="form-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => void detectLocation()}
                      disabled={locating}
                      className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {locating ? t.locationDetecting : t.detectLocation}
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">{t.chiefComplaintLabel}</label>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder={t.chiefComplaintPlaceholder}
                    className="form-input"
                  />
                </div>
              </div>
            </section>

            {/* Mic section */}
            <section className="flex flex-col items-center gap-4 px-4 py-8">
              {!recording && (
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={startRecording}
                    aria-label={t.startBtn}
                    className="mic-btn-idle"
                  >
                    <MicIcon size={32} />
                  </button>
                  <p className="mt-2 text-sm text-white/40">{t.startBtn}</p>
                </div>
              )}

              {recording && (
                <div className="flex flex-col items-center">
                  <div className="relative flex h-[88px] w-[88px] items-center justify-center">
                    <span className="mic-ring-rec h-[110px] w-[110px]" style={{ animationDelay: "0s" }} />
                    <span className="mic-ring-rec h-[130px] w-[130px]" style={{ animationDelay: "0.4s" }} />
                    <span className="mic-ring-rec h-[150px] w-[150px]" style={{ animationDelay: "0.8s" }} />
                    <div className="mic-btn-recording">
                      <MicIcon size={32} />
                    </div>
                  </div>
                  <MicSoundWave active />
                  <p className="mt-3 animate-pulse text-sm font-medium text-white/70">{t.listening}</p>
                  <button
                    type="button"
                    onClick={() => void stopAndAnalyze()}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-8 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-white/90"
                  >
                    <StopIcon />
                    {t.stopBtn}
                  </button>
                </div>
              )}

              {!recording && transcriptFull && (
                <button
                  type="button"
                  onClick={() => void stopAndAnalyze()}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-white/90"
                >
                  <StopIcon />
                  {t.stopBtn}
                </button>
              )}
            </section>

            {/* Live transcript */}
            <section className="transcript-card mb-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MicIcon size={16} className="text-violet-400" />
                  <span className="text-sm font-medium text-white/70">{t.transcriptTitle}</span>
                </div>
                <span className="text-xs text-white/30">{languageOption.label}</span>
              </div>
              <div className="min-h-[80px] text-sm leading-relaxed" aria-live="polite">
                {!hasSpeech && !manualSymptoms && (
                  <p className="py-4 text-center text-white/20">{t.transcriptWaiting}</p>
                )}
                {hasSpeech && (
                  <p>
                    {finalTranscript && <span className="text-white">{finalTranscript}</span>}
                    {interimTranscript && (
                      <span className="italic text-white/40">
                        {finalTranscript ? " " : ""}
                        {interimTranscript}
                      </span>
                    )}
                  </p>
                )}
                {!hasSpeech && manualSymptoms && (
                  <p className="text-white">{manualSymptoms}</p>
                )}
              </div>
            </section>

            {/* Manual input */}
            <section className="mx-4">
              <textarea
                value={manualSymptoms}
                onChange={(e) => setManualSymptoms(e.target.value)}
                placeholder={t.manualPlaceholder}
                className="form-input h-20 resize-none rounded-2xl"
              />
            </section>
          </>
        )}

        {/* Processing */}
        {analyzing && (
          <section className="flex flex-col items-center px-4 py-20" aria-live="polite">
            <div className="relative flex h-[88px] w-[88px] items-center justify-center">
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500 border-r-cyan-400" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600/20">
                <SparkleIcon />
              </div>
            </div>
            <p className="mt-6 flex items-center gap-2 text-base font-medium text-white/80">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              {t.analyzing}
            </p>
            <div className="mt-8 w-full space-y-3">
              <div className="skeleton h-28 w-full" />
              <div className="skeleton h-20 w-full" />
              <div className="skeleton h-32 w-full" />
            </div>
          </section>
        )}

        {/* Results */}
        {result && !analyzing && (
          <>
            <div className="pt-[calc(64px+16px)]">
              <TriageResults
                result={result}
                t={t}
                patientId={patientId || "--------"}
                location={patientLocation}
                lat={coords?.lat ?? null}
                lng={coords?.lng ?? null}
                languageOption={languageOption}
                timestamp={resultTimestamp}
              />
            </div>
            <div className="no-print mx-4 mt-4 flex gap-3 pb-8">
              <button
                type="button"
                onClick={() => void saveCase()}
                disabled={saveState !== "idle"}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {saveState === "saved" ? t.caseSaved : saveState === "saving" ? t.saving : t.saveCase}
              </button>
              <button
                type="button"
                onClick={newTriage}
                className="flex flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white/70 transition hover:bg-white/10"
              >
                {t.newTriage}
              </button>
            </div>
          </>
        )}

        {lastError && (
          <div
            role="alert"
            className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {lastError}
          </div>
        )}
      </main>
    </div>
  );
}

function MicIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`text-white ${className}`}
      aria-hidden
    >
      <path d="M12 13a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13a5 5 0 1 0 10 0M12 21v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400" aria-hidden>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
