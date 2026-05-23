"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const [recordSeconds, setRecordSeconds] = useState(0);
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
  const recordTimerRef = useRef<number | null>(null);

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
    setRecordSeconds(0);
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
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}`,
          );
          const data = (await res.json()) as { results?: Array<{ formatted_address?: string }> };
          const addr = data.results?.[0]?.formatted_address;
          if (addr) setPatientLocation(addr);
          else setPatientLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setPatientLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
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
    setRecording(true);
    setLastError(null);
    setRecordSeconds(0);
    recordTimerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);

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
        if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Could not start microphone");
      setRecording(false);
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
    }
  }, [languageOption.speechCode, resetSession]);

  const stopAndAnalyze = useCallback(async () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);

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
  }, [age, chiefComplaint, gender, language, patientId, patientLocation, patientName, transcriptFull]);

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
    setChiefComplaint("");
    setLanguage("english");
    setCoords(null);
  }, [resetSession]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-deep mesh-bg">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent-cyan shadow-[0_0_24px_rgba(108,99,255,0.5)]">
              <MedicalCrossIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">RuralCare</p>
              <p className="text-sm text-white/50">{t.brandSubtitle}</p>
              {hasHospitalName && (
                <p className="text-xs text-white/40">{hospitalConfig.name}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSelector value={language} onChange={setLanguage} />
            <SystemStatus translationLang={languageOption.translationKey} />
            <Link
              href="/dashboard"
              className="btn-glow hidden rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/20 md:inline-flex"
            >
              {t.dashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {!result && !analyzing && (
          <>
            <section className="mb-10 animate-fade-in text-center md:text-left">
              <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                <span className="gradient-heading">{t.title}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60 md:mx-0">{t.subtitle}</p>
            </section>

            <section className="glass-card mb-8 p-6 md:p-8" aria-labelledby="intake-heading">
              <h2 id="intake-heading" className="text-xl font-bold text-white">
                {t.patientDetails}
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-sm text-primary">
                    {t.patientIdLabel}: {patientId}
                  </span>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white/70">{t.patientNameLabel}</span>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="glass-input"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white/70">{t.ageLabel}</span>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t.agePlaceholder}
                    className="glass-input"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white/70">{t.genderLabel}</span>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="glass-input">
                    <option value="">{t.genderPreferNot}</option>
                    <option value="male">{t.genderMale}</option>
                    <option value="female">{t.genderFemale}</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-white/70">{t.locationLabel}</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={patientLocation}
                      onChange={(e) => setPatientLocation(e.target.value)}
                      placeholder={t.locationPlaceholder}
                      className="glass-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => void detectLocation()}
                      disabled={locating}
                      className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white hover:border-primary disabled:opacity-50"
                    >
                      {locating ? t.locationDetecting : t.detectLocation}
                    </button>
                  </div>
                  {coords && (
                    <p className="text-xs text-white/40">
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </p>
                  )}
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-white/70">{t.chiefComplaintLabel}</span>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder={t.chiefComplaintPlaceholder}
                    className="glass-input"
                  />
                </label>
              </div>
            </section>

            <section className="mb-8 flex flex-col items-center py-6">
              <div className="relative flex flex-col items-center">
                {!recording && !analyzing && (
                  <>
                    <span className="pointer-events-none absolute -inset-6 rounded-full bg-primary/20 blur-2xl" />
                    <button
                      type="button"
                      onClick={startRecording}
                      aria-label={t.startBtn}
                      className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-cyan text-white shadow-[0_0_40px_rgba(108,99,255,0.5)] ring-8 ring-primary/20 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
                    >
                      <MicIcon />
                    </button>
                    <p className="mt-6 text-base font-medium text-white/70">{t.startBtn}</p>
                  </>
                )}

                {recording && (
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <span className="mic-ring inset-0" />
                      <span className="mic-ring inset-[-12px] [animation-delay:0.3s]" />
                      <span className="mic-ring inset-[-24px] [animation-delay:0.6s]" />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-danger text-white shadow-[0_0_40px_rgba(255,69,96,0.5)]">
                        <MicIcon />
                      </div>
                    </div>
                    <MicSoundWave active />
                    <p className="mt-4 text-base font-semibold text-white">{t.listening}</p>
                    <p className="mt-1 font-mono text-sm text-white/50">{formatDuration(recordSeconds)}</p>
                  </div>
                )}
              </div>

              {recording && (
                <button type="button" onClick={() => void stopAndAnalyze()} className="btn-primary-glow mt-10">
                  {t.stopBtn}
                </button>
              )}

              {!recording && transcriptFull && !analyzing && (
                <button type="button" onClick={() => void stopAndAnalyze()} className="btn-primary-glow mt-10">
                  {t.stopBtn}
                </button>
              )}
            </section>

            <section className="glass-card mb-8 p-6">
              <h2 className="text-lg font-semibold text-white">{t.transcriptTitle}</h2>
              <div
                className="mt-4 max-h-40 min-h-[100px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-4 text-base leading-relaxed"
                aria-live="polite"
              >
                {words.length === 0 && !manualSymptoms && (
                  <span className="text-white/40">{t.transcriptWaiting}</span>
                )}
                {words.map((w, i) => (
                  <span key={`${w.text}-${i}`} className={w.final && w.confidence >= 0.7 ? "text-white" : "text-white/40"}>
                    {w.text}{" "}
                  </span>
                ))}
              </div>
            </section>

            <section className="glass-card p-6">
              <textarea
                value={manualSymptoms}
                onChange={(e) => setManualSymptoms(e.target.value)}
                rows={4}
                placeholder={t.manualPlaceholder}
                className="glass-input resize-y"
              />
            </section>
          </>
        )}

        {analyzing && (
          <section className="flex flex-col items-center py-16" aria-live="polite">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <span className="absolute inset-0 animate-spin-slow rounded-full border-4 border-transparent border-t-primary border-r-accent-cyan" />
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                <MedicalCrossIcon className="h-10 w-10 text-primary" />
              </div>
            </div>
            <p className="mt-8 text-lg font-semibold text-white">
              {slowAnalysis ? t.analyzingSlow : t.analyzing}
            </p>
            <div className="mt-6 w-full max-w-md space-y-3">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-24 w-full" />
            </div>
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
              languageLabel={getLanguageLabel(language)}
              timestamp={resultTimestamp}
              lat={coords?.lat ?? null}
              lng={coords?.lng ?? null}
            />
            <div className="mt-8 flex flex-col gap-4 sm:flex-row no-print">
              <button type="button" onClick={() => void saveCase()} disabled={saveState !== "idle"} className="btn-primary-glow">
                {saveState === "saved" ? t.caseSaved : saveState === "saving" ? t.saving : t.saveCase}
              </button>
              <button type="button" onClick={newTriage} className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:border-primary">
                {t.newTriage}
              </button>
              <Link href="/dashboard" className="rounded-xl border border-white/10 px-6 py-3 text-center font-semibold text-white hover:border-primary">
                {t.openDashboard}
              </Link>
            </div>
          </>
        )}

        {lastError && (
          <div role="alert" className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-5 py-4 text-danger">
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
