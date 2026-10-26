import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Learning activities that can earn free AI credits. Amounts are enforced server-side. */
export const CREDIT_ACTIVITIES = {
  study_goal_completed: { label: "Daily study goal completed", credits: 5 },
  daily_task_completed: { label: "Study task checked off", credits: 2 },
  practice_questions: { label: "Practice question set finished", credits: 3 },
  quiz_completed: { label: "Quiz completed", credits: 4 },
  mock_test_completed: { label: "Mock test completed", credits: 10 },
  score_improved: { label: "Score improved over last attempt", credits: 8 },
  streak_milestone: { label: "Consistency streak milestone", credits: 6 },
  mistake_resolved: { label: "Mistake reviewed and fixed", credits: 3 },
} as const;

export type CreditActivity = keyof typeof CREDIT_ACTIVITIES;

export const DAILY_CREDIT_CAP = 60;

export const CLASS_LEVELS = [
  { value: "below_12", label: "Below Class 12" },
  { value: "class_12", label: "Class 12" },
  { value: "college", label: "College / University" },
  { value: "graduate", label: "Graduate / Working aspirant" },
] as const;

/** Entrance exams that unlock credits for students below Class 12. */
export const SCHOOL_ENTRANCE_TRACKS = [
  "JEE",
  "NEET",
  "CET",
  "CUET",
  "NTSE",
  "KVPY",
  "OLYMPIAD",
  "STATE_ENTRANCE",
  "NATIONAL_ENTRANCE",
] as const;

/** Competitive exams for Class 12 and above. */
export const COMPETITIVE_TRACKS = [
  "UPSC",
  "KPSC",
  "NEET_PG",
  "CAT",
  "GATE",
  "SSC",
  "BANKING",
  "OTHER",
] as const;

export const TRACK_LABELS: Record<string, string> = {
  JEE: "JEE (Main / Advanced)",
  NEET: "NEET UG",
  CET: "State CET",
  CUET: "CUET",
  NTSE: "NTSE",
  KVPY: "KVPY",
  OLYMPIAD: "Olympiads",
  STATE_ENTRANCE: "Other state-level entrance",
  NATIONAL_ENTRANCE: "Other national-level entrance",
  UPSC: "UPSC",
  KPSC: "KPSC / State PSC",
  NEET_PG: "NEET-PG",
  CAT: "CAT / MBA entrance",
  GATE: "GATE",
  SSC: "SSC",
  BANKING: "Banking exams",
  OTHER: "Other competitive exam",
};

export type AwardResult = {
  ok: boolean;
  reason?: string;
  amount?: number;
  balance?: number;
  earned_today?: number;
};

/**
 * Awards credits for a genuine learning activity.
 * `refKey` makes the award idempotent (e.g. a quiz attempt id or a date).
 */
export async function awardCredits(
  activity: CreditActivity,
  options?: { refKey?: string; description?: string; silent?: boolean },
): Promise<AwardResult> {
  const { data, error } = await supabase.rpc("award_learning_credits", {
    _activity: activity,
    _ref_key: options?.refKey ?? undefined,
    _description: options?.description ?? CREDIT_ACTIVITIES[activity].label,
  });

  if (error) return { ok: false, reason: error.message };

  const result = (data ?? { ok: false }) as AwardResult;
  if (result.ok && !options?.silent) {
    toast.success(`+${result.amount} learning credits earned`);
  }
  return result;
}

export async function spendCredits(amount: number, purpose: string) {
  const { data, error } = await supabase.rpc("spend_learning_credits", {
    _amount: amount,
    _purpose: purpose,
  });
  if (error) return { ok: false, reason: error.message };
  return (data ?? { ok: false }) as { ok: boolean; reason?: string; balance?: number };
}

export function isEligible(classLevel: string | null | undefined, track: string | null | undefined) {
  if (!classLevel) return false;
  if (classLevel !== "below_12") return true;
  return (SCHOOL_ENTRANCE_TRACKS as readonly string[]).includes((track ?? "").toUpperCase());
}
