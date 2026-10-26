import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { QuizAttemptCreateSchema, QUIZZES } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const quizzesRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

// GET /api/quizzes
quizzesRouter.get("/quizzes", (req, res) => {
  res.json({
    success: true,
    quizzes: QUIZZES,
    total: QUIZZES.length,
  });
});

// POST /api/quizzes/:id/attempts
quizzesRouter.post("/quizzes/:id/attempts", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const body = QuizAttemptCreateSchema.parse(req.body);

    const { data: attempt, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: req.userId!,
        subject: body.subject,
        topic: body.topic || "General",
        difficulty: body.difficulty || "Medium",
        score: body.score,
        total: body.total,
      })
      .select()
      .single();

    if (error) throw error;

    // Award XP and invoke server-side credit accounting
    const xpEarned = body.score * 10;
    try {
      await supabase.rpc("award_learning_credits", {
        _activity: "quiz_completed",
        _ref_key: attempt.id,
        _description: `Completed ${body.subject} quiz (${body.score}/${body.total})`,
      });
    } catch {
      // Non-blocking credit award
    }

    res.status(201).json({
      success: true,
      attempt,
      xpEarned,
      accuracy: Math.round((body.score / body.total) * 100),
    });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
