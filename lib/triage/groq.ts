import Groq from "groq-sdk";
import { normalizeGroqLanguageInput } from "../i18n/speech-lang";
import type { Confidence, EstimatedTimeToCare, Priority, TriageResult } from "../types";

export const GROQ_MODEL = "llama-3.3-70b-versatile";

function normalizeGroqLanguage(language: string): string {
  return normalizeGroqLanguageInput(language);
}

export function buildSystemPrompt(language: string): string {
  const lang = normalizeGroqLanguage(language);

  return `You are an expert emergency medical triage AI for rural South Asia.

LANGUAGE: Detect input language automatically.
Respond ENTIRELY in: ${lang}.
ALL fields must be in ${lang} — never mix languages.

CRITICAL TRIAGE RULES — never violate:
- Difficulty breathing → ALWAYS P1
- Chest pain → ALWAYS P1
- Unconscious / not responding → ALWAYS P1
- Heavy bleeding → ALWAYS P1
- Suspected heart attack or stroke → ALWAYS P1
- Seizure → ALWAYS P1
- High fever in infant under 2 → P2 minimum
- When in doubt → higher priority, not lower
- NEVER return "unable to analyze" — always triage

PRIORITY LEVELS:
P1 = Life threatening, call emergency NOW
P2 = Urgent, see doctor within 2-4 hours
P3 = Non-urgent, monitor or clinic visit

Respond ONLY with valid JSON in this exact format:
{
  "priority": "P1" | "P2" | "P3",
  "reason": "one clear sentence summary in ${lang}",
  "what_is_happening": "explanation in ${lang}",
  "follow_up_care": "next steps in ${lang}",
  "medical_reasoning": "clinical reasoning in ${lang}",
  "call_emergency": true | false,
  "time_to_care": "immediate" | "2-4 hours" | "24 hours",
  "confidence": "high" | "medium" | "low"
}`;
}

type FallbackCopy = {
  likely_condition: string;
  reason: string;
  what_is_happening: string;
  follow_up: string;
  clinical_reasoning: string;
  immediate_actions: string[];
  warning_signs: string[];
  do_not_do: string[];
};

const FALLBACK_BY_LANG: Record<string, FallbackCopy> = {
  english: {
    likely_condition: "Symptoms under review",
    reason: "Symptoms noted. Please visit a clinic.",
    what_is_happening: "Your reported symptoms have been recorded for triage.",
    follow_up: "Visit a clinic within 24 hours.",
    clinical_reasoning: "Insufficient data for full analysis; monitor and seek care if worse.",
    immediate_actions: ["Rest and stay hydrated", "Monitor symptoms closely"],
    warning_signs: ["Sudden worsening of symptoms", "Difficulty breathing or chest pain"],
    do_not_do: ["Ignore rapidly worsening symptoms"],
  },
  tamil: {
    likely_condition: "அறிகுறிகள் மதிப்பீடு செய்யப்பட்டுள்ளன",
    reason: "அறிகுறிகள் பதிவு செய்யப்பட்டன. மருத்துவரை சந்தியுங்கள்.",
    what_is_happening: "நீங்கள் கூறிய அறிகுறிகள் பதிவு செய்யப்பட்டுள்ளன.",
    follow_up: "24 மணி நேரத்திற்குள் மருத்துவமனையைப் பாருங்கள்.",
    clinical_reasoning: "முழுமையான பகுப்பாய்வுக்கு போதுமான தகவல் இல்லை; கவனித்து மோசமானால் சிகிச்சை பெறுங்கள்.",
    immediate_actions: ["ஓய்வெடுத்து நீர்ப்பதிக்கவும்", "அறிகுறிகளை கவனமாக கண்காணிக்கவும்"],
    warning_signs: ["அறிகுறிகள் திடீரென மோசமாதல்", "மூச்சுத்திணறல் அல்லது மார்பு வலி"],
    do_not_do: ["மோசமான அறிகுறிகளை disregard செய்ய வேண்டாம்"],
  },
  sinhala: {
    likely_condition: "ලක්ෂණ සමාලෝචනය කර ඇත",
    reason: "රෝග ලක්ෂණ සටහන් කරන ලදී. වෛද්‍යවරයෙකු හමුවන්න.",
    what_is_happening: "ඔබ වාර්තා කළ ලක්ෂණ සටහන් කර ඇත.",
    follow_up: "24 පැය ඇතුළත වෛද්‍ය ශාලාවකට යන්න.",
    clinical_reasoning: "සම්පූර්ණ විශ්ලේෂණයට ප්‍රමාණවත් දත්ත නොමැත.",
    immediate_actions: ["විවේක ගෙන ජලය පානය කරන්න", "ලක්ෂණ හොඳින් නිරීක්ෂණය කරන්න"],
    warning_signs: ["ලක්ෂණ හදිසියේ උග්‍ර වීම", "හුස්ම ගැටලුව හෝ පපු වේදනාව"],
    do_not_do: ["ඉක්මනින් උග්‍ර වන ලක්ෂණ නොසලකා හරින්න"],
  },
  hindi: {
    likely_condition: "लक्षणों की समीक्षा की गई",
    reason: "लक्षण दर्ज किए गए। कृपया क्लिनिक जाएँ।",
    what_is_happening: "आपके बताए गए लक्षण ट्राइएज के लिए दर्ज किए गए हैं।",
    follow_up: "24 घंटे के भीतर क्लिनिक जाएँ।",
    clinical_reasoning: "पूर्ण विश्लेषण के लिए अपर्याप्त डेटा; निगरानी करें और बिगड़ने पर इलाज लें।",
    immediate_actions: ["आराम करें और हाइड्रेटेड रहें", "लक्षणों पर ध्यान दें"],
    warning_signs: ["लक्षणों का अचानक बिगड़ना", "सांस लेने में कठिनाई या सीने में दर्द"],
    do_not_do: ["तेजी से बिढ़ते लक्षणों को नज़रअंदाज़ न करें"],
  },
};

