import type { TriageResult } from "../types";
import {
  buildPartialResult,
  emptyStreamingResult,
  extractStreamPriority,
  extractStreamReason,
  firstSpeakableSentence,
} from "./stream-parse";

export type StreamTriageCallbacks = {
  onDelta: (buffer: string, partial: TriageResult) => void;
  onPriority?: (priority: TriageResult["priority"]) => void;
  onFirstSentence?: (sentence: string) => void;
  onDone: (result: TriageResult, durationMs: number) => void;
  onError: (message: string) => void;
};

type StreamEvent =
  | { type: "delta"; content: string }
  | { type: "done"; result: TriageResult; durationMs?: number }
  | { type: "error"; message: string };

function parseSseEvents(chunk: string, carry: string): { events: StreamEvent[]; rest: string } {
  const combined = carry + chunk;
  const parts = combined.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: StreamEvent[] = [];

  for (const part of parts) {
    for (const line of part.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        events.push(JSON.parse(line.slice(6)) as StreamEvent);
      } catch {
        /* skip malformed */
      }
    }
  }

  return { events, rest };
}

export async function streamTriageAnalysis(
  payload: Record<string, unknown>,
  callbacks: StreamTriageCallbacks,
): Promise<void> {
  let buffer = "";
  let spoken = false;
  let sseCarry = "";

  const res = await fetch("/api/triage?stream=1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ ...payload, persist: false }),
  });

  if (!res.ok || !res.body) {
    let message = "Triage failed";
    try {
      const err = (await res.json()) as { error?: string };
      message = err.error ?? message;
    } catch {
      /* noop */
    }
    callbacks.onError(message);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const { events, rest } = parseSseEvents(decoder.decode(value, { stream: true }), sseCarry);
    sseCarry = rest;

    for (const event of events) {
      if (event.type === "delta" && event.content) {
        buffer += event.content;
        const partial = buildPartialResult(buffer, emptyStreamingResult());

        callbacks.onDelta(buffer, partial);

        const priority = extractStreamPriority(buffer);
        if (priority) callbacks.onPriority?.(priority);

        if (!spoken) {
          const reason = extractStreamReason(buffer);
          if (reason) {
            const reasonComplete = /"reason"\s*:\s*"((?:[^"\\]|\\.)*)"/.test(buffer);
            const sentence = reasonComplete ? reason.trim() : firstSpeakableSentence(reason);
            if (sentence) {
              spoken = true;
              callbacks.onFirstSentence?.(sentence);
            }
          }
        }
      }

      if (event.type === "done") {
        callbacks.onDone(event.result, event.durationMs ?? 0);
        return;
      }

      if (event.type === "error") {
        callbacks.onError(event.message);
        return;
      }
    }
  }

  callbacks.onError("Stream ended before result was ready");
}
