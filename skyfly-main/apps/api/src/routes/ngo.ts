import { Router } from "express";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";
import { NgoPartnerCreateSchema, NgoImportStudentsSchema, SEED_NGO_PARTNERS } from "@eduvault/shared";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const ngoRouter = Router();

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

// GET /api/ngo/partners
ngoRouter.get("/ngo/partners", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ngo_partners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return res.json({ success: true, partners: SEED_NGO_PARTNERS });
    }

    res.json({ success: true, partners: data });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/ngo/partners
ngoRouter.post("/ngo/partners", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = NgoPartnerCreateSchema.parse(req.body);
    const { data, error } = await supabase
      .from("ngo_partners")
      .insert({
        name: body.name,
        contact_email: body.contactEmail,
        referral_code: body.referralCode,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, partner: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/ngo/import-students
ngoRouter.post("/ngo/import-students", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = NgoImportStudentsSchema.parse(req.body);
    const uniqueEmails = Array.from(new Set(body.emails.map((e) => e.trim().toLowerCase())));

    let imported = 0;
    let duplicates = 0;

    for (const email of uniqueEmails) {
      const { error } = await supabase
        .from("ngo_invites")
        .insert({ partner_id: body.partnerId, email });

      if (error) {
        duplicates++;
      } else {
        imported++;
      }
    }

    res.json({
      success: true,
      summary: {
        totalReceived: body.emails.length,
        uniqueValid: uniqueEmails.length,
        newlyImported: imported,
        duplicatesOrExisting: duplicates,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});
