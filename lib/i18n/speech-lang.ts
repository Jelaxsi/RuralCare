import type { LanguageCode, TranslationLanguage } from "./languages";
import { getLanguageLabel, getLanguageOption } from "./languages";

/** Web Speech API BCP-47 codes — ta-IN for all Tamil (Chrome support). */
export const SPEECH_LANG_MAP: Record<TranslationLanguage, string> = {
  english: "en-US",
  tamil: "ta-IN",
  sinhala: "si-LK",
  hindi: "hi-IN",
  bengali: "bn-IN",
  urdu: "ur-PK",
  malayalam: "ml-IN",
  telugu: "te-IN",
  kannada: "kn-IN",
  marathi: "mr-IN",
  punjabi: "pa-IN",
};

export const GROQ_LANGUAGE_LABELS: Record<TranslationLanguage, string> = {
  english: "English",
  tamil: "Tamil",
  sinhala: "Sinhala",
  hindi: "Hindi",
  bengali: "Bengali",
  urdu: "Urdu",
  malayalam: "Malayalam",
  telugu: "Telugu",
  kannada: "Kannada",
  marathi: "Marathi",
  punjabi: "Punjabi",
};

export function getSpeechCode(code: LanguageCode): string {
  const option = getLanguageOption(code);
  return SPEECH_LANG_MAP[option.translationKey];
}

/** Valsea realtime STT language codes (session.start). */
export const VALSEA_STT_LANG_MAP: Record<TranslationLanguage, string> = {
  english: "english",
  tamil: "tamil",
  sinhala: "sinhala",
  hindi: "hindi",
  bengali: "bengali-in",
  urdu: "english",
  malayalam: "malayalam",
  telugu: "telugu",
  kannada: "kannada",
  marathi: "marathi",
  punjabi: "punjabi",
};

export function getValseaSttLanguage(code: LanguageCode): string {
  const option = getLanguageOption(code);
  return VALSEA_STT_LANG_MAP[option.translationKey] ?? "english";
}

const TAMIL_PATTERN = /[\u0B80-\u0BFF]/;
const SINHALA_PATTERN = /[\u0D80-\u0DFF]/;
const BENGALI_PATTERN = /[\u0980-\u09FF]/;
const MALAYALAM_PATTERN = /[\u0D00-\u0D7F]/;
const TELUGU_PATTERN = /[\u0C00-\u0C7F]/;
const KANNADA_PATTERN = /[\u0C80-\u0CFF]/;
const GURMUKHI_PATTERN = /[\u0A00-\u0A7F]/;
const ARABIC_PATTERN = /[\u0600-\u06FF]/;
const DEVANAGARI_PATTERN = /[\u0900-\u097F]/;

export function detectLanguageFromScript(transcript: string): TranslationLanguage | null {
  if (TAMIL_PATTERN.test(transcript)) return "tamil";
  if (SINHALA_PATTERN.test(transcript)) return "sinhala";
  if (BENGALI_PATTERN.test(transcript)) return "bengali";
  if (MALAYALAM_PATTERN.test(transcript)) return "malayalam";
  if (TELUGU_PATTERN.test(transcript)) return "telugu";
  if (KANNADA_PATTERN.test(transcript)) return "kannada";
  if (GURMUKHI_PATTERN.test(transcript)) return "punjabi";
  if (ARABIC_PATTERN.test(transcript)) return "urdu";
  if (DEVANAGARI_PATTERN.test(transcript)) return "hindi";
  return null;
}

/**
 * If UI is English but transcript is in another script, use detected language for Groq.
 * Otherwise use the patient's selected language.
 */
export function resolveEffectiveGroqLanguage(
  selectedCode: LanguageCode,
  transcript: string,
): string {
  const option = getLanguageOption(selectedCode);
  const detected = detectLanguageFromScript(transcript);

  if (option.translationKey === "english" && detected) {
    return GROQ_LANGUAGE_LABELS[detected];
  }

  if (detected === "hindi" && option.translationKey === "marathi") {
    return GROQ_LANGUAGE_LABELS.marathi;
  }

  return GROQ_LANGUAGE_LABELS[option.translationKey] ?? getLanguageLabel(selectedCode);
}

/** Server-side: language label from client + raw transcript script detection. */
export function resolveEffectiveGroqLanguageFromInput(
  selectedLanguageLabel: string,
  transcript: string,
): string {
  const detected = detectLanguageFromScript(transcript);
  if (detected && /^english$/i.test(selectedLanguageLabel.trim())) {
    return GROQ_LANGUAGE_LABELS[detected];
  }
  return selectedLanguageLabel;
}
