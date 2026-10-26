import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { QuizAttemptCreateSchema } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const mockTestsRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

const MOCKS = [
  { id: "m1", title: "JEE Main Full Mock #1", subject: "PCM", duration: 180, questions: 30, type: "Full-length" },
  { id: "m2", title: "NEET Full Mock #1", subject: "PCB", duration: 180, questions: 30, type: "Full-length" },
  { id: "m3", title: "Physics Sectional", subject: "Physics", duration: 60, questions: 20, type: "Subject-wise" },
  { id: "m4", title: "Chemistry Sectional", subject: "Chemistry", duration: 60, questions: 20, type: "Subject-wise" },
  { id: "m5", title: "Mathematics Sectional", subject: "Mathematics", duration: 60, questions: 20, type: "Subject-wise" },
  { id: "m6", title: "Coding Placement Mock", subject: "DSA", duration: 90, questions: 25, type: "Full-length" },
];

// GET /api/mock-tests
mockTestsRouter.get("/mock-tests", (req, res) => {
  res.json({
    success: true,
    tests: MOCKS,
    total: MOCKS.length,
  });
});

// POST /api/mock-tests/:id/attempts
mockTestsRouter.post("/mock-tests/:id/attempts", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const body = QuizAttemptCreateSchema.parse(req.body);

    const { data: attempt, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: req.userId!,
        subject: body.subject,
        topic: `Mock: ${id}`,
        difficulty: "Hard",
        score: body.score,
        total: body.total,
      })
      .select()
      .single();

    if (error) throw error;

    // Award 10 learning credits for full mock test completion
    try {
      await supabase.rpc("award_learning_credits", {
        _activity: "mock_test_completed",
        _ref_key: attempt.id,
        _description: `Completed full mock test: ${body.subject}`,
      });
    } catch {
      // Non-blocking
    }

    res.status(201).json({
      success: true,
      attempt,
      accuracy: Math.round((body.score / body.total) * 100),
      creditsAwarded: 10,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
