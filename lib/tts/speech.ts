import type { TranslationKeys } from "../i18n/translations";
import type { Priority, TriageResult } from "../types";

export function buildSpokenSummary(
  result: TriageResult,
  t: Pick<
    TranslationKeys,
    | "whatsHappening"
    | "followUp"
    | "clinicalReasoning"
    | "immediateActions"
    | "warningSigns"
    | "doNotDo"
  >,
): string {
  const parts: string[] = [];

  if (result.likely_condition.trim()) {
    parts.push(result.likely_condition.trim());
  }
  if (result.reason.trim()) {
    parts.push(result.reason.trim());
  }
  if (result.what_is_happening.trim()) {
    parts.push(`${t.whatsHappening}. ${result.what_is_happening.trim()}`);
  }
  if (result.immediate_actions.length > 0) {
    parts.push(`${t.immediateActions}. ${result.immediate_actions.join(". ")}`);
  }
  if (result.warning_signs.length > 0) {
    parts.push(`${t.warningSigns}. ${result.warning_signs.join(". ")}`);
  }
  if (result.do_not_do.length > 0) {
    parts.push(`${t.doNotDo}. ${result.do_not_do.join(". ")}`);
  }
  if (result.follow_up.trim()) {
    parts.push(`${t.followUp}. ${result.follow_up.trim()}`);
  }
  if (result.clinical_reasoning.trim()) {
    parts.push(`${t.clinicalReasoning}. ${result.clinical_reasoning.trim()}`);
  }
  if (result.specialist_needed?.trim()) {
    parts.push(result.specialist_needed.trim());
  }

  return parts.filter(Boolean).join(". ");
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

  // OpenAI tts-1 input limit is 4096 characters
  const spokenText = text.substring(0, 4096);

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
