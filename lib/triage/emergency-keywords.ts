import { normalizeGroqLanguageInput } from "../i18n/speech-lang";
import type { TriageResult } from "../types";

export const EMERGENCY_KEYWORDS = [
  "cant breathe",
  "can't breathe",
  "cannot breathe",
  "not breathing",
  "no breath",
  "chest pain",
  "heart attack",
  "stroke",
  "unconscious",
  "not responding",
  "heavy bleeding",
  "seizure",
  "choking",
  "overdose",
  "poisoning",
  "collapsed",
  "fainted",
  "not waking up",
  "சுவாசிக்க முடியவில்லை",
  "மூச்சு வரவில்லை",
  "நெஞ்சு வலி",
  "இதய வலி",
  "மயக்கம்",
  "சுவாசிக்க",
  "හුස්ම ගන්න බැහැ",
  "පපුව වේදනාව",
  "අනතුර",
  "सांस नहीं",
  "सीने में दर्द",
  "बेहोश",
];

export function detectEmergencyKeywords(transcript: string): boolean {
  const lower = transcript.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
}

export function buildEmergencyP1Result(transcript: string, language: string): TriageResult {
  const lang = normalizeGroqLanguageInput(language);

  const copy = {
    tamil: {
      reason: "அவசர நிலை: உடனடி மருத்துவ கவனிப்பு தேவை. இப்போதே 1990 அழையுங்கள்.",
      what_is_happening: "உயிருக்கு ஆபத்தான அறிகுறிகள் கண்டறியப்பட்டன.",
      follow_up: "உடனடியாக 1990 அழையுங்கள் அல்லது அருகில் உள்ள அவசர சிகிச்சை பிரிவிற்கு செல்லுங்கள்.",
      clinical_reasoning: "சுவாசிப்பதில் சிரமம் / நெஞ்சு வலி உயிருக்கு ஆபத்தான அவசர நிலை.",
      likely_condition: "அவசர மருத்துவ நிலை",
    },
    sinhala: {
      reason: "හදිසි: වහාම වෛද්‍ය ප්‍රතිකාර අවශ්‍යය. දැන්ම 1990 අමතන්න.",
      what_is_happening: "ජීවිතයට තර්ජනයක් වන ලක්ෂණ හඳුනාගෙන ඇත.",
      follow_up: "වහාම 1990 අමතන්න හෝ ආසන්න හදිසි wards.",
      clinical_reasoning: "හුස්ම ගැටලුව හෝ පපු වේදනාව ජීවිතයට තර්ජනයක් වන හදිසි අවස්ථාවකි.",
      likely_condition: "හදිසි වෛද්‍ය තත්ත්වය",
    },
    hindi: {
      reason: "आपातकाल: तुरंत चिकित्सा सहायता की आवश्यकता है। अभी 108 पर कॉल करें।",
      what_is_happening: "जीवन के लिए खतरनाक लक्षण पाए गए।",
      follow_up: "तुरंत 108 पर कॉल करें या नज़दीकी आपातकाल में जाएँ।",
      clinical_reasoning: "सांस लेने में कठिनाई या छाती में दर्द जीवन के लिए खतरनाक है।",
      likely_condition: "आपातकालीन स्थिति",
    },
    english: {
      reason: "EMERGENCY: Immediate medical attention required. Call 1990 now.",
      what_is_happening: "Life-threatening symptoms detected.",
      follow_up: "Call 1990 immediately or go to nearest emergency room.",
      clinical_reasoning: "Breathing difficulty or chest pain is a life-threatening emergency.",
      likely_condition: "Emergency condition",
    },
  };

  const texts = copy[lang as keyof typeof copy] ?? copy.english;

  return {
    priority: "P1",
    likely_condition: texts.likely_condition,
    icd_code: null,
    confidence: "high",
    clinical_reasoning: texts.clinical_reasoning,
    reason: texts.reason,
    what_is_happening: texts.what_is_happening,
    immediate_actions: [
      lang === "tamil" ? "உடனே 1990 அழையுங்கள்" : "Call emergency services now",
      lang === "tamil" ? "அமைதியாக உட்கார்ந்து ஆங்காங்க சுவாசிக்கவும்" : "Stay calm and breathe slowly",
    ],
    call_emergency: true,
    emergency_number: "1990",
    warning_signs: [],
    do_not_do: [],
    estimated_time_to_care: "immediately",
    follow_up: texts.follow_up,
    medications_to_avoid: [],
    specialist_needed: null,
  };
}
