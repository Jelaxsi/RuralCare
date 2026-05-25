import { NextResponse } from "next/server";
import { addCase, deleteCase, readCases, updateCases } from "@/lib/cases/storage";
import { hospitalConfig } from "@/lib/hospital/config";
import { resolveEffectiveGroqLanguageFromInput } from "@/lib/i18n/speech-lang";
import {
  analyzeWithGroq,
  createTriageCompletionStream,
  extractJson,
  normalizeResult,
} from "@/lib/triage/groq";
import { checkRateLimit, getClientIp } from "@/lib/triage/rate-limit";
import { validateTriageInput } from "@/lib/triage/validation";
import type { CaseRecord, TriageResult } from "@/lib/types";

function logTriage(ip: string, priority: string, durationMs: number) {
  console.log(
    JSON.stringify({
      event: "triage_request",
      timestamp: new Date().toISOString(),
      ip: ip.slice(0, 20),
      priority,
      durationMs,
    }),
  );
}

export async function GET(req: Request) {
  try {
    const cases = await readCases();
    const { searchParams } = new URL(req.url);
    const priority = (searchParams.get("priority") ?? "").toUpperCase();
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const ward = (searchParams.get("ward") ?? "").trim().toLowerCase();
    const hospital = (searchParams.get("hospital") ?? "").trim().toLowerCase();

    const filtered = cases.filter((c) => {
      if (priority && ["P1", "P2", "P3"].includes(priority) && c.priority !== priority) {
        return false;
      }
      if (ward && !(c.ward ?? "").toLowerCase().includes(ward)) return false;
      if (hospital && !c.hospital.toLowerCase().includes(hospital)) return false;
      if (search) {
        const hay = `${c.name} ${c.location} ${c.patientId}`.toLowerCase();
        return hay.includes(search);
      }
      return true;
    });

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: "Failed to load cases" }, { status: 500 });
  }
}

type PostBody = {
  name?: string;
  location?: string;
  language?: string;
  transcript?: string;
  persist?: boolean;
  age?: string;
  gender?: string;
  ward?: string;
  chiefComplaint?: string;
  patientId?: string;
  triageResult?: TriageResult;
};

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 requests per minute." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } },
    );
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = validateTriageInput(body);
  const persist = body.persist === true;

  if (!input.transcript && persist) {
    return NextResponse.json({ error: "Transcript required to save case" }, { status: 400 });
  }

  if (!input.transcript && !persist) {
    return NextResponse.json({ error: "Transcript required for analysis" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const streamRequested = searchParams.get("stream") === "1";

  try {
    let triage: TriageResult;
    let durationMs = 0;

    if (persist && body.triageResult && body.triageResult.priority) {
      triage = body.triageResult;
    } else if (!persist && streamRequested) {
      const groqLanguage = resolveEffectiveGroqLanguageFromInput(
        input.language,
        input.transcript,
      );
      const encoder = new TextEncoder();
      const groqParams = {
        name: input.name,
        age: input.age,
        gender: input.gender,
        location: input.location,
        language: groqLanguage,
        transcript: input.transcript,
      };

      const readable = new ReadableStream({
        async start(controller) {
          const start = Date.now();
          let full = "";

          try {
            const stream = await createTriageCompletionStream(groqParams);

            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content ?? "";
              if (!text) continue;
              full += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "delta", content: text })}\n\n`),
              );
            }

            const parsed = extractJson(full) as Record<string, unknown>;
            const result = normalizeResult(parsed);
            durationMs = Date.now() - start;
            logTriage(ip, result.priority, durationMs);

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "done", result, durationMs })}\n\n`,
              ),
            );
            controller.close();
          } catch (err) {
            console.error("[triage] stream error:", err);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", message: "Triage analysis failed" })}\n\n`,
              ),
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    } else {
      const groqLanguage = resolveEffectiveGroqLanguageFromInput(
        input.language,
        input.transcript,
      );
      const analysis = await analyzeWithGroq({
        name: input.name,
        age: input.age,
        gender: input.gender,
        location: input.location,
        language: groqLanguage,
        transcript: input.transcript,
      });
      triage = analysis.result;
      durationMs = analysis.durationMs;
    }

    logTriage(ip, triage.priority, durationMs);

    if (!persist) {
      return NextResponse.json({ ...triage, responseTimeMs: durationMs });
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `case_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const record: CaseRecord = {
      id,
      patientId: input.patientId || id.slice(0, 8).toUpperCase(),
      name: input.name || "Unknown",
      age: input.age || undefined,
      gender: input.gender || undefined,
      location: input.location || "Unknown",
      ward: input.ward || undefined,
      language: input.language,
      chiefComplaint: input.chiefComplaint || undefined,
      transcript: input.transcript,
      hospital: hospitalConfig.name,
      ...triage,
      timestamp: new Date().toISOString(),
      resolved: false,
      responseTimeMs: durationMs,
    };

    await addCase(record);
    return NextResponse.json({ ...triage, id, patientId: record.patientId, responseTimeMs: durationMs });
  } catch (err) {
    console.error("[triage] POST error:", err);
    return NextResponse.json({ error: "Triage analysis failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { ids?: string[]; resolved?: boolean };
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }
    const updated = await updateCases(ids, { resolved: body.resolved ?? true });
    return NextResponse.json({ ok: true, updated });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const removed = await deleteCase(id);
  if (!removed) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id });
}
