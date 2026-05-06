"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Priority = "P1" | "P2" | "P3";
type LanguageCode = "english" | "sinhala" | "tamil";

const LANG_OPTIONS = [
  { label: "English", code: "english" as const },
  { label: "Tamil", code: "tamil" as const },
  { label: "Sinhala", code: "sinhala" as const },
];

const translations: Record<
  LanguageCode,
  {
    title: string;
    subtitle: string;
    namePlaceholder: string;
    locationPlaceholder: string;
    startBtn: string;
    stopBtn: string;
    listening: string;
    transcriptTitle: string;
    transcriptWaiting: string;
    manualPlaceholder: string;
    saveCase: string;
    newTriage: string;
    firstAidTitle: string;
    facilityTitle: string;
    getDirections: string;
    priorityCritical: string;
    priorityUrgent: string;
    priorityNonUrgent: string;
    dashboard: string;
    openDashboard: string;
    systemLive: string;
    patientDetails: string;
    captureContext: string;
    patientNameLabel: string;
    locationLabel: string;
    preferredLanguage: string;
    startingSpeech: string;
    transcriptPreview: string;
    speechApiLabel: string;
    micFooter: string;
    assignedPriority: string;
    aiTriageTag: string;
  }
> = {
  english: {
    title: "Emergency Health Triage",
    subtitle: "Speak clearly. We'll handle the rest.",
    namePlaceholder: "Patient Name",
    locationPlaceholder: "Location / Village",
    startBtn: "Start Triage",
    stopBtn: "Stop & Score",
    listening: "Listening...",
    transcriptTitle: "Live Transcript",
    transcriptWaiting: "Waiting for microphone input. Tap the mic to begin.",
    manualPlaceholder: "Or type symptoms here manually...",
    saveCase: "Save Case",
    newTriage: "New Triage",
    firstAidTitle: "What to do right now",
    facilityTitle: "Nearest Medical Facility",
    getDirections: "Get Directions",
    priorityCritical: "CRITICAL",
    priorityUrgent: "URGENT",
    priorityNonUrgent: "NON-URGENT",
    dashboard: "Dashboard",
    openDashboard: "Open Dashboard",
    systemLive: "System Live",
    patientDetails: "Patient details",
    captureContext: "Capture context before intake.",
    patientNameLabel: "Patient name",
    locationLabel: "Location / village",
    preferredLanguage: "Preferred language (STT)",
    startingSpeech: "Starting speech recognition...",
    transcriptPreview: "Preview updates instantly as audio streams.",
    speechApiLabel: "Web Speech API • Chrome",
    micFooter: "Mic uses browser Web Speech API (Chrome) with manual symptom fallback.",
    assignedPriority: "Assigned priority",
    aiTriageTag: "AI triage tag:",
  },
  sinhala: {
    title: "හදිසි සෞඛ්‍ය ත්‍රාසනය",
    subtitle: "පැහැදිලිව කතා කරන්න. අපි ඉතිරිය බලාගන්නෙමු.",
    namePlaceholder: "රෝගියාගේ නම",
    locationPlaceholder: "ස්ථානය / ගම",
    startBtn: "ත්‍රාසනය ආරම්භ කරන්න",
    stopBtn: "නවතා ලකුණු කරන්න",
    listening: "සවන් දෙමින්...",
    transcriptTitle: "සජීවී පිටපත",
    transcriptWaiting: "මයික්‍රොෆෝනය සඳහා රැඳී සිටින්න. ආරම්භ කිරීමට mic එක තට්ටු කරන්න.",
    manualPlaceholder: "හෝ රෝග ලක්ෂණ මෙහි ටයිප් කරන්න...",
    saveCase: "නඩුව සුරකින්න",
    newTriage: "නව ත්‍රාසනය",
    firstAidTitle: "දැන් කළ යුතු දේ",
    facilityTitle: "ළඟම වෛද්‍ය පහසුකම",
    getDirections: "මාර්ගෝපදේශ ලබාගන්න",
    priorityCritical: "අවදානම්",
    priorityUrgent: "හදිසි",
    priorityNonUrgent: "අවදානම් නොවේ",
    dashboard: "පුවරුව",
    openDashboard: "පුවරුව විවෘත කරන්න",
    systemLive: "පද්ධතිය සජීවීයි",
    patientDetails: "රෝගියාගේ විස්තර",
    captureContext: "ඇතුළත් කිරීමට පෙර පසුබිම සකස් කරන්න.",
    patientNameLabel: "රෝගියාගේ නම",
    locationLabel: "ස්ථානය / ගම",
    preferredLanguage: "කැමති භාෂාව (STT)",
    startingSpeech: "හඬ හඳුනාගැනීම ආරම්භ වේ...",
    transcriptPreview: "ශ්‍රව්‍යය වාර්තා වන විට සජීවී යාවත්කාලීන දැකිය හැක.",
    speechApiLabel: "වෙබ් කථන API • ක්‍රෝම්",
    micFooter: "මයික් සඳහා browser Web Speech API (Chrome) සහ manual fallback භාවිතා වේ.",
    assignedPriority: "නියම කළ ප්‍රමුඛතාව",
    aiTriageTag: "AI ත්‍රාසන ලේබලය:",
  },
  tamil: {
    title: "அவசர சுகாதார சோதனை",
    subtitle: "தெளிவாக பேசுங்கள். மீதியை நாங்கள் பார்த்துக்கொள்கிறோம்.",
    namePlaceholder: "நோயாளியின் பெயர்",
    locationPlaceholder: "இடம் / கிராமம்",
    startBtn: "சோதனை தொடங்கு",
    stopBtn: "நிறுத்தி மதிப்பிடு",
    listening: "கேட்கிறோம்...",
    transcriptTitle: "நேரடி படியெடுப்பு",
    transcriptWaiting: "மைக்ரோஃபோன் உள்ளீட்டிற்காக காத்திருக்கிறது. தொடங்க mic ஐ தட்டவும்.",
    manualPlaceholder: "அல்லது அறிகுறிகளை இங்கே தட்டச்சு செய்யுங்கள்...",
    saveCase: "வழக்கை சேமி",
    newTriage: "புதிய சோதனை",
    firstAidTitle: "இப்போது என்ன செய்வது",
    facilityTitle: "அருகிலுள்ள மருத்துவ வசதி",
    getDirections: "வழிகாட்டுதல்கள் பெறுக",
    priorityCritical: "அபாயகரமான",
    priorityUrgent: "அவசரம்",
    priorityNonUrgent: "அவசரமில்லை",
    dashboard: "டாஷ்போர்டு",
    openDashboard: "டாஷ்போர்டை திறக்க",
    systemLive: "அமைப்பு செயல்பாட்டில்",
    patientDetails: "நோயாளர் விவரங்கள்",
    captureContext: "உள்வாங்குவதற்கு முன் பின்னணி தகவலை பதிவு செய்யவும்.",
    patientNameLabel: "நோயாளியின் பெயர்",
    locationLabel: "இடம் / கிராமம்",
    preferredLanguage: "விருப்ப மொழி (STT)",
    startingSpeech: "குரல் அடையாளம் தொடங்குகிறது...",
    transcriptPreview: "ஒலி வரும் போது உடனடி புதுப்பிப்புகளை காணலாம்.",
    speechApiLabel: "வெப் குரல் API • குரோம்",
    micFooter: "மைக் browser Web Speech API (Chrome) மற்றும் manual fallback ஐ பயன்படுத்துகிறது.",
    assignedPriority: "ஒதுக்கப்பட்ட முன்னுரிமை",
    aiTriageTag: "AI சோதனை குறிச்சொல்:",
  },
};

