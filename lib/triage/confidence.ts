import type { Confidence } from "../types";

/** Confidence from symptom input completeness (word count). */
export function confidenceFromTranscript(transcript: string): Confidence {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 5) return "high";
  if (words >= 3) return "medium";
  return "low";
}
