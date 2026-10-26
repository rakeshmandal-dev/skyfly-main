import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const mistakesRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

mistakesRouter.get("/mistakes", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { subject } = req.query as { subject?: string };
    let query = supabase.from("mistakes").select("*").eq("user_id", req.userId!);
    if (subject && subject !== "All") query = query.eq("subject", subject);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    res.json({ success: true, mistakes: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

mistakesRouter.patch("/mistakes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { resolved } = req.body;

    const { data, error } = await supabase
      .from("mistakes")
      .update({ resolved: Boolean(resolved) })
      .eq("id", id)
      .eq("user_id", req.userId!)
      .select()
      .single();

    if (error) throw error;

    if (resolved) {
      try {
        await supabase.rpc("award_learning_credits", {
          _activity: "mistake_resolved",
          _ref_key: id,
          _description: "Reviewed and mastered previously missed question",
        });
      } catch {
        // Non-blocking
      }
    }

    res.json({ success: true, mistake: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
