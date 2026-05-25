import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  let text = "";
  try {
    const body = (await req.json()) as { text?: string };
    text = body.text ?? "";
  } catch {
    return NextResponse.json({ translation: text });
  }

  if (!text.trim()) {
    return NextResponse.json({ translation: text });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ translation: text });
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a translator. Translate the given text to English. Return ONLY the translated text, nothing else. Keep it concise and clear for text-to-speech.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const translation = completion.choices[0]?.message?.content?.trim();
    return NextResponse.json({ translation: translation ?? text });
  } catch {
    return NextResponse.json({ translation: text });
  }
}
