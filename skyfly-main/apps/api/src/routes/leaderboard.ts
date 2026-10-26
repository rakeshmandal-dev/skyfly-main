import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const leaderboardRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

leaderboardRouter.get("/leaderboard", async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, student_type, streak_count")
      .order("streak_count", { ascending: false })
      .limit(50);

    if (error) throw error;

    const rankings = (profiles || []).map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      name: p.full_name || p.username || "Anonymous Student",
      avatarUrl: p.avatar_url,
      studentType: p.student_type || "college",
      streak: p.streak_count || 0,
      xp: (p.streak_count || 0) * 100 + 250,
    }));

    res.json({
      success: true,
      rankings,
      total: rankings.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});
