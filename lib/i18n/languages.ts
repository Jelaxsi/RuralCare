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
  valseaLanguage: string;
  translationKey: TranslationLanguage;
};

export const LANGUAGE_GROUPS = [
  { id: "sri_lanka" as const, label: "Sri Lanka", flag: "🇱🇰" },
  { id: "india" as const, label: "India", flag: "🇮🇳" },
  { id: "pakistan_bangladesh" as const, label: "Pakistan / Bangladesh", flag: "🇵🇰" },
];

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "english", label: "English", flag: "🇬🇧", group: "sri_lanka", speechCode: "en-US", valseaLanguage: "english", translationKey: "english" },
  { code: "sinhala", label: "Sinhala", flag: "🇱🇰", group: "sri_lanka", speechCode: "si-LK", valseaLanguage: "sinhala", translationKey: "sinhala" },
  { code: "tamil_lk", label: "Tamil (Sri Lanka)", flag: "🇱🇰", group: "sri_lanka", speechCode: "ta-LK", valseaLanguage: "tamil", translationKey: "tamil" },
  { code: "hindi", label: "Hindi", flag: "🇮🇳", group: "india", speechCode: "hi-IN", valseaLanguage: "hindi", translationKey: "hindi" },
  { code: "bengali_in", label: "Bengali (India)", flag: "🇮🇳", group: "india", speechCode: "bn-IN", valseaLanguage: "bengali", translationKey: "bengali" },
  { code: "tamil_in", label: "Tamil (India)", flag: "🇮🇳", group: "india", speechCode: "ta-IN", valseaLanguage: "tamil", translationKey: "tamil" },
  { code: "malayalam", label: "Malayalam", flag: "🇮🇳", group: "india", speechCode: "ml-IN", valseaLanguage: "malayalam", translationKey: "malayalam" },
  { code: "telugu", label: "Telugu", flag: "🇮🇳", group: "india", speechCode: "te-IN", valseaLanguage: "telugu", translationKey: "telugu" },
  { code: "kannada", label: "Kannada", flag: "🇮🇳", group: "india", speechCode: "kn-IN", valseaLanguage: "kannada", translationKey: "kannada" },
  { code: "marathi", label: "Marathi", flag: "🇮🇳", group: "india", speechCode: "mr-IN", valseaLanguage: "marathi", translationKey: "marathi" },
  { code: "punjabi", label: "Punjabi", flag: "🇮🇳", group: "india", speechCode: "pa-IN", valseaLanguage: "punjabi", translationKey: "punjabi" },
  { code: "urdu", label: "Urdu", flag: "🇵🇰", group: "pakistan_bangladesh", speechCode: "ur-PK", valseaLanguage: "urdu", translationKey: "urdu" },
  { code: "bengali_bd", label: "Bengali (Bangladesh)", flag: "🇧🇩", group: "pakistan_bangladesh", speechCode: "bn-BD", valseaLanguage: "bengali", translationKey: "bengali" },
];

export function getLanguageOption(code: LanguageCode): LanguageOption {
  return LANGUAGE_OPTIONS.find((l) => l.code === code) ?? LANGUAGE_OPTIONS[0];
}

export function getLanguageLabel(code: LanguageCode): string {
  return getLanguageOption(code).label;
}
