import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { CareerPlanGenerateSchema } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { AIService } from "../services/ai.service.js";

export const careerPlansRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

careerPlansRouter.get("/career-plans", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from("career_plans")
      .select("*")
      .eq("user_id", req.userId!)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, plans: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

careerPlansRouter.post("/career-plans", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = CareerPlanGenerateSchema.parse(req.body);

    const prompt = `Create a realistic, motivating academic and career roadmap for a student:
- Current level: ${body.currentLevel}
- Interests: ${body.interests}
- Academic performance / marks: ${body.marks || "Average to Good"}
- Long-term goal: ${body.goal || "Build a high-impact, fulfilling career"}

Include:
1. Immediate Next Steps (Next 3–6 months)
2. Entrance Exams / Skill Prerequisites
3. Top Recommended Streams / Degrees / Certifications
4. High-Growth Industry Paths & Real Opportunities
5. 3 Actionable Habits for Success`;

    const planMarkdown = await AIService.generateChat(
      [{ role: "user", content: prompt }],
      "You are an empathetic, insightful academic career counselor in India with deep knowledge of CBSE, State boards, JEE, NEET, CUET, Engineering, Medical, Govt exams, and Tech careers."
    );

    const { data, error } = await supabase
      .from("career_plans")
      .insert({
        user_id: req.userId!,
        interests: body.interests,
        marks: body.marks,
        current_level: body.currentLevel,
        goal: body.goal,
        plan_markdown: planMarkdown,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, plan: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
