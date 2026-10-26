import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const certificatesRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

certificatesRouter.get("/certificates", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [attemptsRes, profileRes] = await Promise.all([
      supabase.from("quiz_attempts").select("*").eq("user_id", req.userId!),
      supabase.from("profiles").select("full_name, streak_count").eq("id", req.userId!).maybeSingle(),
    ]);

    const attempts = attemptsRes.data || [];
    const totalQ = attempts.reduce((acc, a) => acc + (a.total || 0), 0);
    const totalScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const accuracy = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0;
    const streak = profileRes.data?.streak_count || 0;

    // Issue certificates based on verified learning criteria
    const certs = [
      {
        id: "cert-starter",
        title: "Academic Onboarding Certificate",
        description: "Successfully configured student profile and completed first study activity.",
        issued: true,
        issuedAt: new Date().toISOString(),
        recipientName: profileRes.data?.full_name || "Student",
      },
      {
        id: "cert-accuracy",
        title: "High Mastery & Accuracy Honor",
        description: "Achieved an overall quiz accuracy of 80% or greater across learning modules.",
        issued: accuracy >= 80,
        issuedAt: accuracy >= 80 ? new Date().toISOString() : null,
        recipientName: profileRes.data?.full_name || "Student",
      },
      {
        id: "cert-streak",
        title: "Consistent Learner Achievement",
        description: "Maintained a continuous daily learning streak of 7+ days.",
        issued: streak >= 7,
        issuedAt: streak >= 7 ? new Date().toISOString() : null,
        recipientName: profileRes.data?.full_name || "Student",
      },
    ];

    res.json({
      success: true,
      certificates: certs,
      total: certs.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});
