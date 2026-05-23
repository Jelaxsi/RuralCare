import Groq from "groq-sdk";
import { applySafetyOverride } from "./safety";
import type { Confidence, EstimatedTimeToCare, Priority, TriageResult } from "../types";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are an emergency medical triage AI for rural South Asia. You MUST follow these rules strictly:

CRITICAL RULE: When in doubt, always go HIGHER priority.
It is better to over-triage than under-triage.
A missed emergency can kill. A false alarm cannot.

P1 - IMMEDIATELY LIFE THREATENING (call 1990 now):
ANY of these = automatic P1, no exceptions:
- Breathing difficulty, cannot breathe, shortness of breath, breathless, chest tightness
- Chest pain, chest pressure, chest discomfort
- Left arm pain, left hand pain, jaw pain, shoulder pain with sweating
- Heart racing, palpitations, irregular heartbeat
- Face drooping, arm weakness, slurred speech, sudden confusion (stroke signs)
- Unconscious, unresponsive, collapsed, fainted
- Severe bleeding that won't stop
- Seizure, convulsions, fitting
- Throat swelling, tongue swelling, anaphylaxis
- Baby not breathing, child unconscious
- Severe head injury
- Suspected poisoning or overdose

P2 - URGENT (hospital within 2 hours):
- High fever above 38C
- Vomiting blood
- Severe abdominal pain
- Suspected fracture or broken bone
- Deep wound needing stitches
- Snake bite, animal bite
- Child with high fever
- Elderly person who has fallen
- Severe headache (not worst of life)
- Urinary retention, cannot urinate

P3 - NON URGENT (pharmacy or clinic tomorrow):
- Common cold, runny nose
- Mild headache
- Mild fever below 38C
- Sore throat
- Minor cuts
- Constipation
- Mild stomach ache

IMPORTANT:
- 'cannot breathe' = P1 always
- 'left hand pain' = P1 always (heart attack sign)
- 'chest pain' = P1 always
- Any combination of 2+ symptoms = upgrade priority
- Elderly or child = upgrade priority by one level
- Pregnant woman with any pain = P2 minimum

You must understand symptoms described in ANY language including Tamil, Sinhala, Hindi, Bengali, Urdu and all South Asian languages. Translate mentally then assess.

Always respond ONLY with valid JSON.`;

const FALLBACK: TriageResult = {
  priority: "P3",
  likely_condition: "Non-specific symptoms — monitor and reassess",
  icd_code: null,
  confidence: "low",
  reason: "Unable to complete AI analysis; defaulted to non-urgent with safety-net advice.",
  what_is_happening:
    "We could not fully analyze your symptoms automatically. This does not mean you are fine — please monitor how you feel and seek care if symptoms worsen.",
  immediate_actions: [
    "Rest and stay hydrated",
    "Monitor symptoms closely for the next few hours",
    "Seek medical advice if symptoms persist or worsen",
    "Return for re-triage if new symptoms develop",
  ],
  call_emergency: false,
  emergency_number: null,
  warning_signs: ["Sudden worsening of symptoms", "Difficulty breathing or chest pain"],
  do_not_do: ["Ignore rapidly worsening symptoms", "Self-medicate without professional advice"],
  estimated_time_to_care: "within 24 hours",
  follow_up: "Visit a clinic or pharmacy if symptoms do not improve within 24 hours.",
  medications_to_avoid: [],
  specialist_needed: null,
};

function languageScriptHint(language: string): string {
  const l = language.toLowerCase();
  if (l.includes("tamil")) return "If language is Tamil: write in Tamil script தமிழ்";
  if (l.includes("sinhala")) return "If language is Sinhala: write in Sinhala script සිංහල";
  if (l.includes("hindi")) return "If language is Hindi: write in Hindi script हिंदी";
  if (l.includes("bengali")) return "If language is Bengali: write in Bengali script বাংলা";
  if (l.includes("urdu")) return "If language is Urdu: write in Urdu script اردو";
  if (l.includes("malayalam")) return "If language is Malayalam: write in Malayalam script മലയാളം";
  if (l.includes("telugu")) return "If language is Telugu: write in Telugu script తెలుగు";
  if (l.includes("kannada")) return "If language is Kannada: write in Kannada script ಕನ್ನಡ";
  if (l.includes("marathi")) return "If language is Marathi: write in Marathi script मराठी";
  if (l.includes("punjabi")) return "If language is Punjabi: write in Gurmukhi script ਪੰਜਾਬੀ";
  return "If language is English: write in English";
}

function buildUserMessage(params: {
  name: string;
  age: string;
  gender: string;
  location: string;
  language: string;
  transcript: string;
}): string {
  const { name, age, gender, location, language, transcript } = params;
  const scriptHint = languageScriptHint(language);

  return `IMPORTANT: The patient's language is ${language}.