const FIRST_AID_STEPS: Record<LanguageCode, Record<Priority, string[]>> = {
  english: {
    P1: [
      "Call emergency services immediately (dial 1990 in Sri Lanka).",
      "Do NOT move the patient unless in immediate danger.",
      "If not breathing: start CPR — 30 chest compressions, 2 rescue breaths.",
      "If bleeding: apply firm pressure with a clean cloth.",
      "Keep the patient warm and calm.",
      "Stay on the line with emergency services.",
      "Someone should wait outside to guide the ambulance.",
    ],
    P2: [
      "Get to the nearest clinic or hospital within 2 hours.",
      "If fever above 39°C: apply cool wet cloth to forehead.",
      "If vomiting: keep patient sitting upright, small sips of water.",
      "If injury: do not remove any embedded objects.",
      "If fracture suspected: immobilize the area, do not force movement.",
      "Monitor breathing and consciousness every 5 minutes.",
    ],
    P3: [
      "Rest and stay hydrated — drink plenty of water.",
      "Monitor symptoms — if they worsen, return for re-triage.",
      "Take paracetamol for pain or fever if available.",
      "Avoid strenuous activity for 24 hours.",
      "Visit a pharmacy or clinic if no improvement in 24 hours.",
      "Keep a note of any new symptoms that appear.",
    ],
  },
  sinhala: {
    P1: [
      "හදිසි සේවා වහාම අමතන්න (1990).",
      "රෝගියා නොසෙල්වන්න.",
      "හුස්ම නොගන්නේ නම්: CPR ආරම්භ කරන්න.",
      "රුධිරය ගලනවා නම්: පිරිසිදු රෙදිකඩකින් ඔබන්න.",
      "රෝගියා උණුසුම්ව තබා ගන්න.",
    ],
    P2: [
      "පැය 2ක් ඇතුළත ළඟම ක්ලිනික් හෝ රෝහල වෙත යන්න.",
      "උණ 39°C ඉක්මවන්නේ නම්: නලපටියේ සිසිල් තෙත් රෙදි තබන්න.",
      "වමනය නම්: රෝගියා කෙළින් වාඩි කර කුඩා ජල ප්‍රමාණ දෙන්න.",
      "තුවාලයක් නම්: ඇතුළත තියෙන දේවල් ඉවත් නොකරන්න.",
      "අස්ථි කැඩීම සැක නම්: කොටස ස්ථාවර කර බලෙන් නොහරවන්න.",
      "මිනිත්තු 5කට වරක් හුස්ම හා සිහිය පරීක්ෂා කරන්න.",
    ],
    P3: [
      "විවේක ගන්න සහ ජලය වැඩිපුර පානය කරන්න.",
      "ලක්ෂණ නිරීක්ෂණය කරන්න — වැඩි වුවහොත් නැවත ත්‍රාසනයට එන්න.",
      "වේදනාව හෝ උණ සඳහා පරාසිටමෝල් ගන්න.",
      "පැය 24ක් බර වැඩ වලින් වළකින්න.",
      "පැය 24කින් සුව නොවන්නේ නම් ෆාමසියකට හෝ ක්ලිනික් එකකට යන්න.",
      "අලුත් ලක්ෂණ සටහන් කර තබා ගන්න.",
    ],
  },
  tamil: {
    P1: [
      "உடனடியாக அவசர சேவைகளை அழைக்கவும் (1990).",
      "நோயாளியை அசைக்காதீர்கள்.",
      "சுவாசிக்கவில்லை எனில்: CPR தொடங்குங்கள்.",
      "இரத்தப்போக்கு இருந்தால்: சுத்தமான துணியால் அழுத்துங்கள்.",
      "நோயாளியை சூடாக வைத்திருங்கள்.",
    ],
    P2: [
      "2 மணி நேரத்துக்குள் அருகிலுள்ள கிளினிக் அல்லது மருத்துவமனைக்கு செல்லுங்கள்.",
      "39°C மேல் காய்ச்சல் இருந்தால்: நெற்றியில் குளிர்ந்த ஈரத்துணி வையுங்கள்.",
      "வாந்தி இருந்தால்: நேராக உட்காரவைத்து சிறிது சிறிதாக தண்ணீர் குடிக்க விடுங்கள்.",
      "காயம் இருந்தால்: உட்புகுந்த பொருள்களை அகற்றாதீர்கள்.",
      "எலும்பு முறிவு சந்தேகம் என்றால்: அங்கத்தை அசையாமல் நிலைப்படுத்துங்கள்.",
      "ஒவ்வொரு 5 நிமிடத்துக்கும் சுவாசமும் விழிப்புணர்வும் கண்காணிக்கவும்.",
    ],
    P3: [
      "ஓய்வு எடுத்துக் கொண்டு அதிக தண்ணீர் குடிக்கவும்.",
      "அறிகுறிகளை கவனிக்கவும் — மோசமானால் மீண்டும் சோதனைக்கு வாருங்கள்.",
      "வலி அல்லது காய்ச்சலுக்கு பாராசெட்டமோல் எடுத்துக் கொள்ளலாம்.",
      "24 மணி நேரம் கடின உழைப்பை தவிர்க்கவும்.",
      "24 மணி நேரத்தில் முன்னேற்றம் இல்லையெனில் மருந்தகம் அல்லது கிளினிக்குக்கு செல்லுங்கள்.",
      "புதிய அறிகுறிகள் தோன்றினால் பதிவு செய்து வையுங்கள்.",
    ],
  },
};

