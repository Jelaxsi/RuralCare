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

function handleStreamEvents(
  events: StreamEvent[],
  state: {
    buffer: string;
    spoken: boolean;
  },
  callbacks: StreamTriageCallbacks,
): "continue" | "done" | "error" {
  for (const event of events) {
    if (event.type === "delta" && event.content) {
      state.buffer += event.content;
      const partial = buildPartialResult(state.buffer, emptyStreamingResult());

      callbacks.onDelta(state.buffer, partial);

      const priority = extractStreamPriority(state.buffer);
      if (priority) callbacks.onPriority?.(priority);

      if (!state.spoken) {
        const reason = extractStreamReason(state.buffer);
        if (reason) {
          const reasonComplete = /"reason"\s*:\s*"((?:[^"\\]|\\.)*)"/.test(state.buffer);
          const sentence = reasonComplete ? reason.trim() : firstSpeakableSentence(reason);
          if (sentence) {
            state.spoken = true;
            callbacks.onFirstSentence?.(sentence);
          }
        }
      }
    }

    if (event.type === "done") {
      callbacks.onDone(event.result, event.durationMs ?? 0);
      return "done";
    }

    if (event.type === "error") {
      callbacks.onError(event.message);
      return "error";
    }
  }

  return "continue";
}

export async function streamTriageAnalysis(
  payload: Record<string, unknown>,
  callbacks: StreamTriageCallbacks,
): Promise<void> {
  const state = { buffer: "", spoken: false };
  let sseCarry = "";

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch("/api/triage?stream=1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ ...payload, persist: false }),
      signal: controller.signal,
    });
  } catch (err) {
    window.clearTimeout(timeout);
    callbacks.onError(err instanceof Error && err.name === "AbortError" ? "Triage timed out" : "Triage failed");
    return;
  }

  if (!res.ok || !res.body) {
    window.clearTimeout(timeout);
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

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        const chunkText = decoder.decode(value, { stream: !done });
        const { events, rest } = parseSseEvents(chunkText, sseCarry);
        sseCarry = rest;
        const status = handleStreamEvents(events, state, callbacks);
        if (status !== "continue") return;
      }

      if (done) break;
    }

    if (sseCarry.trim()) {
      const { events } = parseSseEvents("\n\n", sseCarry);
      const status = handleStreamEvents(events, state, callbacks);
      if (status !== "continue") return;
    }

    callbacks.onError("Stream ended before result was ready");
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : "Triage stream failed");
  } finally {
    window.clearTimeout(timeout);
    reader.releaseLock();
  }
}
