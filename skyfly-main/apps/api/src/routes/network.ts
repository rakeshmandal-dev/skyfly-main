import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const networkRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

networkRouter.get("/network", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [profilesRes, followsRes, postsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, username, avatar_url, institution, student_type, streak_count").limit(30),
      supabase.from("follows").select("following_id").eq("follower_id", req.userId!),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    const followingIds = new Set((followsRes.data || []).map((f) => f.following_id));

    const peers = (profilesRes.data || [])
      .filter((p) => p.id !== req.userId!)
      .map((p) => ({
        ...p,
        isFollowing: followingIds.has(p.id),
      }));

    res.json({
      success: true,
      peers,
      posts: postsRes.data || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

networkRouter.post("/network/follow/:targetId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { targetId } = req.params;
    if (targetId === req.userId) {
      return res.status(400).json({ success: false, error: { message: "Cannot follow yourself" } });
    }

    const { error } = await supabase.from("follows").upsert(
      { follower_id: req.userId!, following_id: targetId },
      { onConflict: "follower_id,following_id" }
    );

    if (error) throw error;
    res.json({ success: true, message: "Following updated" });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