type FacilityInfo = {
  name: string;
  distance: string;
  hours: string;
  phone: string;
};

const FACILITY_LOOKUP: Record<string, FacilityInfo> = {
  colombo: {
    name: "National Hospital Colombo",
    distance: "0.8 km",
    hours: "Open 24/7",
    phone: "0112 691 111",
  },
  galle: {
    name: "Karapitiya Teaching Hospital",
    distance: "1.2 km",
    hours: "Open 24/7",
    phone: "0912 234 567",
  },
  kandy: {
    name: "Kandy Teaching Hospital",
    distance: "0.9 km",
    hours: "Open 24/7",
    phone: "0812 222 261",
  },
  matara: {
    name: "Matara General Hospital",
    distance: "1.5 km",
    hours: "Open 24/7",
    phone: "0412 222 261",
  },
  jaffna: {
    name: "Jaffna Teaching Hospital",
    distance: "1.1 km",
    hours: "Open 24/7",
    phone: "0212 222 261",
  },
  default: {
    name: "Nearest Regional Hospital",
    distance: "~2 km",
    hours: "Open 24/7",
    phone: "1990",
  },
};

function facilityByLocation(location: string): FacilityInfo {
  const lower = location.toLowerCase();
  if (lower.includes("colombo")) return FACILITY_LOOKUP.colombo;
  if (lower.includes("galle")) return FACILITY_LOOKUP.galle;
  if (lower.includes("kandy")) return FACILITY_LOOKUP.kandy;
  if (lower.includes("matara")) return FACILITY_LOOKUP.matara;
  if (lower.includes("jaffna")) return FACILITY_LOOKUP.jaffna;
  return FACILITY_LOOKUP.default;
}