export function buildTriageFallback(transcript: string, language: string): TriageResult {
  const lang = normalizeGroqLanguage(language);
  const texts = FALLBACK_BY_LANG[lang] ?? FALLBACK_BY_LANG.english;

  return {
    priority: "P3",
    likely_condition: texts.likely_condition,
    icd_code: null,
    confidence: "low",
    clinical_reasoning: texts.clinical_reasoning,
    reason: texts.reason,
    what_is_happening: transcript.trim() || texts.what_is_happening,
    immediate_actions: texts.immediate_actions,
    call_emergency: false,
    emergency_number: null,
    warning_signs: texts.warning_signs,
    do_not_do: texts.do_not_do,
    estimated_time_to_care: "within 24 hours",
    follow_up: texts.follow_up,
    medications_to_avoid: [],
    specialist_needed: null,
  };
}

export const FALLBACK: TriageResult = buildTriageFallback("", "english");

export type GroqTriageParams = {
  name: string;
  age: string;
  gender: string;
  location: string;
  language: string;
  transcript: string;
};

export function buildUserMessage(params: GroqTriageParams): string {
  const { name, age, gender, location, language, transcript } = params;
  const lang = normalizeGroqLanguage(language);

  return `RESPOND IN ${lang.toUpperCase()} ONLY.
The patient symptoms below may be in Tamil, Sinhala, Hindi, or English — understand them regardless of language.
Respond in maximum 3 sentences. Be concise.

Patient symptoms: ${transcript}

Patient details:
- Name: ${name || "Unknown"}
- Age: ${age || "Unknown"}
- Gender: ${gender || "Unknown"}
- Location: ${location || "Unknown"}

Respond with this exact JSON only:
{
  "priority": "P1" or "P2" or "P3",
  "likely_condition": "short condition name",
  "confidence": "high" or "medium" or "low",
  "reason": "one sentence",
  "what_is_happening": "one sentence max",
  "immediate_actions": ["action 1", "action 2"],
  "call_emergency": true or false,
  "emergency_number": "1990" or null,
  "warning_signs": ["sign 1"],
  "do_not_do": ["item 1"],
  "estimated_time_to_care": "immediately" or "within 1 hour" or "within 4 hours" or "within 24 hours",
  "follow_up": "one sentence"
}`;
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty Groq response");
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(raw.slice(start, end + 1));
}

export function normalizeResult(parsed: Record<string, unknown>): TriageResult {
  const priority = (["P1", "P2", "P3"].includes(String(parsed.priority))
    ? parsed.priority
    : "P3") as Priority;

  const confidence = (["high", "medium", "low"].includes(String(parsed.confidence))
    ? parsed.confidence
    : "low") as Confidence;

  const timeRaw = String(parsed.time_to_care ?? parsed.estimated_time_to_care ?? "").toLowerCase();
  const timeMap: Record<string, EstimatedTimeToCare> = {
    immediate: "immediately",
    immediately: "immediately",
    "2-4 hours": "within 4 hours",
    "within 1 hour": "within 1 hour",
    "within 4 hours": "within 4 hours",
    "24 hours": "within 24 hours",
    "within 24 hours": "within 24 hours",
  };
  const estimated =
    timeMap[timeRaw] ??
    (priority === "P1" ? "immediately" : priority === "P2" ? "within 4 hours" : "within 24 hours");

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
    clinical_reasoning: String(parsed.clinical_reasoning ?? parsed.medical_reasoning ?? reason),
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
    follow_up: String(parsed.follow_up ?? parsed.follow_up_care ?? FALLBACK.follow_up),
    medications_to_avoid: [],
    specialist_needed: null,
  };
}

function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export async function createTriageCompletionStream(params: GroqTriageParams) {
  const client = getClient();
  if (!client) throw new Error("GROQ_API_KEY not configured");

  const language = normalizeGroqLanguage(params.language);

  return client.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 400,
    temperature: 0.1,
    stream: true,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(language) },
      { role: "user", content: buildUserMessage({ ...params, language }) },
    ],
  });
}

async function callGroqOnce(
  client: Groq,
  params: GroqTriageParams,
  signal?: AbortSignal,
): Promise<TriageResult> {
  const language = normalizeGroqLanguage(params.language);
  const userMessage = buildUserMessage({ ...params, language });

  const response = await client.chat.completions.create(
    {
      model: GROQ_MODEL,
      max_tokens: 400,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(language) },
        { role: "user", content: userMessage },
      ],
    },
    signal ? { signal } : undefined,
  );

  const text = response.choices[0]?.message?.content;
  if (!text?.trim()) throw new Error("No text response from Groq");

  const parsed = extractJson(text) as Record<string, unknown>;
  return normalizeResult(parsed);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeWithGroq(
  params: GroqTriageParams,
): Promise<{ result: TriageResult; durationMs: number }> {
  const client = getClient();
  const language = normalizeGroqLanguage(params.language);

  if (!client) {
    console.warn("[triage] GROQ_API_KEY not set — using fallback P3");
    return { result: buildTriageFallback(params.transcript, language), durationMs: 0 };
  }

  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);

      try {
        const result = await callGroqOnce(client, { ...params, language }, controller.signal);
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
  return { result: buildTriageFallback(params.transcript, language), durationMs: Date.now() - start };
}

export { FALLBACK as triageFallback };
