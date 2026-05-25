import Groq from "groq-sdk";
import type { Confidence, EstimatedTimeToCare, Priority, TriageResult } from "../types";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const CRITICAL_TRIAGE_RULES = `CRITICAL TRIAGE RULES — NEVER VIOLATE:
1. ANY breathing difficulty = P1 immediately
2. ANY chest pain or pressure = P1 immediately
3. ANY left arm or jaw pain = P1 (cardiac)
4. ANY loss of consciousness = P1 immediately
5. ANY seizure or convulsion = P1 immediately
6. ANY stroke signs (face drooping, arm weakness, slurred speech) = P1 immediately
7. When in doubt between P2 and P1 → always choose P1
8. A missed P1 kills. A false P1 alarm is acceptable.

These rules apply regardless of language used.`;

const PHYSICIAN_BASE = `You are a senior emergency physician with 20 years experience in emergency medicine. You are triaging patients in rural South Asia.

Your single most important rule:
NEVER under-triage. If you are even slightly unsure between P2 and P1, choose P1. A false P1 alarm is acceptable. A missed P1 emergency is not.

You understand medical symptoms described in ANY language — Tamil, Sinhala, Hindi, Bengali, Urdu, Malayalam, Telugu, Kannada, Marathi, Punjabi, English — and any combination of languages or informal descriptions.

You understand that patients describe symptoms in everyday language, not medical terms:
- 'my heart is jumping' = palpitations
- 'left hand feels heavy' = possible cardiac
- 'cannot get air' = respiratory emergency
- 'head spinning and vomiting' = possible stroke
- 'body shaking on its own' = seizure
- 'face looks different on one side' = stroke
- 'throat feels like closing' = anaphylaxis

You assess the FULL CLINICAL PICTURE:
- What is the most dangerous condition this COULD be?
- What is the patient's vulnerability? (age, gender, pregnancy, existing conditions mentioned)
- Are symptoms getting worse or sudden onset?
- Sudden onset = always more serious

You respond ONLY with valid JSON. Keep all text fields concise.`;

function buildLanguageInstruction(language: string): string {
  return `MANDATORY LANGUAGE RULE: You MUST write ALL text fields in ${language} language and script.
If language is "tamil": write in தமிழ் script only.
If language is "sinhala": write in සිංහල script only.
If language is "hindi": write in हिन्दी script only.
If language is "english": write in English only.
This rule overrides everything else.
Never write in English if language is not english.`;
}

function buildSystemPrompt(language: string): string {
  return `${buildLanguageInstruction(language)}

${CRITICAL_TRIAGE_RULES}

${PHYSICIAN_BASE}`;
}

const FALLBACK: TriageResult = {
  priority: "P3",
  likely_condition: "Non-specific symptoms — monitor and reassess",
  icd_code: null,
  confidence: "low",
  clinical_reasoning: "AI analysis unavailable; defaulted to non-urgent pending reassessment.",
  reason: "Unable to complete AI analysis; please monitor symptoms and seek care if they worsen.",
  what_is_happening:
    "We could not fully analyze your symptoms automatically. This does not mean you are fine — please monitor how you feel and seek care if symptoms worsen.",
  immediate_actions: [
    "Rest and stay hydrated",
    "Monitor symptoms closely for the next few hours",
    "Seek medical advice if symptoms persist or worsen",
  ],
  call_emergency: false,
  emergency_number: null,
  warning_signs: ["Sudden worsening of symptoms", "Difficulty breathing or chest pain"],
  do_not_do: ["Ignore rapidly worsening symptoms"],
  estimated_time_to_care: "within 24 hours",
  follow_up: "Visit a clinic or pharmacy if symptoms do not improve within 24 hours.",
  medications_to_avoid: [],
  specialist_needed: null,
};

