import type { Confidence } from "../types";

/** Confidence from symptom input completeness (word count). */
export function confidenceFromTranscript(transcript: string): Confidence {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (words > 20) return "high";
  if (words >= 10) return "medium";
  return "low";
}
