import { existsSync } from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { readCases } from "@/lib/cases/storage";

const CASES_PATH = path.join(process.cwd(), "cases.json");

export async function GET() {
  try {
    if (!existsSync(CASES_PATH) && !process.env.KV_REST_API_URL) {
      return NextResponse.json([]);
    }
    const cases = await readCases();
    cases.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json(cases);
  } catch {
    return NextResponse.json([]);
  }
}
