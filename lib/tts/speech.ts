import type { Priority, TriageResult } from "../types";

export function buildSpokenSummary(result: TriageResult): string {
  const spokenText =
    result.reason?.trim() ||
    result.what_is_happening?.trim() ||
    "Assessment complete. Please see results.";
  return spokenText.substring(0, 100);
}

export function speechRateForPriority(priority: Priority): number {
  return priority === "P1" ? 1.0 : 0.85;
}

function browserSpeak(text: string, lang: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export async function playSpokenSummary(params: {
  text: string;
  speechCode: string;
  speed: number;
}): Promise<void> {
  const { text, speechCode } = params;

  if (typeof window === "undefined") return;

  const spokenText = (
    text?.trim() || "Assessment complete. Please see results."
  ).substring(0, 100);

  if (spokenText.trim().length < 2) {
    console.log("[TTS] Skipping — text too short");
    return;
  }

  console.log("[TTS] About to speak:", {
    text: spokenText.substring(0, 50),
    speechCode,
  });

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: spokenText,
        language: speechCode.split("-")[0],
      }),
    });

    if (res.status === 204 || !res.ok) {
      console.log("[TTS] No audio returned, skipping");
      if (res.status === 503) {
        throw new Error("OPENAI_API_KEY missing — save .env.local and restart npm run dev");
      }
      return;
    }

    const blob = await res.blob();
    if (blob.size === 0) return;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => URL.revokeObjectURL(url);
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      browserSpeak(spokenText, speechCode);
    };

    await audio.play();
    console.log("[TTS] OpenAI speaking:", speechCode);
  } catch (err) {
    console.error("[TTS] OpenAI failed, using browser:", err);
    browserSpeak(spokenText, speechCode);
  }
}
