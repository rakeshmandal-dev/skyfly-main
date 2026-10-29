import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { BookmarkCreateSchema } from "@eduvault/shared";
import { getUserClient } from "../config/supabase.js";

export const bookmarksRouter = Router();

bookmarksRouter.get("/bookmarks", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getUserClient(req.token);
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", req.userId!)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, bookmarks: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

bookmarksRouter.post("/bookmarks", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = BookmarkCreateSchema.parse(req.body);
    const supabase = getUserClient(req.token);
    const { data, error } = await supabase
      .from("bookmarks")
      .upsert(
        { user_id: req.userId!, item_type: body.itemType, item_id: body.itemId },
        { onConflict: "user_id,item_type,item_id" }
      )
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, bookmark: data });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});

bookmarksRouter.delete("/bookmarks/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const supabase = getUserClient(req.token);
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", req.userId!);

    if (error) throw error;
    res.json({ success: true, message: "Bookmark removed" });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});
