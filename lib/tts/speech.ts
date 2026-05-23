import type { Priority, TriageResult } from "../types";

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] ?? text).trim();
}

export function buildSpokenSummary(
  patientName: string,
  result: TriageResult,
): string {
  const name = patientName.trim() || "Patient";
  const happening = firstSentence(result.what_is_happening);
  const action0 = result.immediate_actions[0] ?? "Follow the guidance on screen.";
  const action1 = result.immediate_actions[1] ?? "";

  if (result.priority === "P1") {
    return [
      `${name}, this is a medical emergency.`,
      happening,
      "Call 1990 immediately.",
      action0,
      action1,
      "Help is on the way.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (result.priority === "P2") {
    return [
      `${name}, you need medical attention soon.`,
      happening,
      action0,
      action1,
      `Please go to the nearest clinic within ${result.estimated_time_to_care}.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `${name}, this does not appear to be an emergency.`,
    happening,
    action0,
    "Rest and monitor your symptoms.",
    "Visit a pharmacy if symptoms worsen.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function speechRateForPriority(priority: Priority): number {
  if (priority === "P1") return 1.0;
  if (priority === "P3") return 0.85;
  return 0.9;
}

export async function speakWithValsea(
  text: string,
  valseaLanguage: string,
  speed: number,
): Promise<Blob | null> {
  const apiKey = process.env.NEXT_PUBLIC_VALSEA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.valsea.ai/v1/tts", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        language: valseaLanguage,
        voice: "female",
        speed,
      }),
    });

    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export function speakWithBrowser(text: string, speechCode: string, rate: number): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechCode;
  utterance.rate = rate;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export async function playSpokenSummary(params: {
  text: string;
  valseaLanguage: string;
  speechCode: string;
  speed: number;
}): Promise<{ source: "valsea" | "browser"; audio?: HTMLAudioElement }> {
  const blob = await speakWithValsea(params.text, params.valseaLanguage, params.speed);
  if (blob && blob.size > 0) {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.addEventListener("ended", () => URL.revokeObjectURL(url));
    audio.addEventListener("error", () => URL.revokeObjectURL(url));
    try {
      await audio.play();
      return { source: "valsea", audio };
    } catch {
      URL.revokeObjectURL(url);
      speakWithBrowser(params.text, params.speechCode, params.speed * 0.95);
      return { source: "browser" };
    }
  }

  speakWithBrowser(params.text, params.speechCode, params.speed * 0.95);
  return { source: "browser" };
}
