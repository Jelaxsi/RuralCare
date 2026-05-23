import { NextResponse } from "next/server";
import { translateWithGroq } from "@/lib/triage/groq";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; language?: string };
    const text = (body.text ?? "").trim();
    const language = (body.language ?? "English").trim();
    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    const translated = await translateWithGroq(text, language);
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
