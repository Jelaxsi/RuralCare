import type { Priority, TriageResult } from "../types";

export function buildSpokenSummary(result: TriageResult, callEmergencyPhrase: string): string {
  return [
    result.reason,
    result.immediate_actions[0],
    result.immediate_actions[1],
    result.call_emergency ? callEmergencyPhrase : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export function speechRateForPriority(priority: Priority): number {
  return priority === "P1" ? 1.0 : 0.85;
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
  const { text, valseaLanguage, speechCode, speed } = params;

  const blob = await speakWithValsea(text, valseaLanguage, speed);
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
      speakWithBrowser(text, speechCode, speed);
      return { source: "browser" };
    }
  }

  speakWithBrowser(text, speechCode, speed);
  return { source: "browser" };
}
