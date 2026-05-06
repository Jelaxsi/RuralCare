import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Priority = "P1" | "P2" | "P3";
type CaseRecord = {
  id: string;
  name: string;
  location: string;
  language: string;
  transcript: string;
  priority: Priority;
  reason: string;
  timestamp: string;
};

const CASES_PATH = path.join(process.cwd(), "cases.json");

export async function GET() {
  const raw = await fs.readFile(CASES_PATH, "utf8").catch(() => "[]");
  const parsed = JSON.parse(raw) as unknown;
  const cases = Array.isArray(parsed) ? (parsed as CaseRecord[]) : [];
  cases.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json(cases);
}
