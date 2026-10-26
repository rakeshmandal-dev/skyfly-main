import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getDefaultAIModel, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type AiTask = { subject: string; title: string; duration_minutes: number };
type AiDay = { date: string; tasks: AiTask[] };

function nextSevenDates(): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/**
 * Builds a 7-day AI study plan from the student's real quiz history, daily
 * goal and existing planner items, then stores it as `type: 'ai'` planner items
 * (replacing any earlier AI items for those same dates).
 */
export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const dates = nextSevenDates();
    const from = dates[0]!;
    const to = dates[dates.length - 1]!;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [attemptsRes, goalRes, itemsRes, moodRes] = await Promise.all([
      supabase
        .from("quiz_attempts")
        .select("subject, topic, score, total, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("study_goals")
        .select("daily_goal_minutes, studied_today_minutes")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("planner_items")
        .select("title, date, type, subject, duration_minutes")
        .eq("user_id", userId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true }),
      // AI Mentor conversations quietly log a mood (low/neutral/good) — the
      // planner reads today's most recent one to go easier when needed.
      supabase
        .from("mood_logs")
        .select("mood, created_at")
        .eq("user_id", userId)
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const todayMoodLow = moodRes.data?.mood === "low";

    const attempts = (attemptsRes.data ?? []).map((a) => ({
      subject: a.subject,
      topic: a.topic,
      score: a.score,
      total: a.total,
      accuracy_percent: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
      date: a.created_at.slice(0, 10),
    }));

    const baseDailyGoalMinutes = goalRes.data?.daily_goal_minutes ?? 60;
    const dailyGoalMinutes = todayMoodLow
      ? Math.max(15, Math.round(baseDailyGoalMinutes * 0.7))
      : baseDailyGoalMinutes;
    const existingItems = itemsRes.data ?? [];

    const model = getDefaultAIModel();

    const prompt = [
      "Build a personalised 7-day study plan for this student.",
      "",
      `Dates to plan (use exactly these): ${JSON.stringify(dates)}`,
      `Daily study goal (minutes, rough time budget per day): ${dailyGoalMinutes}`,
      `Minutes studied today so far: ${goalRes.data?.studied_today_minutes ?? 0}`,
      "",
      "Recent quiz attempts (most recent first):",
      JSON.stringify(attempts),
      "",
      "Already scheduled planner items for these dates (do not duplicate them):",
      JSON.stringify(existingItems),
      "",
      "Rules:",
      "- Prioritise subjects where quiz accuracy is lowest; give them more time and more days.",
      "- 2 to 4 tasks per day. Total duration per day should stay close to the daily goal minutes.",
      "- Task titles must be short, concrete and actionable (max 60 characters).",
      "- If there is no quiz history, build a balanced plan across common core subjects.",
      ...(todayMoodLow
        ? [
            "- The student has been feeling low/stressed today: keep TODAY's plan lighter — fewer, shorter, easier tasks — and include one short task explicitly meant as a break or light revision only (not new hard material).",
          ]
        : []),
      "",
      'Respond with JSON only, no prose and no markdown, in exactly this shape: {"days":[{"date":"YYYY-MM-DD","tasks":[{"subject":"string","title":"string","duration_minutes":30}]}]}',
    ].join("\n");

    const result = streamText({
      model,
      system:
        "You are an expert study coach. You reply with valid JSON only — never markdown, never explanations.",
      prompt,
    });
    const text = await result.text;

    const parsed = extractJson(text) as { days?: AiDay[] } | null;
    const days = Array.isArray(parsed?.days) ? parsed.days : [];
    const allowed = new Set(dates);

    const rows = days
      .filter((d) => d && allowed.has(d.date) && Array.isArray(d.tasks))
      .flatMap((d) =>
        d.tasks.slice(0, 4).map((t) => ({
          user_id: userId,
          title: String(t?.title ?? "").slice(0, 120),
          date: d.date,
          type: "ai",
          subject: t?.subject ? String(t.subject).slice(0, 60) : null,
          duration_minutes: Math.min(240, Math.max(5, Number(t?.duration_minutes) || 30)),
        })),
      )
      .filter((r) => r.title.length > 0);

    if (rows.length === 0) {
      throw new Error("The AI could not build a plan right now. Please try again.");
    }

    const { error: delError } = await supabase
      .from("planner_items")
      .delete()
      .eq("user_id", userId)
      .eq("type", "ai")
      .gte("date", from)
      .lte("date", to);
    if (delError) throw new Error(delError.message);

    const { error: insertError } = await supabase.from("planner_items").insert(rows);
    if (insertError) throw new Error(insertError.message);

    return { inserted: rows.length, days: dates.length, moodAdjusted: todayMoodLow };
  });
