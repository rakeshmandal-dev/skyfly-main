import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { PlannerTaskCreateSchema, PlannerTaskUpdateSchema, StudyGoalUpdateSchema } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const plannerRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

// GET /api/planner
plannerRouter.get("/planner", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [tasksRes, goalRes] = await Promise.all([
      supabase.from("daily_tasks").select("*").eq("user_id", req.userId!).order("created_at", { ascending: true }),
      supabase.from("study_goals").select("*").eq("user_id", req.userId!).maybeSingle(),
    ]);

    let tasks = tasksRes.data || [];
    if (tasks.length === 0) {
      // Seed initial tasks if empty
      const defaultTasks = [
        "Revise Kinematics (Physics)",
        "Solve 20 aptitude questions",
        "Watch DSA lecture — Recursion",
        "Attempt Chemistry quick quiz",
      ];
      const { data } = await supabase
        .from("daily_tasks")
        .insert(defaultTasks.map((text) => ({ user_id: req.userId!, text })))
        .select();
      tasks = data || [];
    }

    res.json({
      success: true,
      tasks,
      goal: goalRes.data || { daily_goal_minutes: 60, studied_today_minutes: 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/planner
plannerRouter.post("/planner", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = PlannerTaskCreateSchema.parse(req.body);
    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: req.userId!,
        text: body.text,
        task_date: body.taskDate || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, task: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});

// PATCH /api/planner/:id
plannerRouter.patch("/planner/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const body = PlannerTaskUpdateSchema.parse(req.body);
    const { data, error } = await supabase
      .from("daily_tasks")
      .update(body)
      .eq("id", id)
      .eq("user_id", req.userId!)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, task: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});

// DELETE /api/planner/:id
plannerRouter.delete("/planner/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", req.userId!);

    if (error) throw error;
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

// PUT /api/planner/goal
plannerRouter.put("/planner/goal", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = StudyGoalUpdateSchema.parse(req.body);
    const { data, error } = await supabase
      .from("study_goals")
      .upsert(
        { user_id: req.userId!, daily_goal_minutes: body.dailyGoalMinutes },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, goal: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
