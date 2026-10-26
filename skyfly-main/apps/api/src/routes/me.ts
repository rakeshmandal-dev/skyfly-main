import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ProfileUpdateSchema } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const meRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

meRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.userId!)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      user: {
        id: req.user!.id,
        email: req.user!.email,
        profile: profile || {
          id: req.user!.id,
          fullName: req.user!.user_metadata?.full_name || "Student",
          studentType: req.user!.user_metadata?.student_type || "college",
          streakCount: 0,
          impactAccess: false,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

meRouter.patch("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = ProfileUpdateSchema.parse(req.body);
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.fullName,
        bio: parsed.bio,
        institution: parsed.institution,
        grade_or_year: parsed.gradeOrYear,
        student_type: parsed.studentType,
        skills: parsed.skills,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.userId!)
      .select()
      .maybeSingle();

    if (error) throw error;

    res.json({ success: true, profile: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
