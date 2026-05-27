import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; language?: string };
    const { text, language = "en" } = body;

    console.log("[TTS] Request received:", {
      text: text?.substring(0, 50),
      language,
    });

    if (!text || text.trim().length < 2) {
      console.log("[TTS] Skipping — text too short");
      return new Response(null, { status: 204 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text.trim().substring(0, 150),
      speed: 1.0,
    });

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[TTS] Error:", error);
    return NextResponse.json(
      { error: "TTS failed", details: String(error) },
      { status: 500 },
    );
  }
}
