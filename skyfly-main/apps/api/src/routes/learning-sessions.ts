import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const learningSessionsRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

learningSessionsRouter.get("/learning-sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from("learning_sessions")
      .select("*")
      .eq("user_id", req.userId!)
      .order("completed_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, sessions: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

learningSessionsRouter.post("/learning-sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { kind, minutes, source, topic } = req.body;
    const { data, error } = await supabase
      .from("learning_sessions")
      .insert({
        user_id: req.userId!,
        kind: kind || "voice",
        minutes: minutes || 5,
        source: source || "classroom",
        topic: topic || "General",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, session: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
