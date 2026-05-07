import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export type Priority = "P1" | "P2" | "P3";
export type Confidence = "high" | "medium" | "low";

export type CaseRecord = {
  id: string;
  name: string;
  location: string;
  language: string;
  transcript: string;
  priority: Priority;
  reason: string;
  likely_condition?: string;
  first_aid_specific?: string;
  call_emergency?: boolean;
  confidence?: Confidence;
  timestamp: string;
};

const CASES_PATH = path.join(process.cwd(), "cases.json");

type SymptomPattern = {
  id: string;
  priority: Priority;
  category: string;
  condition: string;
  reason: string;
  firstAid: string;
  phrases: readonly string[];
};

const SYMPTOM_PATTERNS: readonly SymptomPattern[] = [
  {
    id: "cardiac",
    priority: "P1",
    category: "cardiac",
    condition: "Possible cardiac event (heart attack)",
    reason: "Cardiac danger symptoms detected.",
    firstAid:
      "Do not let the patient exert themselves. Sit them down, loosen tight clothing, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119. If conscious and not allergic, aspirin 300mg may be chewed.",
    phrases: [
      "chest tightness",
      "chest pressure",
      "chest discomfort",
      "left arm pain",
      "jaw pain",
      "sweating with chest pain",
      "heart racing",
      "palpitations",
      "irregular heartbeat",
      "pulse very fast",
      "pulse very slow",
      "heart flutter",
      "மார்பு இறுக்கம்",
      "மார்பு அழுத்தம்",
      "இடது கை வலி",
      "வியர்வை",
      "පපුව තද වෙනවා",
      "පපුව පීඩනය",
      "වම් අත රිදෙනවා",
      "දහදිය දානවා",
    ],
  },
  {
    id: "respiratory",
    priority: "P1",
    category: "respiratory",
    condition: "Possible severe respiratory distress",
    reason: "Severe breathing compromise detected.",
    firstAid:
      "Keep airway open, sit patient upright, remove constricting clothing, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    phrases: [
      "cannot breathe",
      "short of breath",
      "breathless",
      "wheezing badly",
      "gasping",
      "lips turning blue",
      "face turning blue",
      "fingertips blue",
      "suffocating",
      "choking",
      "airway blocked",
      "மூச்சுத் திணறல்",
      "හුස්ම ගන්න අමාරුයි",
    ],
  },
  {
    id: "neurological",
    priority: "P1",
    category: "neuro",
    condition: "Possible stroke or acute neurological emergency",
    reason: "Critical neurological warning signs detected.",
    firstAid:
      "Lay the patient on their side if drowsy, do not give food or drink, monitor breathing, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    phrases: [
      "sudden severe headache",
      "worst headache of life",
      "face drooping",
      "arm weakness",
      "speech slurred",
      "confused suddenly",
      "cannot speak",
      "vision suddenly lost",
      "one side weak",
      "sudden numbness",
      "seizure",
      "convulsing",
      "fitting",
      "shaking uncontrollably",
      "loss of consciousness",
      "fainted",
      "collapsed",
      "not waking up",
      "unresponsive",
      "திடீர் தலைவலி",
      "முகம் தொங்குகிறது",
      "பேச்சு குழறுகிறது",
      "வலிப்பு",
      "சுயநினைவு இல்லை",
      "හදිසි හිසරදය",
      "මුහුණ ඇද වැටෙනවා",
      "කතා කරන්න බැහැ",
      "කැක්කුම",
      "සිහිය නැති වෙනවා",
    ],
  },
  {
    id: "trauma",
    priority: "P1",
    category: "trauma",
    condition: "Severe hemorrhage or major trauma",
    reason: "Major trauma or uncontrolled bleeding pattern detected.",
    firstAid:
      "Apply direct pressure to bleeding wounds, avoid moving the patient unless unsafe, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    phrases: [
      "severe bleeding",
      "bleeding won't stop",
      "blood everywhere",
      "deep wound",
      "impaled",
      "stab",
      "shot",
      "hit by vehicle",
      "fell from height",
      "head injury with confusion",
    ],
  },
  {
    id: "allergic",
    priority: "P1",
    category: "allergy",
    condition: "Possible anaphylaxis (severe allergic reaction)",
    reason: "Severe allergic airway symptoms detected.",
    firstAid:
      "If available, use an adrenaline auto-injector immediately. Keep patient lying flat with legs raised unless breathing is difficult, then sit upright. Call emergency services now: Ambulance 1990, Fire & Rescue 110, Police 119.",
    phrases: [
      "throat swelling",
      "tongue swelling",
      "cannot swallow",
      "full body rash with breathing difficulty",
      "anaphylaxis",
      "bee sting with swelling",
    ],
  },
  {
    id: "diabetic_emergency",
    priority: "P1",
    category: "diabetic",
    condition: "Diabetic emergency",
    reason: "High-risk diabetic emergency signs detected.",
    firstAid:
      "If awake and able to swallow, give fast-acting sugar (glucose, juice, sugar water). If drowsy or unconscious, do not give oral fluids and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    phrases: ["blood sugar very low", "hypoglycemia", "shaking and confused", "diabetic emergency"],
  },
  {
    id: "obstetric",
    priority: "P1",
    category: "obstetric",
    condition: "Obstetric emergency",
    reason: "High-risk pregnancy/labour emergency detected.",
    firstAid:
      "Keep the mother lying on her left side if possible, prepare clean cloths, avoid unnecessary movement, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    phrases: ["labour pain", "water broke", "baby coming", "heavy bleeding pregnant", "pregnancy bleeding"],
  },
  {
    id: "urgent_fever",
    priority: "P2",
    category: "infection",
    condition: "Possible severe infection",
    reason: "Urgent fever/infection pattern detected.",
    firstAid:
      "Encourage fluids in small sips, monitor temperature, and seek medical care within 2-4 hours.",
    phrases: ["high fever above 38", "high fever", "fever and stiff neck"],
  },
  {
    id: "urgent_gi",
    priority: "P2",
    category: "gastro",
    condition: "Dehydration risk from vomiting",
    reason: "Persistent vomiting/dehydration risk detected.",
    firstAid:
      "Give small frequent sips of oral rehydration solution or water, avoid solid food temporarily, and seek urgent care within 2-4 hours.",
    phrases: ["persistent vomiting", "cannot keep water down", "severe abdominal pain", "pain in stomach"],
  },
  {
    id: "urgent_injury",
    priority: "P2",
    category: "injury",
    condition: "Urgent injury requiring medical evaluation",
    reason: "Potential fracture, bite, or deep injury detected.",
    firstAid:
      "Immobilize injured areas, clean visible wounds gently, and attend a clinic/hospital within 2-4 hours.",
    phrases: [
      "suspected fracture",
      "bone may be broken",
      "deep cut needing stitches",
      "animal bite",
      "snake bite",
      "dog bite",
      "eye injury",
      "ear pain severe",
      "urinary pain severe",
      "burning urination",
      "child not eating for 2 days",
      "elderly fallen",
      "mental health crisis",
      "suicidal thoughts",
      "severe anxiety attack",
      "panic attack",
      "காய்ச்சல் கழுத்து வலிப்பு",
      "උණ බෙල්ල තද",
    ],
  },
  {
    id: "non_urgent_common",
    priority: "P3",
    category: "minor",
    condition: "Likely minor self-limiting illness",
    reason: "Non-urgent symptom pattern detected.",
    firstAid:
      "Rest, maintain hydration, and use pharmacy-level supportive care. Seek re-triage if symptoms worsen.",
    phrases: [
      "mild fever",
      "slight temperature",
      "runny nose",
      "common cold",
      "cough",
      "sore throat",
      "mild headache",
      "mild body ache",
      "skin rash not spreading",
      "minor cut",
      "constipation",
      "mild diarrhea",
      "tiredness",
      "fatigue",
      "insomnia",
      "mild stomach ache",
      "indigestion",
      "heartburn",
      "தலைசுற்றல்",
      "හිස කරකැවිල්ල",
    ],
  },
] as const;

