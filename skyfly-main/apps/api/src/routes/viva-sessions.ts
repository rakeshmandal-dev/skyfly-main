import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { VivaTurnSchema } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { AIService } from "../services/ai.service.js";

export const vivaSessionsRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

vivaSessionsRouter.get("/viva-sessions", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from("viva_sessions")
      .select("*")
      .eq("user_id", req.userId!)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, sessions: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

vivaSessionsRouter.post("/viva-sessions/turn", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = VivaTurnSchema.parse(req.body);

    const systemPrompt = `You are conducting an oral viva examination in ${body.subject}.
Mode: ${body.mode} (exam = evaluate strictly; teach = guide and clarify concepts).
Persona: ${body.persona || "Friendly Examiner"}.
Evaluate the student's answer concisely, give an immediate score for this response out of 10, explain any corrections, and ask the next question or give closing feedback.`;

    const response = await AIService.generateChat(
      [
        ...body.messages.map((m) => ({
          role: m.role === "examiner" ? ("assistant" as const) : ("user" as const),
          content: m.text,
        })),
        { role: "user", content: body.studentAnswer },
      ],
      systemPrompt
    );

    res.json({
      success: true,
      examinerReply: response,
      persona: body.persona || "Friendly Examiner",
    });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
