import type { Confidence } from "../types";

/** Confidence from symptom input completeness (word count). Tamil/Sinhala use fewer words. */
export function confidenceFromTranscript(transcript: string): Confidence {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 4) return "high";
  if (words >= 2) return "medium";
  return "low";
}
