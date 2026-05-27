import { NextResponse } from "next/server";
import { readCases } from "@/lib/cases/storage";

export async function GET() {
  try {
    const cases = await readCases();
    cases.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json(cases);
  } catch {
    return NextResponse.json([]);
  }
}