type SpeechRecognitionResultItem = {
  0: { transcript: string };
  isFinal: boolean;
};

type WebkitSpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechRecognitionResultItem> }) => void) | null;
};

type BrowserWindowWithSpeech = Window & {
  webkitSpeechRecognition?: new () => WebkitSpeechRecognitionLike;
};

function CrossIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={props.className}
    >
      <rect x="4" y="9" width="16" height="6" rx="1.35" fill="currentColor" />
      <rect
        x="9"
        y="4"
        width="6"
        height="16"
        rx="1.35"
        fill="currentColor"
      />
    </svg>
  );
}

export default function TriagePage() {
  const [patientName, setPatientName] = useState("");
  const [patientLocation, setPatientLocation] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("english");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  const [recording, setRecording] = useState(false);
  const [wsStatus, setWsStatus] = useState<"idle" | "connecting" | "open" | "error">(
    "idle",
  );

  const [partialLive, setPartialLive] = useState("");
  const [finalPieces, setFinalPieces] = useState<string[]>([]);
  const [manualSymptoms, setManualSymptoms] = useState("");

  const [lastError, setLastError] = useState<string | null>(null);

  const [priority, setPriority] = useState<Priority | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const recognitionRef = useRef<WebkitSpeechRecognitionLike | null>(null);
  const finalsRef = useRef<string[]>([]);
  const partialRef = useRef("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    finalsRef.current = finalPieces;
  }, [finalPieces]);
  useEffect(() => {
    partialRef.current = partialLive;
  }, [partialLive]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!langMenuRef.current?.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const transcriptFull = [...finalPieces, partialLive.trim() ? partialLive.trim() : ""]
    .filter(Boolean)
    .join(" ");

  const resetSession = useCallback(() => {
    setPartialLive("");
    setFinalPieces([]);
    setPriority(null);
    setReason(null);
    setShowResult(false);
    setSaveState("idle");
    setLastError(null);
  }, []);

  const teardownCapture = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setWsStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    resetSession();
    setRecording(true);
    setWsStatus("connecting");

    try {
      const speechWindow = window as BrowserWindowWithSpeech;
      if (!speechWindow.webkitSpeechRecognition) {
        throw new Error("Web Speech API is not available in this browser. Use Chrome.");
      }
      const recognition = new speechWindow.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang =
        language === "sinhala" ? "si-LK" : language === "tamil" ? "ta-LK" : "en-US";

      recognition.onstart = () => {
        setWsStatus("open");
      };

      recognition.onresult = (event) => {
        let interim = "";
        const finalsToAdd: string[] = [];

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript?.trim();
          if (!transcript) continue;
          if (result.isFinal) {
            finalsToAdd.push(transcript);
          } else {
            interim += `${transcript} `;
          }
        }

        if (finalsToAdd.length) {
          setFinalPieces((prev) => [...prev, ...finalsToAdd]);
        }
        setPartialLive(interim.trim());
      };

      recognition.onerror = (event) => {
        setLastError(event.error ? `Speech recognition error: ${event.error}` : "Speech recognition error");
        setWsStatus("error");
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setWsStatus("idle");
        setRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Could not access microphone.");
      teardownCapture();
      setRecording(false);
    }
  }, [language, resetSession, teardownCapture]);

  const stopAndScore = useCallback(async () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }

    const voiceTranscript = [...finalsRef.current, partialRef.current.trim()]
      .filter(Boolean)
      .join(" ");
    const manualFallback = manualSymptoms.trim();
    const transcriptBody = voiceTranscript || manualFallback;

    if (!voiceTranscript && manualFallback) {
      setFinalPieces([manualFallback]);
      setPartialLive("");
    }

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patientName,
          location: patientLocation,
          language: LANG_OPTIONS.find((l) => l.code === language)?.label ?? language,
          transcript: transcriptBody,
          persist: false,
        }),
      });

      const data = (await res.json()) as { priority?: Priority; reason?: string; error?: string };

      if (!res.ok) {
        setLastError(data.error ?? "Scoring failed");
        setRecording(false);
        setWsStatus("idle");
        return;
      }

      setPriority(data.priority ?? "P3");
      setReason(data.reason ?? "");
      setShowResult(true);
    } catch {
      setLastError("Network error while scoring");
    }

    setRecording(false);
    setWsStatus("idle");
    setPartialLive("");
  }, [language, manualSymptoms, patientLocation, patientName]);

  const saveCase = useCallback(async () => {
    if (!priority || !reason) return;
    setSaveState("saving");

    const transcriptBody = transcriptFull;

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patientName,
          location: patientLocation,
          language: LANG_OPTIONS.find((l) => l.code === language)?.label ?? language,
          transcript: transcriptBody,
          persist: true,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setLastError(data.error ?? "Save failed");
        setSaveState("idle");
        return;
      }

      setSaveState("saved");
    } catch {
      setLastError("Network error while saving");
      setSaveState("idle");
    }
  }, [language, patientLocation, patientName, priority, reason, transcriptFull]);

  const newTriage = useCallback(() => {
    teardownCapture();
    setRecording(false);
    resetSession();
    setManualSymptoms("");
    setPatientName("");
    setPatientLocation("");
    setLanguage("english");
  }, [resetSession, teardownCapture]);

  const selectedLangLabel =
    LANG_OPTIONS.find((x) => x.code === language)?.label ?? language;
  const t = translations[language];
  const selectedFacility = facilityByLocation(patientLocation);
  const firstAidSteps = priority ? FIRST_AID_STEPS[language][priority] : [];
  const recommendedFacilityType =
    priority === "P1"
      ? "Nearest HOSPITAL (emergency capable)"
      : priority === "P2"
        ? "Nearest CLINIC or HOSPITAL"
        : "Nearest PHARMACY or CLINIC";
  const priorityTone =
    priority === "P1"
      ? {
          border: "border-p1-rose/35",
          dot: "bg-p1-rose",
        }
      : priority === "P2"
        ? {
            border: "border-p2-amber/35",
            dot: "bg-p2-amber",
          }
        : {
            border: "border-p3-emerald/35",
            dot: "bg-p3-emerald",
          };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-p1-rose/15 ring-2 ring-white/10">
              <CrossIcon className="h-7 w-7 text-p1-rose" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm uppercase tracking-[0.2em] text-slate-400">
                RuralCare
              </span>
              <span className="text-lg font-semibold text-white">Triage Console</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="btn-glow hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:border-accent/60 hover:bg-white/10 md:inline-flex"
            >
              {t.dashboard}
            </Link>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-p3-emerald/70 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-p3-emerald" />
              </span>
              <span className="text-xs font-medium text-slate-200">{t.systemLive}</span>
            </div>
          </div>
        </div>
        <div className="mx-auto px-4 pb-3 md:hidden">
          <Link
            href="/dashboard"
            className="btn-glow flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:border-accent/60"
          >
            {t.openDashboard}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-12 md:px-6 md:pt-16">
        <section
          className={`text-center md:text-left ${mounted ? "animate-fade-in" : "opacity-0"}`}
        >
          <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            <span className="text-gradient-violet">{t.title}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base text-slate-400 md:text-lg">
            {t.subtitle}
          </p>
        </section>

        <section
          className={`mx-auto mt-10 max-w-3xl md:mx-0 ${mounted ? "animate-fade-in" : "opacity-0"}`}
          style={{ animationDelay: "0.08s" }}
        >
          <div className="glass overflow-visible">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="text-sm font-medium text-slate-300">{t.patientDetails}</div>
              <div className="text-xs text-slate-500">{t.captureContext}</div>
            </div>
            <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t.patientNameLabel}
                </span>
                <span className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 20.25v-.562a4.252 4.252 0 014.246-4.246h7.524A4.252 4.252 0 0120 19.688V20.25"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-10 pr-3 text-sm outline-none ring-0 transition focus:border-accent/40 focus:bg-black/35"
                  />
                </span>
              </label>

              <label className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t.locationLabel}
                </span>
                <span className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21s7-6.418 7-11a7 7 0 10-14 0c0 4.582 7 11 7 11z"
                      />
                      <circle cx="12" cy="10" r="2.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={patientLocation}
                    onChange={(e) => setPatientLocation(e.target.value)}
                    placeholder={t.locationPlaceholder}
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-10 pr-3 text-sm outline-none ring-0 transition focus:border-accent/40 focus:bg-black/35"
                  />
                </span>
              </label>

              <div className="relative z-50 md:col-span-2 lg:col-span-2">
                <div ref={langMenuRef} className="relative z-50">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {t.preferredLanguage}
                  </span>
                  <button
                    type="button"
                    aria-expanded={langMenuOpen}
                    onClick={() => setLangMenuOpen((x) => !x)}
                    className={`btn-glow mt-2 flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm text-white hover:bg-black/35 ${
                      langMenuOpen ? "border-accent/60 bg-accent/10" : "border-white/10 bg-black/25 hover:border-accent/40"
                    }`}
                  >
                    <span className="text-slate-200">{selectedLangLabel}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                      className={`text-slate-400 transition-transform ${langMenuOpen ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
    {langMenuOpen && (
      <div className="absolute relative left-0 right-0 z-[100] mt-2 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-slate-900/95 p-2 shadow-xl shadow-black/50 backdrop-blur-md">
                      <button
                        type="button"
                        onClick={() => {
                          console.log("english clicked");
                          setLanguage("english");
                          setLangMenuOpen(false);
                        }}
          className={`w-full cursor-pointer select-none rounded-lg px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                          language === "english"
                            ? "border border-accent/60 bg-accent/45 text-white shadow-[0_0_16px_rgba(124,58,237,0.32)]"
              : "border border-transparent text-slate-200"
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log("tamil clicked");
                          setLanguage("tamil");
                          setLangMenuOpen(false);
                        }}
          className={`w-full cursor-pointer select-none rounded-lg px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                          language === "tamil"
                            ? "border border-accent/60 bg-accent/45 text-white shadow-[0_0_16px_rgba(124,58,237,0.32)]"
              : "border border-transparent text-slate-200"
                        }`}
                      >
                        Tamil
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log("sinhala clicked");
                          setLanguage("sinhala");
                          setLangMenuOpen(false);
                        }}
          className={`w-full cursor-pointer select-none rounded-lg px-4 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                          language === "sinhala"
                            ? "border border-accent/60 bg-accent/45 text-white shadow-[0_0_16px_rgba(124,58,237,0.32)]"
              : "border border-transparent text-slate-200"
                        }`}
                      >
                        Sinhala
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`mx-auto mt-12 flex flex-col items-center ${mounted ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "0.15s" }}>
          <div className="relative flex items-center justify-center">
            {!recording ? (
              <span className="pointer-events-none absolute -inset-8 rounded-full bg-accent/25 blur-xl" />
            ) : (
              <span className="pointer-events-none absolute -inset-10 rounded-full bg-p1-rose/20 blur-xl" />
            )}
            {!recording ? (
              <span className="pointer-events-none absolute -inset-3 rounded-full border border-accent/30 shadow-[0_0_30px_rgba(124,58,237,.35)]" />
            ) : null}

            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                className="btn-glow relative z-[10] flex h-[80px] w-[80px] items-center justify-center rounded-full border border-accent/40 bg-accent/85 text-white shadow-glow-violet ring-8 ring-accent/25"
                aria-label={t.startBtn}
              >
                <MicIconIdle />
              </button>
            ) : (
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative flex h-[80px] w-[80px] items-center justify-center">
                  <span className="absolute inset-[-18px] animate-pulse-ring rounded-full border-2 border-p1-rose/80" />
                  <span className="absolute inset-[-26px] animate-[pulse-ring_1.25s_ease-out_infinite] rounded-full border border-p1-rose/40 [animation-delay:0.35s]" />
                  <button
                    type="button"
                    className="relative flex h-[80px] w-[80px] items-center justify-center rounded-full bg-p1-rose text-white shadow-[0_0_40px_rgba(239,68,68,0.45)] ring-8 ring-p1-rose/35"
                    aria-label="Recording in progress"
                  >
                    <MicIconLive />
                  </button>
                </div>
                <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 backdrop-blur-md">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-p1-rose" />
                  {t.listening}
                </div>
              </div>
            )}
          </div>

          {recording && (
            <button
              type="button"
              onClick={() => void stopAndScore()}
              className="btn-glow mt-10 rounded-xl border border-white/10 bg-accent px-10 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent/95"
            >
              {t.stopBtn}
            </button>
          )}

          <div className="mt-8 w-full max-w-2xl">
            <textarea
              value={manualSymptoms}
              onChange={(e) => setManualSymptoms(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void stopAndScore();
                }
              }}
              placeholder={t.manualPlaceholder}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none backdrop-blur-md transition focus:border-accent/40 focus:bg-white/10"
            />
          </div>

          {wsStatus === "connecting" && (
            <div className="mt-6 text-xs text-slate-400">{t.startingSpeech}</div>
          )}
        </section>

        <section className={`mx-auto mt-10 max-w-3xl md:mx-0 ${mounted ? "animate-fade-in" : "opacity-0"}`} style={{ animationDelay: "0.22s" }}>
          <div className="glass p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">{t.transcriptTitle}</div>
                <div className="text-xs text-slate-500">
                  {t.transcriptPreview}
                </div>
              </div>
              <div className="hidden text-xs text-slate-600 sm:inline">{t.speechApiLabel}</div>
            </div>
            <div className="mt-5 min-h-[120px] leading-relaxed text-base">
              {finalPieces.length === 0 && !partialLive && !recording && (
                <span className="text-slate-500">
                  {t.transcriptWaiting}
                </span>
              )}
              {finalPieces.map((piece, idx) => (
                <span
                  key={`f-${idx}`}
                  className="mr-2 inline font-semibold text-white"
                >
                  {piece.trim()}
                </span>
              ))}
              {partialLive.trim() ? (
                <span className="italic text-slate-400">{partialLive.trim()}</span>
              ) : null}
            </div>
          </div>
        </section>

        {lastError && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-p1-rose/30 bg-p1-rose/10 px-5 py-3 text-sm text-rose-200 md:mx-0">
            {lastError}
          </div>
        )}

        {showResult && priority && reason && (
          <section
            className={`mx-auto mt-12 max-w-3xl md:mx-0 ${mounted ? "animate-slide-in" : "opacity-0"}`}
          >
            <div className="glass relative overflow-hidden p-8 md:p-10">
              <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
              <PriorityBadge priority={priority} language={language} />

              <p className="mt-8 text-lg text-slate-200 md:text-xl">{reason}</p>

              <div
                className={`mt-8 grid gap-4 md:grid-cols-2 ${mounted ? "animate-fade-in" : "opacity-0"}`}
                style={{ animationDelay: "0.1s" }}
              >
                <div className={`rounded-2xl border bg-black/30 p-5 backdrop-blur-md ${priorityTone.border}`}>
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-300"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20" />
                    </svg>
                    <h3 className="text-base font-semibold text-white">{t.firstAidTitle}</h3>
                  </div>
                  <ol className="mt-4 space-y-2 text-sm text-slate-200">
                    {firstAidSteps.map((step, idx) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityTone.dot}`} />
                        <span>
                          <span className="mr-1 font-semibold text-white">{idx + 1}.</span>
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={`rounded-2xl border bg-black/30 p-5 backdrop-blur-md ${priorityTone.border}`}>
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-300"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21s7-6.418 7-11a7 7 0 10-14 0c0 4.582 7 11 7 11z"
                      />
                      <circle cx="12" cy="10" r="2.5" strokeLinecap="round" />
                    </svg>
                    <h3 className="text-base font-semibold text-white">{t.facilityTitle}</h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{recommendedFacilityType}</p>
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h6M9 13h6" />
                      </svg>
                      <span className="font-semibold">{selectedFacility.name}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      <div>Estimated distance: {selectedFacility.distance}</div>
                      <div>Opening hours: {selectedFacility.hours}</div>
                      <div>
                        Phone:{" "}
                        <a
                          href={`tel:${selectedFacility.phone.replace(/\s+/g, "")}`}
                          className="font-semibold text-p3-emerald hover:underline"
                        >
                          {selectedFacility.phone}
                        </a>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(selectedFacility.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-glow mt-4 inline-flex items-center justify-center rounded-xl border border-accent/35 bg-accent/20 px-4 py-2 text-sm font-semibold text-white hover:bg-accent/30"
                    >
                      {t.getDirections}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void saveCase()}
                  disabled={saveState === "saving" || saveState === "saved"}
                  className="btn-glow inline-flex items-center justify-center gap-3 rounded-xl border border-p3-emerald/40 bg-p3-emerald/20 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-p3-emerald/35 disabled:pointer-events-none disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {saveState === "saved"
                    ? "Case saved"
                    : saveState === "saving"
                      ? "Saving…"
                      : t.saveCase}
                </button>
                <button
                  type="button"
                  onClick={newTriage}
                  className="btn-glow inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/35 px-6 py-3 text-sm font-semibold text-slate-50 hover:bg-black/55"
                >
                  {t.newTriage}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {!showResult ? (
        <div className="pointer-events-none fixed bottom-10 left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-white/10 bg-black/55 px-4 py-2 text-xs text-slate-400 backdrop-blur md:flex">
          {t.micFooter}
        </div>
      ) : null}
    </div>
  );
}

