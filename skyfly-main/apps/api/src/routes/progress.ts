import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const progressRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

progressRouter.get("/progress", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [attemptsRes, goalRes, sessionsRes] = await Promise.all([
      supabase.from("quiz_attempts").select("*").eq("user_id", req.userId!).order("created_at", { ascending: false }),
      supabase.from("study_goals").select("*").eq("user_id", req.userId!).maybeSingle(),
      supabase.from("learning_sessions").select("*").eq("user_id", req.userId!).order("completed_at", { ascending: false }),
    ]);

    const attempts = attemptsRes.data || [];
    const totalQ = attempts.reduce((acc, a) => acc + (a.total || 0), 0);
    const totalCorrect = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const overallAccuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

    // Calculate subject-wise breakdowns
    const subjectMap: Record<string, { total: number; score: number }> = {};
    for (const a of attempts) {
      if (!subjectMap[a.subject]) subjectMap[a.subject] = { total: 0, score: 0 };
      subjectMap[a.subject].total += a.total;
      subjectMap[a.subject].score += a.score;
    }

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, stat]) => ({
      subject,
      totalQuestions: stat.total,
      score: stat.score,
      accuracy: Math.round((stat.score / stat.total) * 100),
    }));

    // Exam Readiness derivation
    // Readiness = 0.5 * overallAccuracy + 0.3 * min(100, attempts.length * 10) + 0.2 * min(100, (goalRes.data?.studied_today_minutes || 0) * 1.5)
    const attemptsFactor = Math.min(100, attempts.length * 10);
    const consistencyFactor = Math.min(100, (goalRes.data?.studied_today_minutes || 0) * 1.5);
    const examReadinessScore = Math.min(100, Math.round(0.5 * overallAccuracy + 0.3 * attemptsFactor + 0.2 * consistencyFactor));

    res.json({
      success: true,
      stats: {
        overallAccuracy,
        totalQuestionsAnswered: totalQ,
        totalQuizzesTaken: attempts.length,
        studiedTodayMinutes: goalRes.data?.studied_today_minutes || 0,
        dailyGoalMinutes: goalRes.data?.daily_goal_minutes || 60,
        examReadinessScore,
        examReadinessFormula: "50% Overall Accuracy + 30% Practice Volume + 20% Daily Consistency",
        subjectBreakdown,
        recentAttempts: attempts.slice(0, 10),
        recentSessions: sessionsRes.data?.slice(0, 10) || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});
