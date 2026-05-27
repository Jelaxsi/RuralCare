"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { LanguageSelector } from "@/components/LanguageSelector";
import { MicSoundWave } from "@/components/SoundWaveVisualizer";
import { SystemStatus } from "@/components/SystemStatus";
import { TriageResults } from "@/components/TriageResults";
import {
  getLanguageOption,
  type LanguageCode,
} from "@/lib/i18n/languages";
import {
  GROQ_LANGUAGE_LABELS,
  getSpeechCode,
} from "@/lib/i18n/speech-lang";
import { getTranslations } from "@/lib/i18n/translations";
import { emptyStreamingResult } from "@/lib/triage/stream-parse";
import { streamTriageAnalysis } from "@/lib/triage/stream-client";
import { playSpokenSummary, speechRateForPriority, buildSpokenSummary } from "@/lib/tts/speech";
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [manualSymptoms, setManualSymptoms] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [highlightManualInput, setHighlightManualInput] = useState(false);
  const [sttBackend, setSttBackend] = useState<"valsea" | "webspeech" | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [streamPreview, setStreamPreview] = useState<TriageResult | null>(null);
  const [earlyTtsPlayed, setEarlyTtsPlayed] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [resultTimestamp, setResultTimestamp] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [retryAnalyze, setRetryAnalyze] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sttBackendRef = useRef<"valsea" | "webspeech" | null>(null);
  const isRecordingRef = useRef(false);
  const audioStreamingRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const langSwapRef = useRef(false);
  const prevLanguageRef = useRef(language);
  const streamPriorityRef = useRef<TriageResult["priority"]>("P3");

  // ─── KEY FIX: store valseaLanguage (full word) not translationKey ───────────
  // valseaLanguage is "tamil", "sinhala", "hindi" etc. — exactly what Valsea needs.
  // translationKey was "tamil", "sinhala" etc. too, but valseaLanguage is the
  // authoritative field from languages.ts and handles edge cases (e.g. urdu → english).
  const valseaLanguageRef = useRef(languageOption.valseaLanguage);

  useEffect(() => {
    valseaLanguageRef.current = getLanguageOption(language).valseaLanguage;
    console.log(
      "[Lang] Language changed:",
      language,
      "→ Valsea language:",
      valseaLanguageRef.current,
    );
  }, [language]);

  useEffect(() => {
    isRecordingRef.current = recording;
  }, [recording]);

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
    setStreamPreview(null);
    setStreaming(false);
    setEarlyTtsPlayed(false);
    setResultTimestamp("");
    setSaveState("idle");
    setLastError(null);
  }, []);

  const stopValsea = useCallback(() => {
    isRecordingRef.current = false;
    audioStreamingRef.current = false;
    setRecording(false);
    setInterimTranscript("");

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        /* noop */
      }
      processorRef.current = null;
    }

    try {
      sourceRef.current?.disconnect();
    } catch {
      /* noop */
    }
    sourceRef.current = null;

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: "session.stop" }));
        } catch (e) {
          console.warn("[Valsea] Could not send session.stop:", e);
        }
        wsRef.current.close(1000, "User stopped recording");
      }
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    intentionalStopRef.current = true;
    stopValsea();

    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }

    sttBackendRef.current = null;
    setSttBackend(null);
  }, [stopValsea]);

  const bindRecognitionHandlers = useCallback(
    (recognition: SpeechRecognitionInstance) => {
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
        console.log("Speech error:", event.error);
        if (event.error === "language-not-supported") {
          setHighlightManualInput(true);
          setMicError(t.voiceNotSupported);
          stopRecognition();
        } else if (event.error === "no-speech") {
          if (isRecordingRef.current && !langSwapRef.current) {
            try {
              recognition.start();
            } catch {
              /* already running */
            }
          }
        } else if (event.error === "not-allowed") {
          setMicError(t.micAccessDenied);
          stopRecognition();
        } else if (event.error === "aborted") {
          /* ignore */
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current && !intentionalStopRef.current && !langSwapRef.current) {
          try {
            recognition.start();
          } catch {
            /* noop */
          }
        }
      };
    },
    [stopRecognition, t.micAccessDenied, t.voiceNotSupported],
  );

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

  const startValsea = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      audioContextRef.current = audioContext;
      streamRef.current = stream;
      sourceRef.current = source;
      processorRef.current = processor;

      const apiKey = process.env.NEXT_PUBLIC_VALSEA_API_KEY?.trim();
      if (!apiKey) {
        throw new Error("Missing NEXT_PUBLIC_VALSEA_API_KEY");
      }

      // Single WebSocket — API key in query param (browsers cannot set WS headers)
      const ws = new WebSocket(`wss://api.valsea.ai/v1/realtime?api_key=${apiKey}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Valsea] WebSocket connected");
        // Do NOT send session.start here — wait for session.created event
      };

      ws.onmessage = (event) => {
        let msg: { type?: string; text?: string; message?: string };
        try {
          msg = JSON.parse(String(event.data)) as {
            type?: string;
            text?: string;
            message?: string;
          };
        } catch {
          console.error("[Valsea] Failed to parse message:", event.data);
          return;
        }

        console.log("[Valsea] Event:", msg.type, msg);

        switch (msg.type) {
          case "session.created": {
            // ─── THE FIX: read valseaLanguage from ref (never stale) ──────────
            // valseaLanguage is the exact full-word string Valsea STT expects:
            //   "tamil", "sinhala", "hindi", "malayalam", etc.
            // It is set in languages.ts on each LanguageOption and kept in sync
            // via valseaLanguageRef whenever the user changes language.
            const valseaLang = valseaLanguageRef.current;
            console.log("[Valsea] Sending session.start with language:", valseaLang);

            ws.send(
              JSON.stringify({
                type: "session.start",
                model: "valsea-rtt",
                language: valseaLang,
                enable_correction: true,
                hint_text: "medical symptoms emergency health pain fever doctor hospital",
              }),
            );
            break;
          }

          case "session.ready": {
            console.log("[Valsea] Session ready — starting audio stream");
            isRecordingRef.current = true;
            audioStreamingRef.current = true;
            setRecording(true);

            source.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (e: AudioProcessingEvent) => {
              if (!isRecordingRef.current || !audioStreamingRef.current) return;
              if (ws.readyState !== WebSocket.OPEN) return;

              const float32 = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(float32.length);
              for (let i = 0; i < float32.length; i++) {
                const clamped = Math.max(-1, Math.min(1, float32[i]));
                int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
              }

              const uint8 = new Uint8Array(int16.buffer);
              let binary = "";
              for (let i = 0; i < uint8.length; i++) {
                binary += String.fromCharCode(uint8[i]);
              }
              const base64Audio = btoa(binary);

              ws.send(
                JSON.stringify({
                  type: "audio.append",
                  audio: base64Audio,
                }),
              );
            };
            break;
          }

          case "transcript.partial": {
            setInterimTranscript(msg.text ?? "");
            break;
          }

          case "transcript.final": {
            const finalText = msg.text ?? "";
            if (finalText.trim()) {
              setFinalTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText));
            }
            setInterimTranscript("");
            break;
          }

          case "speech.started": {
            setIsSpeaking(true);
            break;
          }

          case "speech.stopped": {
            setIsSpeaking(false);
            break;
          }

          case "error": {
            console.error("[Valsea] Error event:", msg);
            setMicError(`Voice recognition error: ${msg.message ?? "Unknown error"}`);
            stopValsea();
            break;
          }

          default: {
            console.log("[Valsea] Unhandled event type:", msg.type);
          }
        }
      };

      ws.onerror = (error) => {
        console.error("[Valsea] WebSocket error:", error);
        setMicError("Connection failed. Check your internet and try again.");
        stopValsea();
      };

      ws.onclose = (event) => {
        console.log("[Valsea] Closed — code:", event.code, "reason:", event.reason);
        isRecordingRef.current = false;
        audioStreamingRef.current = false;
        setRecording(false);

        if (event.code === 1008 || event.code === 4001 || event.code === 4003) {
          setMicError("Authentication failed. Please check API key.");
        } else if (!intentionalStopRef.current && sttBackendRef.current === "valsea") {
          setMicError("Voice connection closed. Type symptoms manually or try again.");
          setHighlightManualInput(true);
        }
      };
    } catch (err: unknown) {
      console.error("[Valsea] Setup error:", err);
      stopValsea();

      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setMicError("Microphone access denied. Please allow microphone in browser settings.");
          return;
        }
        if (err.name === "NotFoundError") {
          setMicError("No microphone found. Please connect a microphone.");
          return;
        }
      }

      setMicError("Could not start voice recording. Please try again.");
      throw err;
    }
  }, [stopValsea]);

  const startWebSpeech = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setMicError("Web Speech API is not available. Please use Chrome or type symptoms manually.");
      setHighlightManualInput(true);
      isRecordingRef.current = false;
      setRecording(false);
      return;
    }

    sttBackendRef.current = "webspeech";
    setSttBackend("webspeech");

    try {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getSpeechCode(language);

      bindRecognitionHandlers(recognition);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      isRecordingRef.current = false;
      setRecording(false);
      sttBackendRef.current = null;
      setSttBackend(null);
      setMicError(e instanceof Error ? e.message : "Could not start microphone");
      setHighlightManualInput(true);
    }
  }, [bindRecognitionHandlers, language]);

  const startRecording = useCallback(async () => {
    resetSession();
    setLastError(null);
    setMicError(null);
    setHighlightManualInput(false);
    setFinalTranscript("");
    setInterimTranscript("");

    intentionalStopRef.current = false;
    prevLanguageRef.current = language;

    const apiKey = process.env.NEXT_PUBLIC_VALSEA_API_KEY?.trim();
    if (apiKey) {
      sttBackendRef.current = "valsea";
      setSttBackend("valsea");
      try {
        await startValsea();
        return;
      } catch (err) {
        console.error("Valsea STT failed, falling back to Web Speech:", err);
        sttBackendRef.current = null;
        setSttBackend(null);
      }
    }

    isRecordingRef.current = true;
    setRecording(true);
    startWebSpeech();
  }, [language, resetSession, startValsea, startWebSpeech]);

  // Handle live language switching while recording
  useEffect(() => {
    if (!recording) {
      prevLanguageRef.current = language;
      return;
    }
    if (prevLanguageRef.current === language) return;

    prevLanguageRef.current = language;

    if (sttBackendRef.current === "valsea" && wsRef.current?.readyState === WebSocket.OPEN) {
      // Send new session.start with updated language
      audioStreamingRef.current = false;
      const newValseaLang = getLanguageOption(language).valseaLanguage;
      console.log("[Valsea] Live language switch — sending session.start, language:", newValseaLang);
      wsRef.current.send(
        JSON.stringify({
          type: "session.start",
          model: "valsea-rtt",
          language: newValseaLang,
          enable_correction: true,
          hint_text: "medical symptoms emergency health pain fever doctor hospital",
        }),
      );
      return;
    }

    if (sttBackendRef.current !== "webspeech" || !recognitionRef.current) return;

    const recognition = recognitionRef.current;
    langSwapRef.current = true;

    try {
      recognition.stop();
    } catch {
      /* noop */
    }

    const timer = window.setTimeout(() => {
      if (!isRecordingRef.current || !recognitionRef.current) {
        langSwapRef.current = false;
        return;
      }
      recognitionRef.current.lang = getSpeechCode(language);
      langSwapRef.current = false;
      try {
        recognitionRef.current.start();
      } catch {
        /* noop */
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [language, recording]);

  const stopAndAnalyze = useCallback(async () => {
    stopRecognition();

    const transcriptBody = `${finalTranscript} ${interimTranscript}`.trim() || manualSymptoms.trim();
    if (!transcriptBody) {
      setLastError("Please speak or type symptoms before analysis.");
      return;
    }

    setLastError(null);
    setStreaming(true);
    setResult(null);
    setStreamPreview(emptyStreamingResult());
    setEarlyTtsPlayed(false);
    setResultTimestamp(new Date().toISOString());
    streamPriorityRef.current = "P3";

    const groqLanguage = languageOption.valseaLanguage;
    const speechCode = getSpeechCode(language);
    let ttsStarted = false;

    const triagePayload = {
      name: patientName,
      age,
      gender,
      location: patientLocation,
      chiefComplaint,
      patientId: patientId || undefined,
      language: groqLanguage,
      transcript: transcriptBody,
    };

    const finishWithResult = (finalResult: TriageResult) => {
      setResult(finalResult);
      setStreamPreview(null);
      setStreaming(false);
    };

    const fallbackTriage = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ ...triagePayload, persist: false }),
        });
        const data = (await res.json()) as TriageResult & { error?: string };
        if (!res.ok) return false;
        finishWithResult(data);
        if (!ttsStarted) {
          ttsStarted = true;
          setEarlyTtsPlayed(true);
          void playSpokenSummary({
            text: buildSpokenSummary(data),
            speechCode,
            speed: speechRateForPriority(data.priority),
          });
        }
        return true;
      } catch {
        return false;
      }
    };

    await streamTriageAnalysis(
      triagePayload,
      {
        onDelta: (_buffer, partial) => {
          streamPriorityRef.current = partial.priority;
          setStreamPreview(partial);
        },
        onFirstSentence: (sentence) => {
          ttsStarted = true;
          setEarlyTtsPlayed(true);
          void playSpokenSummary({
            text: sentence.trim().substring(0, 150) || "Assessment complete.",
            speechCode,
            speed: speechRateForPriority(streamPriorityRef.current),
          });
        },
        onDone: (finalResult) => {
          finishWithResult(finalResult);
        },
        onError: () => {
          void fallbackTriage().then((ok) => {
            if (!ok) {
              setLastError(t.errorGeneric);
              setStreamPreview(null);
              setStreaming(false);
            }
          });
        },
      },
    );
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
    languageOption.valseaLanguage,
    t.errorGeneric,
  ]);

  useEffect(() => {
    if (!retryAnalyze || !transcriptFull.trim()) return;
    setRetryAnalyze(false);
    void stopAndAnalyze();
  }, [retryAnalyze, transcriptFull, stopAndAnalyze]);

  const saveCase = useCallback(async () => {
    if (!result) return;
    setSaveState("saving");

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          name: patientName,
          age,
          gender,
          location: patientLocation,
          chiefComplaint,
          patientId: patientId || undefined,
          language: getLanguageOption(language).valseaLanguage,
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
    setMicError(null);
    setHighlightManualInput(false);
    setLastError(null);
    setPatientId(createClientPatientId());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resetSession, stopRecognition]);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      stopValsea();
      try {
        recognitionRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, [stopValsea]);

  const hasSpeech = Boolean(finalTranscript || interimTranscript);
  const displayResult = result ?? streamPreview;
  const showResults = Boolean(displayResult);

  return (
    <div className="min-h-screen bg-deep page-fade-in">
      <AppHeader
        subtitle={t.brandSubtitle}
        dashboardLabel={t.dashboard}
        right={
          <>
            <LanguageSelector value={language} onChange={setLanguage} />
            <SystemStatus translationLang={languageOption.translationKey} />
          </>
        }
      />

      {streaming && (
        <LoadingOverlay
          messages={[t.loadingAnalyzing, t.loadingPriority, t.loadingResults]}
          waitHint={t.loadingWaitTime}
        />
      )}

      <main className="mx-auto max-w-3xl pb-10">
        {!showResults && (
          <>
            <section className="hero-section">
              <h1 className="hero-title">{t.title}</h1>
              <p className="mx-auto max-w-md text-base text-white/50">{t.subtitle}</p>
            </section>

            <div className="mx-4 mb-6">
              <DisclaimerBanner text={t.disclaimerLanding} />
            </div>
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
                    onClick={() => void startRecording()}
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
                    {isSpeaking && (
                      <span className="mic-speaking-ring h-[100px] w-[100px]" />
                    )}
                    <span className="mic-ring-rec h-[110px] w-[110px]" style={{ animationDelay: "0s" }} />
                    <span className="mic-ring-rec h-[130px] w-[130px]" style={{ animationDelay: "0.4s" }} />
                    <span className="mic-ring-rec h-[150px] w-[150px]" style={{ animationDelay: "0.8s" }} />
                    <div className={`mic-btn-recording ${isSpeaking ? "mic-speaking-active" : ""}`}>
                      <MicIcon size={32} />
                    </div>
                  </div>
                  <MicSoundWave active />
                  <p className="mt-3 animate-pulse text-sm font-medium text-white/70">{t.listening}</p>
                  <button
                    type="button"
                    onClick={() => void stopAndAnalyze()}
                    disabled={streaming}
                    className="btn-touch mt-4 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition hover:bg-white/90 disabled:opacity-50"
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
                  disabled={streaming}
                  className="btn-touch inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition hover:bg-white/90 disabled:opacity-50"
                >
                  <StopIcon />
                  {t.stopBtn}
                </button>
              )}
              {micError && (
                <p role="alert" className="max-w-sm text-center text-xs text-amber-300/90">
                  {micError}
                </p>
              )}
            </section>

            {/* Live transcript */}
            <section className="transcript-card mb-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MicIcon size={16} className="text-violet-400" />
                  <span className="text-sm font-medium text-white/70">{t.transcriptTitle}</span>
                </div>
                <span className="text-xs text-white/30">
                  {recording
                    ? `${t.listeningIn} ${GROQ_LANGUAGE_LABELS[languageOption.translationKey]}${sttBackend === "valsea" ? " · Valsea" : ""}`
                    : languageOption.label}
                </span>
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

            {/* Manual input — always visible */}
            <section className="mx-4 mb-4">
              <p className="mb-1.5 text-xs text-white/30">{t.manualInputHint}</p>
              <textarea
                value={manualSymptoms}
                onChange={(e) => setManualSymptoms(e.target.value)}
                placeholder={t.manualPlaceholder}
                className={`form-input h-20 resize-none rounded-2xl ${
                  highlightManualInput ? "ring-2 ring-violet-500/40" : ""
                }`}
              />
            </section>
          </>
        )}

        {showResults && displayResult && (
          <>
            <div className="pt-[calc(64px+16px)]">
              <TriageResults
                result={displayResult}
                t={t}
                patientId={patientId || "--------"}
                patientName={patientName}
                age={age}
                transcript={transcriptFull}
                location={patientLocation}
                lat={coords?.lat ?? null}
                lng={coords?.lng ?? null}
                languageOption={languageOption}
                timestamp={resultTimestamp}
                onNewAssessment={newTriage}
                isStreaming={streaming}
                suppressAutoSpeak={earlyTtsPlayed}
              />
            </div>
            {result && !streaming && (
            <div className="no-print mx-4 mt-4 flex flex-col gap-3 pb-4 sm:flex-row">
              <button
                type="button"
                onClick={() => void saveCase()}
                disabled={saveState !== "idle"}
                className="btn-touch flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {saveState === "saved" ? t.caseSaved : saveState === "saving" ? t.saving : t.saveCase}
              </button>
            </div>
            )}
          </>
        )}

        {lastError && !streaming && !showResults && (
          <ErrorCard
            message={lastError}
            tryAgainLabel={t.tryAgain}
            onRetry={() => {
              setLastError(null);
              setRetryAnalyze(true);
            }}
          />
        )}
      </main>

      <AppFooter text={t.footerText} />
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
