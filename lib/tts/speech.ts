import type { Priority, TriageResult } from "../types";

/** Spoken summary from AI response fields (already in patient's language). */
export function buildSpokenSummary(result: TriageResult): string {
  const happening = result.what_is_happening.split(/[.!?]/)[0]?.trim() ?? result.what_is_happening;
  const action0 = result.immediate_actions[0]?.trim() ?? "";
  return [happening, action0].filter(Boolean).join(". ");
}

export function speechRateForPriority(priority: Priority): number {
  if (priority === "P1") return 1.0;
  if (priority === "P3") return 0.85;
  return 0.9;
}

async function translateForTts(text: string, languageLabel: string): Promise<string> {
  if (!languageLabel || languageLabel.toLowerCase().includes("english")) return text;
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language: languageLabel }),
    });
    if (!res.ok) return text;
    const data = (await res.json()) as { translated?: string };
    return data.translated?.trim() || text;
  } catch {
    return text;
  }
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
  languageLabel: string;
  valseaLanguage: string;
  speechCode: string;
  speed: number;
}): Promise<{ source: "valsea" | "browser"; audio?: HTMLAudioElement }> {
  const text = params.text;

  const blob = await speakWithValsea(text, params.valseaLanguage, params.speed);
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
      speakWithBrowser(text, params.speechCode, params.speed * 0.95);
      return { source: "browser" };
    }
  }

  speakWithBrowser(text, params.speechCode, params.speed * 0.95);
  return { source: "browser" };
}
