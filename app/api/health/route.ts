import { NextResponse } from "next/server";

export async function GET() {
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  return NextResponse.json({
    status: hasGroq ? "online" : "degraded",
    services: {
      triage: hasGroq ? "online" : "offline",
      storage: hasKv ? "online" : "local",
      tts: Boolean(process.env.NEXT_PUBLIC_VALSEA_API_KEY) ? "online" : "fallback",
    },
    timestamp: new Date().toISOString(),
  });
}