function buildUserMessage(params: {
  name: string;
  age: string;
  gender: string;
  location: string;
  language: string;
  transcript: string;
}): string {
  const { name, age, gender, location, language, transcript } = params;

  return `RESPOND IN ${language.toUpperCase()} LANGUAGE ONLY.
Every text field must be in ${language} script.

Patient symptoms: ${transcript}

Patient details:
- Name: ${name || "Unknown"}
- Age: ${age || "Unknown"}
- Gender: ${gender || "Unknown"}
- Location: ${location || "Unknown"}
- Language: ${language}

Respond with this exact JSON only:
{
  "priority": "P1" or "P2" or "P3",
  "likely_condition": "condition name in patient language",
  "confidence": "high" or "medium" or "low",
  "reason": "one sentence in patient language",
  "what_is_happening": "2 sentences max in patient language",
  "immediate_actions": ["action 1", "action 2", "action 3"],
  "call_emergency": true or false,
  "emergency_number": "1990" or null,
  "warning_signs": ["sign 1", "sign 2"],
  "do_not_do": ["item 1"],
  "estimated_time_to_care": "immediately" or "within 1 hour" or "within 4 hours" or "within 24 hours",
  "follow_up": "one sentence in patient language"
}

Use your full medical knowledge to assess this patient.
Trust the symptoms. When in doubt — escalate.`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeResult(parsed: Record<string, unknown>): TriageResult {
  const priority = (["P1", "P2", "P3"].includes(String(parsed.priority))
    ? parsed.priority
    : "P3") as Priority;

  const confidence = (["high", "medium", "low"].includes(String(parsed.confidence))
    ? parsed.confidence
    : "low") as Confidence;

  const timeOptions: EstimatedTimeToCare[] = [
    "immediately",
    "within 1 hour",
    "within 4 hours",
    "within 24 hours",
  ];
  const estimated = timeOptions.includes(parsed.estimated_time_to_care as EstimatedTimeToCare)
    ? (parsed.estimated_time_to_care as EstimatedTimeToCare)
    : priority === "P1"
      ? "immediately"
      : priority === "P2"
        ? "within 4 hours"
        : "within 24 hours";

  const emergencyNum =
    parsed.emergency_number === "1990" || parsed.emergency_number === "119"
      ? parsed.emergency_number
      : priority === "P1"
        ? "1990"
        : null;

  const reason = String(parsed.reason ?? "Triage assessment completed.");

  return {
    priority,
    likely_condition: String(parsed.likely_condition ?? "General symptom review"),
    icd_code: null,
    confidence,
    clinical_reasoning: reason,
    reason,
    what_is_happening: String(
      parsed.what_is_happening ?? "Your symptoms have been assessed. Follow the guidance below.",
    ),
    immediate_actions: Array.isArray(parsed.immediate_actions)
      ? parsed.immediate_actions.map(String).slice(0, 6)
      : FALLBACK.immediate_actions,
    call_emergency: Boolean(parsed.call_emergency ?? priority === "P1"),
    emergency_number: emergencyNum,
    warning_signs: Array.isArray(parsed.warning_signs)
      ? parsed.warning_signs.map(String)
      : FALLBACK.warning_signs,
    do_not_do: Array.isArray(parsed.do_not_do) ? parsed.do_not_do.map(String) : FALLBACK.do_not_do,
    estimated_time_to_care: estimated,
    follow_up: String(parsed.follow_up ?? FALLBACK.follow_up),
    medications_to_avoid: [],
    specialist_needed: null,
  };
}

async function callGroqOnce(
  client: Groq,
  language: string,
  userMessage: string,
  signal?: AbortSignal,
): Promise<TriageResult> {
  const response = await client.chat.completions.create(
    {
      model: GROQ_MODEL,
      max_tokens: 2048,
      temperature: 0.05,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(language) },
        { role: "user", content: userMessage },
      ],
    },
    signal ? { signal } : undefined,
  );

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("No text response from Groq");

  const parsed = extractJson(text) as Record<string, unknown>;
  return normalizeResult(parsed);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeWithGroq(params: {
  name: string;
  age: string;
  gender: string;
  location: string;
  language: string;
  transcript: string;
}): Promise<{ result: TriageResult; durationMs: number }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[triage] GROQ_API_KEY not set — using fallback P3");
    return { result: FALLBACK, durationMs: 0 };
  }

  const client = new Groq({ apiKey });
  const userMessage = buildUserMessage(params);

  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      try {
        const result = await callGroqOnce(
          client,
          params.language,
          userMessage,
          controller.signal,
        );
        return { result, durationMs: Date.now() - start };
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      lastError = err;
      if (attempt === 0) await sleep(500);
    }
  }

  console.error("[triage] Groq analysis failed after retry:", lastError);
  return { result: FALLBACK, durationMs: Date.now() - start };
}

export { FALLBACK as triageFallback };
