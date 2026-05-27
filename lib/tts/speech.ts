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

export async function playSpokenSummary({
  text,
  speechCode,
  speed = 1.0,
}: {
  text: string;
  speechCode: string;
  speed?: number;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (!text || text.trim().length < 2) return;

  const shortText = text.trim().substring(0, 150);
  console.log("[TTS] Speaking:", shortText.substring(0, 50));

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: shortText,
        language: speechCode,
      }),
    });

    if (!res.ok) throw new Error(`TTS ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength < 100) throw new Error("Empty audio");

    type AudioContextCtor = typeof AudioContext;
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!AudioCtx) throw new Error("No AudioContext");

    const audioContext = new AudioCtx();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.playbackRate.value = speed;
    source.start(0);

    console.log("[TTS] AudioContext playing successfully");
  } catch (err) {
    console.error("[TTS] OpenAI failed, browser fallback:", err);
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechCode;
    u.rate = speed;
    window.speechSynthesis.speak(u);
  }
}