You must write ALL text fields in the response (likely_condition, reason, what_is_happening, immediate_actions, warning_signs, do_not_do, follow_up, medications_to_avoid, specialist_needed) in ${language}.

${scriptHint}
(same rule for all other languages — use native script, not English)

Patient: ${name || "Unknown"}
Age: ${age || "Unknown"}
Gender: ${gender || "Unknown"}
Location: ${location || "Unknown"}
Language: ${language}
Symptoms: ${transcript}

Respond ONLY with this JSON:
{
  "priority": "P1"|"P2"|"P3",
  "likely_condition": "specific condition name",
  "icd_code": "ICD-10 code if applicable",
  "confidence": "high"|"medium"|"low",
  "reason": "one sentence triage reasoning",
  "what_is_happening": "2-3 sentences plain language body explanation",
  "immediate_actions": ["step 1","step 2","step 3","step 4"],
  "call_emergency": true|false,
  "emergency_number": "1990"|"119"|null,
  "warning_signs": ["sign 1","sign 2"],
  "do_not_do": ["action 1","action 2"],
  "estimated_time_to_care": "immediately"|"within 1 hour"|"within 4 hours"|"within 24 hours",
  "follow_up": "what the patient should do after initial care",
  "medications_to_avoid": ["medication 1"] or [],
  "specialist_needed": "type of specialist if needed or null"
}`;
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

  return {
    priority,
    likely_condition: String(parsed.likely_condition ?? "General symptom review"),
    icd_code: parsed.icd_code ? String(parsed.icd_code) : null,
    confidence,
    reason: String(parsed.reason ?? "Triage assessment completed."),
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
    medications_to_avoid: Array.isArray(parsed.medications_to_avoid)
      ? parsed.medications_to_avoid.map(String)
      : [],
    specialist_needed: parsed.specialist_needed ? String(parsed.specialist_needed) : null,
  };
}

async function callGroqOnce(
  client: Groq,
  userMessage: string,
  signal?: AbortSignal,
): Promise<TriageResult> {
  const response = await client.chat.completions.create(
    {
      model: GROQ_MODEL,
      max_tokens: 1024,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
    const safe = applySafetyOverride(FALLBACK, params.transcript);
    return { result: safe, durationMs: 0 };
  }

  const client = new Groq({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
  const userMessage = buildUserMessage(params);

  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      try {
        let result = await callGroqOnce(client, userMessage, controller.signal);
        result = applySafetyOverride(result, params.transcript);
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
  const safe = applySafetyOverride(FALLBACK, params.transcript);
  return { result: safe, durationMs: Date.now() - start };
}

export async function translateWithGroq(text: string, language: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !text.trim()) return text;

  try {
    const client = new Groq({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 512,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: `Translate this medical triage message to ${language}. Keep it simple, calm and clear. Return ONLY the translated text, nothing else:\n\n${text}`,
        },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || text;
  } catch {
    return text;
  }
}

export { FALLBACK as triageFallback };
