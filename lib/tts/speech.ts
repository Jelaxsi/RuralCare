import type { Priority, TriageResult } from "../types";

/** Shortest speakable text — reason field only. */
export function buildSpokenSummary(result: TriageResult): string {
  const reason = result.reason?.trim();
  if (!reason || reason === "…") {
    return "Assessment complete.";
  }
  return reason.substring(0, 150);
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

  const spokenText = (text?.trim() || "Assessment complete.").substring(0, 150);

  if (spokenText.trim().length < 2) return;

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

    if (res.status === 204) return;

    if (!res.ok) {
      browserSpeak(spokenText, speechCode);
      return;
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      browserSpeak(spokenText, speechCode);
      return;
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => URL.revokeObjectURL(url);
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      browserSpeak(spokenText, speechCode);
    };

    void audio.play();
  } catch {
    browserSpeak(spokenText, speechCode);
  }
}