function MicIconIdle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 13a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 13a5 5 0 1 0 10 0M12 21v-3"
      />
    </svg>
  );
}

function MicIconLive() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 13a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 13a5 5 0 1 0 10 0M12 21v-3"
      />
      <circle cx="12" cy="9" r="12" strokeOpacity=".15" className="-z-10" />
    </svg>
  );
}

function PriorityBadge({
  priority,
  language,
}: {
  priority: Priority;
  language: LanguageCode;
}) {
  const t = translations[language];
  const badge =
    priority === "P1"
      ? {
          label: t.priorityCritical,
          bg: "from-p1-rose via-rose-500 to-pink-600",
          text: "P1 Critical",
          ring: "ring-p1-rose/40",
          chip: `P1 – ${t.priorityCritical}`,
        }
      : priority === "P2"
        ? {
            label: t.priorityUrgent,
            bg: "from-p2-amber via-amber-400 to-orange-500",
            text: "P2 Urgent",
            ring: "ring-p2-amber/40",
            chip: `P2 – ${t.priorityUrgent}`,
          }
        : {
            label: t.priorityNonUrgent,
            bg: "from-p3-emerald via-emerald-400 to-teal-500",
            text: "P3 Non‑urgent",
            ring: "ring-p3-emerald/35",
            chip: `P3 – ${t.priorityNonUrgent}`,
          };

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className={`rounded-2xl bg-gradient-to-br ${badge.bg} p-[1px] shadow-lg shadow-black/40 ring ${badge.ring}`}
      >
        <div className="rounded-2xl bg-navy px-7 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
            {t.assignedPriority}
          </div>
          <div className="mt-2 text-5xl font-extrabold text-white">{priority}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {badge.label}
          </div>
        </div>
      </div>

      <div className="inline-flex animate-[fadeIn_.6s_ease-out] items-center gap-3 rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-xs text-slate-200 md:text-sm">
        <SparkIcon />
        {t.aiTriageTag}{" "}
        <span className="font-semibold text-white">{badge.chip}</span>
      </div>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-accent"
      aria-hidden
    >
      <path d="M13 10V3L4 14h7v7l9-11h-7z" opacity=".92" />
    </svg>
  );
}
