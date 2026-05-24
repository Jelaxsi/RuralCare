"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { MedicalCrossIcon } from "@/components/PriorityBadge";
import { MicSoundWave } from "@/components/SoundWaveVisualizer";
import { SystemStatus } from "@/components/SystemStatus";
import { TriageResults } from "@/components/TriageResults";
import { hasHospitalName, hospitalConfig } from "@/lib/hospital/config";
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
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
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
    <div className="min-h-screen bg-deep mesh-bg">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-cyan shadow-[0_0_20px_rgba(108,99,255,0.4)]">
              <MedicalCrossIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold leading-tight text-white">RuralCare</p>
              <p className="text-[11px] text-white/40">{t.brandSubtitle}</p>
              {hasHospitalName && (
                <p className="text-[10px] text-white/30">{hospitalConfig.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector value={language} onChange={setLanguage} />
            <SystemStatus translationLang={languageOption.translationKey} />
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/[0.04] hover:text-white md:inline-flex"
            >
              {t.dashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {!result && !analyzing && (
          <>
            <section className="hero-glow relative mb-10 overflow-hidden rounded-3xl px-4 py-10 text-center md:py-14">
              <h1 className="text-[32px] font-extrabold leading-tight tracking-tight md:text-5xl">
                <span className="gradient-heading">{t.title}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/50">{t.subtitle}</p>
            </section>

            <section className="glass-card mb-8 p-6" aria-labelledby="intake-heading">
              <h2 id="intake-heading" className="section-label">
                {t.patientDetails}
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5 font-mono text-sm text-primary">
                    <IdIcon />
                    {t.patientIdLabel}: {patientId}
                  </div>
                </div>

                <Field label={t.patientNameLabel} icon={<PersonIcon />}>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="glass-input-icon"
                  />
                </Field>

                <Field label={t.ageLabel} icon={<CalendarIcon />}>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t.agePlaceholder}
                    className="glass-input-icon"
                  />
                </Field>

                <Field label={t.genderLabel} icon={<PersonIcon />}>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="glass-input-icon"
                  >
                    <option value="">{t.genderPreferNot}</option>
                    <option value="male">{t.genderMale}</option>
                    <option value="female">{t.genderFemale}</option>
                  </select>
                </Field>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-white/60">{t.locationLabel}</span>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-white/35">
                        <PinIcon />
                      </span>
                      <input
                        type="text"
                        value={patientLocation}
                        onChange={(e) => setPatientLocation(e.target.value)}
                        placeholder={t.locationPlaceholder}
                        className="glass-input-icon w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void detectLocation()}
                      disabled={locating}
                      className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white transition hover:border-violet-500/50 disabled:opacity-50"
                    >
                      {locating ? t.locationDetecting : t.detectLocation}
                    </button>
                  </div>
                </div>

                <Field label={t.chiefComplaintLabel} icon={<NoteIcon />} className="md:col-span-2">
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder={t.chiefComplaintPlaceholder}
                    className="glass-input-icon"
                  />
                </Field>
              </div>
            </section>

            <section className="mb-8 flex flex-col items-center py-4">
              {!recording && (
                <div className="relative flex flex-col items-center">
                  <span className="mic-idle-ring-2 pointer-events-none" />
                  <span className="mic-idle-ring-1 pointer-events-none" />
                  <button
                    type="button"
                    onClick={startRecording}
                    aria-label={t.startBtn}
                    className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#8B83FF,#4338CA)] text-white shadow-[0_0_40px_rgba(108,99,255,0.35)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                  >
                    <MicIcon />
                  </button>
                  <p className="mt-5 text-sm text-white/60">{t.startBtn}</p>
                </div>
              )}

              {recording && (
                <div className="flex flex-col items-center">
                  <div className="relative flex h-[100px] w-[100px] items-center justify-center">
                    <span className="mic-recording-ring inset-0 [animation-delay:0ms]" />
                    <span className="mic-recording-ring inset-[-14px] [animation-delay:300ms]" />
                    <span className="mic-recording-ring inset-[-28px] [animation-delay:600ms]" />
                    <div className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gradient-to-br from-[#FF4560] to-[#FF6B35] text-white shadow-[0_0_60px_rgba(255,69,96,0.4)]">
                      <MicIcon />
                    </div>
                  </div>
                  <MicSoundWave active />
                  <p className="mt-4 animate-pulse text-base font-semibold text-white">{t.listening}</p>
                  <button
                    type="button"
                    onClick={() => void stopAndAnalyze()}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-black shadow-lg transition hover:bg-white/90"
                  >
                    {t.stopBtn}
                    <ArrowRightIcon />
                  </button>
                </div>
              )}

              {!recording && transcriptFull && (
                <button
                  type="button"
                  onClick={() => void stopAndAnalyze()}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-black shadow-lg transition hover:bg-white/90"
                >
                  {t.stopBtn}
                  <ArrowRightIcon />
                </button>
              )}
            </section>

            <section className="glass-card mb-6 p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <MicIconSmall />
                {t.transcriptTitle}
              </h2>
              <div
                className="mt-4 min-h-[120px] rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-base leading-relaxed"
                aria-live="polite"
              >
                {!hasSpeech && !manualSymptoms && (
                  <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-white/30">
                    <MicIconSmall />
                    <span>{t.transcriptWaiting}</span>
                  </div>
                )}
                {hasSpeech && (
                  <p>
                    {finalTranscript && (
                      <span className="font-semibold text-white">{finalTranscript}</span>
                    )}
                    {interimTranscript && (
                      <span className="italic text-white/40">
                        {finalTranscript ? " " : ""}
                        {interimTranscript}
                      </span>
                    )}
                  </p>
                )}
                {!hasSpeech && manualSymptoms && (
                  <p className="font-semibold text-white">{manualSymptoms}</p>
                )}
              </div>
            </section>

            <section className="glass-card p-6">
              <textarea
                value={manualSymptoms}
                onChange={(e) => setManualSymptoms(e.target.value)}
                rows={3}
                placeholder={t.manualPlaceholder}
                className="glass-input resize-y"
              />
            </section>
          </>
        )}

        {analyzing && (
          <section className="flex flex-col items-center py-20" aria-live="polite">
            <div className="relative flex h-[100px] w-[100px] items-center justify-center">
              <span className="absolute inset-0 animate-spin-slow rounded-full bg-gradient-to-r from-primary via-accent-cyan to-primary p-[3px]">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#050A14]" />
              </span>
              <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/20">
                <SparkleIcon />
              </div>
            </div>
            <p className="mt-8 text-lg font-semibold text-white">{t.analyzing}</p>
            <div className="mt-8 w-full max-w-2xl space-y-4">
              <div className="skeleton h-32 w-full rounded-2xl" />
              <div className="skeleton h-24 w-full rounded-2xl" />
              <div className="skeleton h-40 w-full rounded-2xl" />
            </div>
          </section>
        )}

        {result && !analyzing && (
          <>
            <TriageResults
              result={result}
              t={t}
              patientId={patientId}
              location={patientLocation}
              lat={coords?.lat ?? null}
              lng={coords?.lng ?? null}
              languageOption={languageOption}
              timestamp={resultTimestamp}
            />
            <div className="no-print mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => void saveCase()}
                disabled={saveState !== "idle"}
                className="btn-primary-glow"
              >
                {saveState === "saved" ? t.caseSaved : saveState === "saving" ? t.saving : t.saveCase}
              </button>
              <button
                type="button"
                onClick={newTriage}
                className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white transition hover:border-primary/50 hover:bg-white/[0.04]"
              >
                {t.newTriage}
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/10 px-6 py-3 text-center font-semibold text-white transition hover:border-primary/50 hover:bg-white/[0.04]"
              >
                {t.openDashboard}
              </Link>
            </div>
          </>
        )}

        {lastError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-5 py-4 text-danger"
          >
            {lastError}
          </div>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
  className = "",
}: {
  label: string;
  icon: React.ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-medium text-white/60">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-white/35">
          {icon}
        </span>
        {children}
      </div>
    </label>
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

function MicIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="text-primary">
      <path d="M12 13a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13a5 5 0 1 0 10 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" aria-hidden>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v6h6M8 13h8M8 17h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M15 10h4M15 14h4" strokeLinecap="round" />
    </svg>
  );
}
