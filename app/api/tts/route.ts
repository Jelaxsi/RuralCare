import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  let text = "";
  let language = "en";

  try {
    const body = (await req.json()) as { text?: string; language?: string };
    text = body.text ?? "";
    language = body.language ?? "en";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!text.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  const lang = language.toLowerCase();
  const slowSpeech = ["tamil", "sinhala", "ta", "si"].includes(lang);

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
      speed: slowSpeech ? 0.9 : 1.0,
    });

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[OpenAI TTS] Error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
