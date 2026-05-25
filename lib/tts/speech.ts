import type { Priority, TriageResult } from "../types";

export function buildSpokenSummary(result: TriageResult): string {
  return result.reason?.trim()
    ? result.reason.trim().substring(0, 100)
    : "Assessment complete";
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

/** Fire-and-forget warm-up so the TTS route is hot before triage finishes. */
export function prewarmTts(speechCode = "en-US"): void {
  if (typeof window === "undefined") return;

  fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: " ",
      language: speechCode.split("-")[0],
    }),
  }).catch(() => {});
}

export async function playSpokenSummary(params: {
  text: string;
  speechCode: string;
  speed: number;
}): Promise<void> {
  const { text, speechCode } = params;

  if (typeof window === "undefined") return;

  // Keep TTS input short for faster audio generation
  const spokenText = text.substring(0, 100);

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: spokenText,
        language: speechCode.split("-")[0],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[TTS] API error:", res.status, errBody);
      if (res.status === 503) {
        throw new Error("OPENAI_API_KEY missing — save .env.local and restart npm run dev");
      }
      throw new Error(`TTS API failed (${res.status})`);
    }

    const blob = await res.blob();
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
