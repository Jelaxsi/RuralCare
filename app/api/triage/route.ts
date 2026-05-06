import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export type Priority = "P1" | "P2" | "P3";

export type CaseRecord = {
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

const P1_KEYWORDS = [
  "chest pain",
  "chest ache",
  "heart pain",
  "heart attack",
  "cannot breathe",
  "can't breathe",
  "not breathing",
  "trouble breathing",
  "difficulty breathing",
  "unconscious",
  "unresponsive",
  "severe bleeding",
  "stroke",
  "heart take",
  "good heart",
  "asian good",
  "மார்பு வலி",
  "சுவாசிக்கவில்லை",
  "மயக்கம்",
  "இரத்தப்போக்கு",
  "පපුව රිදෙනවා",
  "හුස්ම ගන්නේ නැහැ",
  "සිහිය නැහැ",
  "රුධිරය",
] as const;

const P2_KEYWORDS = [
  "fever",
  "vomiting",
  "injury",
  "accident",
  "fracture",
  "broken",
  "bleeding",
  "காய்ச்சல்",
  "வாந்தி",
  "காயம்",
  "விபத்து",
  "උණ",
  "වමනය",
  "තුවාලය",
  "අනතුර",
] as const;

const P3_KEYWORDS = [
  "mild pain",
  "headache",
  "rest",
  "சிறிய வலி",
  "தலைவலி",
  "සුළු වේදනාව",
  "හිසරදය",
] as const;

const STT_CORRECTIONS: ReadonlyArray<[string, string]> = [
  ["asian good", "chest pain"],
  ["heart take", "heart attack"],
  ["good heart", "chest pain"],
  ["can't breathe", "cannot breathe"],
];

const PHONETIC_VARIATIONS: Record<string, string[]> = {
  "chest pain": ["chess pain", "chaste pain", "test pain"],
  "heart attack": ["heart a tack", "hard attack", "heart take"],
  "cannot breathe": ["cannot breath", "can not breathe", "cant breathe"],
  stroke: ["strok", "struck"],
  unconscious: ["un conscious", "unconscience"],
  unresponsive: ["un responsive"],
};

function normalizeTranscript(raw: string): string {
  let text = raw.toLowerCase();
  for (const [wrong, fixed] of STT_CORRECTIONS) {
    text = text.replaceAll(wrong, fixed);
  }
  return text.replace(/[.,!?;:()[\]{}"\\/|-]/g, " ").replace(/\s+/g, " ").trim();
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function hasNearMatch(normalized: string, phrase: string): boolean {
  if (normalized.includes(phrase)) return true;

  const phraseWords = phrase.split(" ");
  const textWords = normalized.split(" ");
  const width = phraseWords.length;
  if (textWords.length < width) return false;

  for (let i = 0; i <= textWords.length - width; i++) {
    const windowPhrase = textWords.slice(i, i + width).join(" ");
    const threshold = Math.max(1, Math.floor(phrase.length * 0.2));
    if (editDistance(windowPhrase, phrase) <= threshold) {
      return true;
    }
  }
  return false;
}

function scoreTranscript(raw: string): { priority: Priority; reason: string; matched?: string } {
  const normalized = normalizeTranscript(raw);

  let p1Hits = 0;
  let p2Hits = 0;
  const matchedP1 = new Set<string>();
  const matchedP2 = new Set<string>();
  const matchedP3 = new Set<string>();

  for (const kw of P1_KEYWORDS) {
    const near =
      hasNearMatch(normalized, kw) ||
      (PHONETIC_VARIATIONS[kw]?.some((alt) => hasNearMatch(normalized, alt)) ?? false);
    if (near) {
      p1Hits += 1;
      matchedP1.add(kw);
    }
  }

  for (const kw of P2_KEYWORDS) {
    if (hasNearMatch(normalized, kw)) {
      p2Hits += 1;
      matchedP2.add(kw);
    }
  }

  for (const kw of P3_KEYWORDS) {
    if (hasNearMatch(normalized, kw)) {
      matchedP3.add(kw);
    }
  }

  const score = p1Hits * 10 + p2Hits * 5;
  const firstMatch = [...Array.from(matchedP1), ...Array.from(matchedP2)][0];

  if (score >= 10) {
    return {
      priority: "P1",
      matched: firstMatch,
      reason:
        matchedP1.size > 0
          ? "Critical symptom keywords detected (including speech-variation matching) — immediate response required."
          : "High-risk symptom score detected — immediate response required.",
    };
  }

  if (score >= 5) {
    return {
      priority: "P2",
      matched: firstMatch,
      reason:
        "Urgent symptom keywords detected by weighted scoring — priority follow-up recommended.",
    };
  }

  return {
    priority: "P3",
    reason:
      matchedP3.size > 0
        ? "Non-urgent symptom keywords detected — standard care guidance is appropriate."
        : raw.trim().length > 0
        ? "Routine triage cues — suitable for standard/non-urgent care routing."
        : "Limited complaint detail captured — routed as non-urgent pending fuller history.",
  };
}

async function readCases(): Promise<CaseRecord[]> {
  const raw = await fs.readFile(CASES_PATH, "utf8").catch(() => "[]");
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CaseRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeCases(next: CaseRecord[]) {
  await fs.writeFile(CASES_PATH, JSON.stringify(next, null, 2), "utf8");
}

export async function GET(req: Request) {
  const cases = await readCases();
  const { searchParams } = new URL(req.url);
  const priority = (searchParams.get("priority") ?? "").toUpperCase();
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();

  const filtered = cases.filter((c) => {
    if (priority && ["P1", "P2", "P3"].includes(priority) && c.priority !== priority) {
      return false;
    }
    if (search) {
      const hay = `${c.name} ${c.location}`.toLowerCase();
      return hay.includes(search);
    }
    return true;
  });
  filtered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return NextResponse.json(filtered);
}

type PostBody = {
  name?: string;
  location?: string;
  language?: string;
  transcript?: string;
  persist?: boolean;
};

export async function POST(req: Request) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const location = (body.location ?? "").trim();
  const language = (body.language ?? "").trim() || "English";
  const transcript = (body.transcript ?? "").trim();
  const persist = body.persist === true;

  if (!transcript && persist) {
    return NextResponse.json({ error: "Transcript required to save case" }, { status: 400 });
  }

  const { priority, reason } = scoreTranscript(transcript || "");

  if (!persist) {
    return NextResponse.json({ priority, reason });
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `case_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const record: CaseRecord = {
    id,
    name: name || "Unknown",
    location: location || "Unknown",
    language,
    transcript,
    priority,
    reason,
    timestamp: new Date().toISOString(),
  };

  const cases = await readCases();
  cases.push(record);
  await writeCases(cases);

  return NextResponse.json({ priority, reason, id });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const cases = await readCases();
  const next = cases.filter((c) => c.id !== id);

  if (next.length === cases.length) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  await writeCases(next);
  return NextResponse.json({ ok: true, id });
}
