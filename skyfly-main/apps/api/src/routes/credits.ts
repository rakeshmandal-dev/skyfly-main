import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { CreditAwardSchema, CreditSpendSchema } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const creditsRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

// GET /api/credits
creditsRouter.get("/credits", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [walletRes, ledgerRes, eligRes] = await Promise.all([
      supabase.from("credit_wallets").select("*").eq("user_id", req.userId!).maybeSingle(),
      supabase.from("credit_ledger").select("*").eq("user_id", req.userId!).order("created_at", { ascending: false }).limit(20),
      supabase.from("credit_eligibility").select("*").eq("user_id", req.userId!).maybeSingle(),
    ]);

    res.json({
      success: true,
      wallet: walletRes.data || { balance: 0, lifetime_earned: 0, lifetime_spent: 0 },
      ledger: ledgerRes.data || [],
      eligibility: eligRes.data || { class_level: "college", is_eligible: true },
      dailyCap: 60,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/credits/award
creditsRouter.post("/credits/award", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = CreditAwardSchema.parse(req.body);
    const { data, error } = await supabase.rpc("award_learning_credits", {
      _activity: body.activity,
      _ref_key: body.refKey || null,
      _description: body.description || null,
    });

    if (error) throw error;
    res.json({ success: true, result: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/credits/spend
creditsRouter.post("/credits/spend", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = CreditSpendSchema.parse(req.body);
    const { data, error } = await supabase.rpc("spend_learning_credits", {
      _amount: body.amount,
      _purpose: body.purpose,
    });

    if (error) throw error;
    res.json({ success: true, result: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
