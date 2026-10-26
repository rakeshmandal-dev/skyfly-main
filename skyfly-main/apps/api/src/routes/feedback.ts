import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { StudentFeedbackSchema } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const feedbackRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

feedbackRouter.get("/feedback", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from("student_feedback")
      .select("*")
      .eq("user_id", req.userId!)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ success: true, feedback: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

feedbackRouter.post("/feedback", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = StudentFeedbackSchema.parse(req.body);
    const { data, error } = await supabase
      .from("student_feedback")
      .insert({
        user_id: req.userId!,
        rating: body.rating,
        message: body.message,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, feedback: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
