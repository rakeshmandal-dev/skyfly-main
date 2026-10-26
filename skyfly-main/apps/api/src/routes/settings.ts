import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const settingsRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

settingsRouter.get("/settings", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.userId!)
      .maybeSingle();

    res.json({
      success: true,
      settings: {
        email: req.user!.email,
        studentType: profile?.student_type || "college",
        theme: "dark",
        lowResourceMode: false,
        notifications: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

settingsRouter.patch("/settings", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { studentType } = req.body;
    if (studentType && ["school", "college"].includes(studentType)) {
      await supabase
        .from("profiles")
        .update({ student_type: studentType })
        .eq("id", req.userId!);
    }

    res.json({ success: true, message: "Settings updated" });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
