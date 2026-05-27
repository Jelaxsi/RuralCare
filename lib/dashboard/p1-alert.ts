import type { CaseRecord } from "@/lib/types";

export function playP1Beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    window.setTimeout(() => void ctx.close().catch(() => {}), 400);
  } catch (err) {
    console.warn("[Dashboard] P1 alert sound blocked or unavailable:", err);
  }
}

export function formatP1AlertLabel(c: CaseRecord): string {
  return c.chiefComplaint?.trim() || c.patientId || c.name || c.id.slice(0, 8);
}

export function findNewP1Cases(prevIds: Set<string>, cases: CaseRecord[]): CaseRecord[] {
  return cases.filter((c) => c.priority === "P1" && !prevIds.has(c.id));
}

export function collectP1Ids(cases: CaseRecord[]): Set<string> {
  return new Set(cases.filter((c) => c.priority === "P1").map((c) => c.id));
}
