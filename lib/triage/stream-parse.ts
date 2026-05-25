import type { Priority, TriageResult } from "../types";
import { triageFallback } from "./groq";

function unescapeJsonString(raw: string): string {
  return raw.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

export function extractStreamPriority(buffer: string): Priority | null {
  const match = buffer.match(/"priority"\s*:\s*"(P1|P2|P3)"/);
  return match ? (match[1] as Priority) : null;
}

export function extractStreamReason(buffer: string): string | null {
  const complete = buffer.match(/"reason"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (complete) return unescapeJsonString(complete[1]).trim();

  const partial = buffer.match(/"reason"\s*:\s*"((?:[^"\\]|\\.)*)$/);
  if (partial) return unescapeJsonString(partial[1]).trim();

  return null;
}

export function extractStreamField(buffer: string, field: string): string | null {
  const pattern = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const complete = buffer.match(pattern);
  if (complete) return unescapeJsonString(complete[1]).trim();

  const partialPattern = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)$`);
  const partial = buffer.match(partialPattern);
  if (partial) return unescapeJsonString(partial[1]).trim();

  return null;
}

/** First speakable sentence from streamed reason text. */
export function firstSpeakableSentence(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const newlineIdx = trimmed.indexOf("\n");
  if (newlineIdx > 0) return trimmed.slice(0, newlineIdx).trim();

  const punctMatch = trimmed.match(/^(.+?[.!?。])\s/);
  if (punctMatch) return punctMatch[1].trim();

  const dotIdx = trimmed.indexOf(".");
  if (dotIdx > 0) return `${trimmed.slice(0, dotIdx + 1).trim()}`;

  if (trimmed.length >= 48) return trimmed;

  return null;
}

export function buildPartialResult(buffer: string, fallback: TriageResult): TriageResult {
  const priority = extractStreamPriority(buffer) ?? fallback.priority;
  const reason = extractStreamReason(buffer) ?? fallback.reason;
  const likely_condition =
    extractStreamField(buffer, "likely_condition") ?? fallback.likely_condition;
  const what_is_happening =
    extractStreamField(buffer, "what_is_happening") ?? fallback.what_is_happening;
  const follow_up = extractStreamField(buffer, "follow_up") ?? fallback.follow_up;

  return {
    ...fallback,
    priority,
    reason,
    likely_condition,
    what_is_happening,
    follow_up,
    clinical_reasoning: reason,
    call_emergency: priority === "P1",
    emergency_number: priority === "P1" ? "1990" : null,
    estimated_time_to_care: priority === "P1" ? "immediately" : fallback.estimated_time_to_care,
  };
}

export function emptyStreamingResult(): TriageResult {
  return {
    ...triageFallback,
    priority: "P3",
    likely_condition: "…",
    reason: "…",
    what_is_happening: "…",
    follow_up: "…",
    clinical_reasoning: "…",
  };
}
