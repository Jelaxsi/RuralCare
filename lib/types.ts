export type Priority = "P1" | "P2" | "P3";
export type Confidence = "high" | "medium" | "low";
export type EstimatedTimeToCare =
  | "immediately"
  | "within 1 hour"
  | "within 4 hours"
  | "within 24 hours";

export type TriageResult = {
  priority: Priority;
  likely_condition: string;
  icd_code: string | null;
  confidence: Confidence;
  reason: string;
  what_is_happening: string;
  immediate_actions: string[];
  call_emergency: boolean;
  emergency_number: "1990" | "119" | null;
  warning_signs: string[];
  do_not_do: string[];
  estimated_time_to_care: EstimatedTimeToCare;
  follow_up: string;
  medications_to_avoid: string[];
  specialist_needed: string | null;
};

export type CaseRecord = TriageResult & {
  id: string;
  patientId: string;
  name: string;
  age?: string;
  gender?: string;
  location: string;
  ward?: string;
  language: string;
  chiefComplaint?: string;
  transcript: string;
  hospital: string;
  timestamp: string;
  resolved?: boolean;
  responseTimeMs?: number;
};

export type Shift = "morning" | "evening" | "night";