const STT_CORRECTIONS: ReadonlyArray<[string, string]> = [
  ["asian good", "chest pain"],
  ["heart take", "heart attack"],
  ["good heart", "chest pain"],
  ["can't breathe", "cannot breathe"],
  ["cant breathe", "cannot breathe"],
  ["shortness of breath", "short of breath"],
  ["passed out", "fainted"],
];

const PHONETIC_VARIATIONS: Record<string, string[]> = {
  "chest tightness": ["chest tightnes", "chest titeness"],
  "chest pressure": ["chest presure"],
  "heart attack": ["heart a tack", "hard attack", "heart take"],
  "cannot breathe": ["cannot breath", "can not breathe", "cant breathe"],
  stroke: ["strok", "struck"],
  unconscious: ["un conscious", "unconscience", "not conscious"],
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
  if (/[^\u0000-\u007f]/.test(phrase)) return false;

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

function priorityToLevel(priority: Priority): number {
  return priority === "P1" ? 3 : priority === "P2" ? 2 : 1;
}

function levelToPriority(level: number): Priority {
  if (level >= 3) return "P1";
  if (level === 2) return "P2";
  return "P3";
}

function analyzeTranscript(raw: string): {
  priority: Priority;
  likely_condition: string;
  reason: string;
  first_aid_specific: string;
  call_emergency: boolean;
  confidence: Confidence;
} {
  const normalized = normalizeTranscript(raw);
  const hits = SYMPTOM_PATTERNS.filter((pattern) =>
    pattern.phrases.some((phrase) => {
      if (hasNearMatch(normalized, phrase)) return true;
      return PHONETIC_VARIATIONS[phrase]?.some((alt) => hasNearMatch(normalized, alt)) ?? false;
    }),
  );

  const has = (phrases: string[]) => phrases.some((phrase) => hasNearMatch(normalized, phrase));

  const combinations = [
    {
      when:
        has(["chest tightness", "chest pressure", "chest discomfort", "chest pain"]) &&
        has(["sweating with chest pain", "sweating", "வியர்வை", "දහදිය දානවා"]),
      priority: "P1" as Priority,
      condition: "Possible cardiac event (heart attack)",
      reason: "Chest pain/tightness with sweating detected - high-risk cardiac pattern.",
      firstAid:
        "Keep patient at rest, seated upright, loosen clothing, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119. Aspirin 300mg can be chewed if not allergic.",
    },
    {
      when:
        has(["headache", "sudden severe headache", "worst headache of life"]) &&
        has(["vomiting", "persistent vomiting"]) &&
        has(["fever", "high fever", "fever and stiff neck"]),
      priority: "P1" as Priority,
      condition: "Possible meningitis",
      reason: "Headache, fever, and vomiting combination suggests possible meningitis.",
      firstAid:
        "Keep patient in a quiet dark environment, do not delay transfer, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    },
    {
      when: has(["fever and stiff neck", "high fever"]) && has(["stiff neck", "காய்ச்சல் கழுத்து வலிப்பு", "උණ බෙල්ල තද"]),
      priority: "P1" as Priority,
      condition: "Possible meningitis",
      reason: "Fever with stiff neck detected - possible meningitis.",
      firstAid:
        "Urgent emergency transfer is required. Keep hydrated only if fully conscious and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    },
    {
      when: has(["short of breath", "breathless", "மூச்சுத் திணறல்", "හුස්ම ගන්න අමාරුයි"]) && has(["chest tightness", "chest pressure", "chest pain"]),
      priority: "P1" as Priority,
      condition: "Possible cardiac-respiratory emergency",
      reason: "Breathlessness with chest pain indicates possible heart attack or pulmonary emergency.",
      firstAid:
        "Sit patient upright, loosen tight clothes, monitor breathing, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    },
    {
      when: has(["sudden severe headache", "திடீர் தலைவலி", "හදිසි හිසරදය"]) && has(["vision suddenly lost", "cannot speak", "arm weakness", "முகம் தொங்குகிறது", "මුහුණ ඇද වැටෙනවා"]),
      priority: "P1" as Priority,
      condition: "Possible stroke",
      reason: "Sudden neurological deficit pattern indicates likely stroke.",
      firstAid:
        "Do not give food or fluids. Note symptom start time and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    },
    {
      when: has(["fever", "high fever"]) && has(["confused suddenly", "confusion", "unresponsive"]),
      priority: "P1" as Priority,
      condition: "Possible severe infection with altered consciousness",
      reason: "Fever with confusion indicates potential serious systemic infection.",
      firstAid:
        "Keep airway clear, monitor responsiveness closely, and call emergency services immediately: Ambulance 1990, Fire & Rescue 110, Police 119.",
    },
    {
      when: has(["vomiting", "persistent vomiting"]) && has(["cannot keep water down"]),
      priority: "P2" as Priority,
      condition: "Dehydration risk from persistent vomiting",
      reason: "Vomiting with inability to retain fluids detected.",
      firstAid: "Give very small oral rehydration sips frequently and seek care within 2-4 hours.",
    },
  ].filter((combo) => combo.when);

  const severeModifiers = [
    "severe",
    "extreme",
    "worst ever",
    "worst headache of life",
    "sudden",
    "cannot",
    "very",
  ].filter((term) => hasNearMatch(normalized, term)).length;
  const mildModifiers = ["mild", "slight", "little", "minor"].filter((term) =>
    hasNearMatch(normalized, term),
  ).length;

  const vulnerableTerms = [
    "baby",
    "infant",
    "newborn",
    "child",
    "elderly",
    "pregnant",
    "diabetic",
  ].filter((term) => hasNearMatch(normalized, term)).length;

  const topHit = hits[0];
  const topCombo = combinations[0];
  let level = topCombo
    ? priorityToLevel(topCombo.priority)
    : topHit
      ? priorityToLevel(topHit.priority)
      : 1;

  if (severeModifiers > 0 && level < 3) level += 1;
  if (vulnerableTerms > 0 && level < 3) level += 1;
  if (!topCombo && severeModifiers === 0 && mildModifiers > 0 && level > 1) level -= 1;

  const priority = levelToPriority(level);
  const likely_condition =
    topCombo?.condition ??
    topHit?.condition ??
    (raw.trim().length > 0
      ? "Non-specific symptoms - monitor and reassess"
      : "Insufficient symptom information");
  const reason =
    topCombo?.reason ??
    topHit?.reason ??
    (raw.trim().length > 0
      ? "No high-risk combination detected; routed as non-urgent with safety-net advice."
      : "Limited complaint detail captured; defaulted to non-urgent pending fuller history.");
  const first_aid_specific =
    topCombo?.firstAid ??
    topHit?.firstAid ??
    "Keep patient at rest, monitor symptoms closely, and seek nearby medical advice if symptoms persist or worsen.";
  const call_emergency = priority === "P1";

  const confidence: Confidence =
    combinations.length > 0 || hits.length >= 2
      ? "high"
      : hits.length === 1 || severeModifiers > 0 || vulnerableTerms > 0
        ? "medium"
        : "low";

  return { priority, likely_condition, reason, first_aid_specific, call_emergency, confidence };
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

  const triage = analyzeTranscript(transcript || "");

  if (!persist) {
    return NextResponse.json(triage);
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
    priority: triage.priority,
    reason: triage.reason,
    likely_condition: triage.likely_condition,
    first_aid_specific: triage.first_aid_specific,
    call_emergency: triage.call_emergency,
    confidence: triage.confidence,
    timestamp: new Date().toISOString(),
  };

  const cases = await readCases();
  cases.push(record);
  await writeCases(cases);

  return NextResponse.json({ ...triage, id });
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
