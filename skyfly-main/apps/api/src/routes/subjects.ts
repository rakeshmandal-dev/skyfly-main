import { Router } from "express";
import { SEED_SUBJECTS } from "@eduvault/shared";

export const subjectsRouter = Router();

subjectsRouter.get("/subjects", (req, res) => {
  res.json({
    success: true,
    subjects: SEED_SUBJECTS,
    total: SEED_SUBJECTS.length,
  });
});
