const MAX_TRANSCRIPT = 2000;
const MAX_NAME = 200;
const MAX_LOCATION = 300;

export function sanitizeText(input: unknown, maxLen: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLen);
}

export function validateTriageInput(body: {
  name?: unknown;
  location?: unknown;
  language?: unknown;
  transcript?: unknown;
  age?: unknown;
  gender?: unknown;
  ward?: unknown;
  chiefComplaint?: unknown;
  patientId?: unknown;
}) {
  const transcript = sanitizeText(body.transcript, MAX_TRANSCRIPT);
  const name = sanitizeText(body.name, MAX_NAME);
  const location = sanitizeText(body.location, MAX_LOCATION);
  const language = sanitizeText(body.language, 50) || "English";
  const age = sanitizeText(body.age, 10);
  const gender = sanitizeText(body.gender, 30);
  const ward = sanitizeText(body.ward, 100);
  const chiefComplaint = sanitizeText(body.chiefComplaint, 500);
  const patientId = sanitizeText(body.patientId, 64);

  return { transcript, name, location, language, age, gender, ward, chiefComplaint, patientId };
}

export { MAX_TRANSCRIPT };
