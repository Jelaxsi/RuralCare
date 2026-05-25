import type { TranslationLanguage } from "./languages";
import type { EstimatedTimeToCare } from "../types";

export const TIME_TO_CARE_TRANS: Record<
  TranslationLanguage,
  Record<EstimatedTimeToCare, string>
> = {
  english: {
    immediately: "immediately",
    "within 1 hour": "within 1 hour",
    "within 4 hours": "within 4 hours",
    "within 24 hours": "within 24 hours",
  },
  tamil: {
    immediately: "உடனடியாக",
    "within 1 hour": "1 மணி நேரத்திற்குள்",
    "within 4 hours": "4 மணி நேரத்திற்குள்",
    "within 24 hours": "24 மணி நேரத்திற்குள்",
  },
  sinhala: {
    immediately: "වහාම",
    "within 1 hour": "පැය 1 ක් ඇතුළත",
    "within 4 hours": "පැය 4 ක් ඇතුළත",
    "within 24 hours": "පැය 24 ක් ඇතුළත",
  },
  hindi: {
    immediately: "तुरंत",
    "within 1 hour": "1 घंटे के भीतर",
    "within 4 hours": "4 घंटे के भीतर",
    "within 24 hours": "24 घंटे के भीतर",
  },
  bengali: {
    immediately: "অবিলম্বে",
    "within 1 hour": "১ ঘণ্টার মধ্যে",
    "within 4 hours": "৪ ঘণ্টার মধ্যে",
    "within 24 hours": "২৪ ঘণ্টার মধ্যে",
  },
  urdu: {
    immediately: "فوری طور پر",
    "within 1 hour": "1 گھنٹے کے اندر",
    "within 4 hours": "4 گھنٹے کے اندر",
    "within 24 hours": "24 گھنٹے کے اندر",
  },
  malayalam: {
    immediately: "ഉടൻ",
    "within 1 hour": "1 മണിക്കൂറിനുള്ളിൽ",
    "within 4 hours": "4 മണിക്കൂറിനുള്ളിൽ",
    "within 24 hours": "24 മണിക്കൂറിനുള്ളിൽ",
  },
  telugu: {
    immediately: "వెంటనే",
    "within 1 hour": "1 గంటలోపు",
    "within 4 hours": "4 గంటలోపు",
    "within 24 hours": "24 గంటలోపు",
  },
  kannada: {
    immediately: "ತಕ್ಷಣ",
    "within 1 hour": "1 ಗಂಟೆಯೊಳಗೆ",
    "within 4 hours": "4 ಗಂಟೆಯೊಳಗೆ",
    "within 24 hours": "24 ಗಂಟೆಯೊಳಗೆ",
  },
  marathi: {
    immediately: "ताबडतोब",
    "within 1 hour": "1 तासात",
    "within 4 hours": "4 तासात",
    "within 24 hours": "24 तासात",
  },
  punjabi: {
    immediately: "ਤੁਰੰਤ",
    "within 1 hour": "1 ਘੰਟੇ ਦੇ ਅੰਦਰ",
    "within 4 hours": "4 ਘੰਟੇ ਦੇ ਅੰਦਰ",
    "within 24 hours": "24 ਘੰਟੇ ਦੇ ਅੰਦਰ",
  },
};

export function translateEstimatedTimeToCare(
  translationKey: TranslationLanguage,
  value: EstimatedTimeToCare,
): string {
  return TIME_TO_CARE_TRANS[translationKey]?.[value] ?? value;
}
