import { kv } from "@vercel/kv";
import { existsSync } from "fs";
import { promises as fs } from "fs";
import path from "path";
import type { CaseRecord } from "../types";

const CASES_KEY = "ruralcare:cases";
const CASES_PATH = path.join(process.cwd(), "cases.json");

function hasKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function readFromFile(): Promise<CaseRecord[]> {
  if (!existsSync(CASES_PATH)) {
    return [];
  }
  const raw = await fs.readFile(CASES_PATH, "utf8").catch(() => "[]");
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CaseRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeToFile(cases: CaseRecord[]): Promise<void> {
  await fs.writeFile(CASES_PATH, JSON.stringify(cases, null, 2), "utf8");
}

export async function readCases(): Promise<CaseRecord[]> {
  if (hasKvConfigured()) {
    try {
      const cases = await kv.get<CaseRecord[]>(CASES_KEY);
      return Array.isArray(cases) ? cases : [];
    } catch (err) {
      console.error("[cases] KV read failed, falling back to file:", err);
    }
  }
  return readFromFile();
}

export async function writeCases(cases: CaseRecord[]): Promise<void> {
  if (hasKvConfigured()) {
    try {
      await kv.set(CASES_KEY, cases);
      return;
    } catch (err) {
      console.error("[cases] KV write failed, falling back to file:", err);
    }
  }
  await writeToFile(cases);
}

export async function addCase(record: CaseRecord): Promise<void> {
  const cases = await readCases();
  cases.push(record);
  await writeCases(cases);
}

export async function deleteCase(id: string): Promise<boolean> {
  const cases = await readCases();
  const next = cases.filter((c) => c.id !== id);
  if (next.length === cases.length) return false;
  await writeCases(next);
  return true;
}

export async function updateCases(
  ids: string[],
  patch: Partial<Pick<CaseRecord, "resolved">>,
): Promise<number> {
  const cases = await readCases();
  const idSet = new Set(ids);
  let updated = 0;
  const next = cases.map((c) => {
    if (!idSet.has(c.id)) return c;
    updated += 1;
    return { ...c, ...patch };
  });
  if (updated > 0) await writeCases(next);
  return updated;
}
