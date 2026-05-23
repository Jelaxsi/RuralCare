import type { Priority, TriageResult } from "../types";

const P1_PATTERNS: readonly string[] = [
  // English
  "breathe",
  "breathing",
  "breath",
  "breathless",
  "breathlessness",
  "shortness of breath",
  "cannot breathe",
  "can't breathe",
  "cant breathe",
  "chest",
  "heart",
  "unconscious",
  "collapse",
  "collapsed",
  "seizure",
  "stroke",
  "left hand pain",
  "left hand",
  "hand pain",
  "left arm",
  "left side pain",
  "chest pain",
  "chest tight",
  "palpitation",
  "anaphylaxis",
  "bleeding",
  "convulsion",
  "fainted",
  "unresponsive",
  // Tamil
  "மூச்சு",
  "நெஞ்சு",
  "இதயம்",
  "மார்பு",
  "சுவாசம்",
  "மயக்கம்",
  "இடது கை",
  "சுவாசிக்க",
  "சுவாச",
  // Sinhala
  "හුස්ම",
  "පපුව",
  "හදවත",
  "සිහිය",
  "වම් අත",
  // Hindi
  "सांस",
  "छाती",
  "दिल",
  "बेहोश",
  "बायां हाथ",
  "सांस ले",
  // Common romanized South Asian
  "moochchu",
  "suwasama",
  "marbu",
  "idasu kai",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function requiresP1Override(transcript: string): boolean {
  const text = normalize(transcript);
  if (!text) return false;
  return P1_PATTERNS.some((pattern) => {
    const p = normalize(pattern);
    return text.includes(p);
  });
}

export function applySafetyOverride(result: TriageResult, transcript: string): TriageResult {
  if (!requiresP1Override(transcript)) return result;
  if (result.priority === "P1") return result;

  return {
    ...result,
    priority: "P1" as Priority,
    call_emergency: true,
    emergency_number: "1990",
    estimated_time_to_care: "immediately",
    confidence: "high",
    reason:
      result.reason +
      " [Safety override: life-threatening symptom pattern detected in transcript.]",
  };
}
