export type LanguageCode =
  | "english"
  | "sinhala"
  | "tamil_lk"
  | "tamil_in"
  | "hindi"
  | "bengali_in"
  | "bengali_bd"
  | "urdu"
  | "punjabi"
  | "malayalam"
  | "telugu"
  | "kannada"
  | "marathi";

export type TranslationLanguage =
  | "english"
  | "sinhala"
  | "tamil"
  | "hindi"
  | "bengali"
  | "urdu"
  | "punjabi"
  | "malayalam"
  | "telugu"
  | "kannada"
  | "marathi";

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  flag: string;
  group: "sri_lanka" | "india" | "pakistan_bangladesh";
  speechCode: string;
  /** Full-word language name for Valsea STT API (e.g. "tamil", "sinhala") */
  valseaLanguage: string;
  translationKey: TranslationLanguage;
  /** Short code for Valsea TTS API */
  valseaCode: string;
};

export const LANGUAGE_GROUPS = [
  { id: "sri_lanka" as const, label: "Sri Lanka", flag: "🇱🇰" },
  { id: "india" as const, label: "India", flag: "🇮🇳" },
  { id: "pakistan_bangladesh" as const, label: "Pakistan / Bangladesh", flag: "🇵🇰" },
];

// IMPORTANT: valseaLanguage must be the full word that Valsea STT API accepts.
// Valsea does NOT accept ISO codes (ta, si, hi). It requires: "tamil", "sinhala", "hindi" etc.
// valseaCode is the short ISO code used only for Valsea TTS (text-to-speech).
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "english",
    label: "English",
    flag: "🇬🇧",
    group: "sri_lanka",
    speechCode: "en-US",
    valseaLanguage: "english",
    valseaCode: "en",
    translationKey: "english",
  },
  {
    code: "sinhala",
    label: "Sinhala",
    flag: "🇱🇰",
    group: "sri_lanka",
    speechCode: "si-LK",
    valseaLanguage: "sinhala",
    valseaCode: "si",
    translationKey: "sinhala",
  },
  {
    code: "tamil_lk",
    label: "Tamil (Sri Lanka)",
    flag: "🇱🇰",
    group: "sri_lanka",
    speechCode: "ta-IN",
    valseaLanguage: "tamil",
    valseaCode: "ta",
    translationKey: "tamil",
  },
  {
    code: "tamil_in",
    label: "Tamil (India)",
    flag: "🇮🇳",
    group: "india",
    speechCode: "ta-IN",
    valseaLanguage: "tamil",
    valseaCode: "ta",
    translationKey: "tamil",
  },
  {
    code: "hindi",
    label: "Hindi",
    flag: "🇮🇳",
    group: "india",
    speechCode: "hi-IN",
    valseaLanguage: "hindi",
    valseaCode: "hi",
    translationKey: "hindi",
  },
  {
    code: "bengali_in",
    label: "Bengali (India)",
    flag: "🇮🇳",
    group: "india",
    speechCode: "bn-IN",
    valseaLanguage: "bengali-in",
    valseaCode: "bn",
    translationKey: "bengali",
  },
  {
    code: "bengali_bd",
    label: "Bengali (Bangladesh)",
    flag: "🇧🇩",
    group: "pakistan_bangladesh",
    speechCode: "bn-IN",
    valseaLanguage: "bengali-in",
    valseaCode: "bn",
    translationKey: "bengali",
  },
  {
    code: "malayalam",
    label: "Malayalam",
    flag: "🇮🇳",
    group: "india",
    speechCode: "ml-IN",
    valseaLanguage: "malayalam",
    valseaCode: "ml",
    translationKey: "malayalam",
  },
  {
    code: "telugu",
    label: "Telugu",
    flag: "🇮🇳",
    group: "india",
    speechCode: "te-IN",
    valseaLanguage: "telugu",
    valseaCode: "te",
    translationKey: "telugu",
  },
  {
    code: "kannada",
    label: "Kannada",
    flag: "🇮🇳",
    group: "india",
    speechCode: "kn-IN",
    valseaLanguage: "kannada",
    valseaCode: "kn",
    translationKey: "kannada",
  },
  {
    code: "marathi",
    label: "Marathi",
    flag: "🇮🇳",
    group: "india",
    speechCode: "mr-IN",
    valseaLanguage: "marathi",
    valseaCode: "mr",
    translationKey: "marathi",
  },
  {
    code: "punjabi",
    label: "Punjabi",
    flag: "🇮🇳",
    group: "india",
    speechCode: "pa-IN",
    valseaLanguage: "punjabi",
    valseaCode: "pa",
    translationKey: "punjabi",
  },
  {
    code: "urdu",
    label: "Urdu",
    flag: "🇵🇰",
    group: "pakistan_bangladesh",
    speechCode: "ur-PK",
    // Urdu not supported by Valsea STT — falls back to english transcription
    valseaLanguage: "english",
    valseaCode: "ur",
    translationKey: "urdu",
  },
];

export function getLanguageOption(code: LanguageCode): LanguageOption {
  return LANGUAGE_OPTIONS.find((l) => l.code === code) ?? LANGUAGE_OPTIONS[0];
}

export function getLanguageLabel(code: LanguageCode): string {
  return getLanguageOption(code).label;
}