import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; language?: string };
    const { text } = body;

    if (!text || text.trim().length < 2) {
      return new NextResponse(null, { status: 204 });
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
      response_format: "mp3",
    });

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[TTS API]", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
