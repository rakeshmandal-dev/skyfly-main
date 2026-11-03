import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { NoteCreateSchema, NoteFilterSchema, SEED_NOTES } from "@eduvault/shared";
import { getUserClient, getServiceClient } from "../config/supabase.js";

export const notesRouter = Router();

// GET /api/notes
notesRouter.get("/notes", async (req, res) => {
  try {
    const filters = NoteFilterSchema.parse(req.query);
    const supabase = getServiceClient();

    let query = supabase
      .from("study_materials")
      .select("*")
      .eq("type", "note");

    if (filters.subject && filters.subject !== "All") {
      query = query.eq("subject", filters.subject);
    }
    if (filters.semester && filters.semester !== "All") {
      query = query.eq("semester", filters.semester);
    }
    if (filters.query) {
      query = query.ilike("title", `%${filters.query}%`);
    }

    const { data, error } = await query
      .range(filters.offset, filters.offset + filters.limit - 1)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      // Return safe seed notes filtered if table is empty
      let filtered = SEED_NOTES;
      if (filters.subject && filters.subject !== "All") {
        filtered = filtered.filter((n) => n.subject === filters.subject);
      }
      if (filters.semester && filters.semester !== "All") {
        filtered = filtered.filter((n) => n.semester === filters.semester);
      }
      if (filters.query) {
        filtered = filtered.filter((n) => n.title.toLowerCase().includes(filters.query!.toLowerCase()));
      }
      return res.json({ success: true, notes: filtered, total: filtered.length });
    }

    res.json({ success: true, notes: data, total: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/notes
notesRouter.post("/notes", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = NoteCreateSchema.parse(req.body);
    const supabase = getUserClient(req.token);
    const { data, error } = await supabase
      .from("study_materials")
      .insert({
        title: body.title,
        subject: body.subject,
        semester: body.semester || "Sem 1",
        unit: body.unit || "Unit 1",
        file_url: body.fileUrl || "/documents/sample.pdf",
        type: "note",
        uploaded_by: req.userId,
        status: "approved",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, note: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});

// DELETE /api/notes/:id
notesRouter.delete("/notes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const supabase = getUserClient(req.token);
    const { error } = await supabase
      .from("study_materials")
      .delete()
      .eq("id", id)
      .eq("uploaded_by", req.userId!);

    if (error) throw error;
    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});
