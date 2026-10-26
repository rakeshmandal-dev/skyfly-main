import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { aiRateLimiter } from "../middleware/rate-limit.js";
import { CameraSolveSchema, LessonBuildSchema } from "@eduvault/shared";
import { AIService } from "../services/ai.service.js";

export const aiRouter = Router();

aiRouter.use(aiRateLimiter);

// POST /api/ai/chat
aiRouter.post("/ai/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: { message: "Messages array required" } });
    }

    const reply = await AIService.generateChat(messages, systemPrompt);
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/ai/mentor
aiRouter.post("/ai/mentor", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { messages } = req.body;
    const system = `You are EduVault AI Mentor — a warm, calm, non-judgmental study companion.
Help students handle study anxiety, exam pressure, motivation dips, and mental exhaustion.
Never make unauthorized clinical medical diagnoses. Recommend verified campus counselors or helpline if a student indicates severe distress. Keep your tone encouraging, patient, and grounded.`;

    const reply = await AIService.generateChat(messages, system);
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/ai/lesson
aiRouter.post("/ai/lesson", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = LessonBuildSchema.parse(req.body);
    const lesson = await AIService.buildClassroomLesson(body.pdfText, body.language, body.subject);
    res.json({ success: true, lesson });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/ai/solve-image
aiRouter.post("/ai/solve-image", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = CameraSolveSchema.parse(req.body);
    const solution = await AIService.solveImage(body.imageDataUrl, body.note);
    res.json({ success: true, solution });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/ai/solve-document
aiRouter.post("/ai/solve-document", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { documentText, query } = req.body;
    if (!documentText) {
      return res.status(400).json({ success: false, error: { message: "Document text is required" } });
    }

    const chunks = AIService.chunkDocumentText(documentText);
    const context = chunks.slice(0, 3).join("\n\n---\n\n");

    const prompt = `Based strictly on the provided document excerpts, answer the student's question:
Excerpts:
${context}

Question: ${query || "Summarize the key points of this document."}
Cite references where applicable and indicate if any information is uncertain.`;

    const answer = await AIService.generateChat(
      [{ role: "user", content: prompt }],
      "You are an expert document assistant. Ground your answer strictly in the text."
    );

    res.json({ success: true, answer, chunksAnalyzed: chunks.length });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});

// POST /api/ai/voice/session
aiRouter.post("/ai/voice/session", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { language, subject } = req.body;
    res.json({
      success: true,
      sessionId: crypto.randomUUID(),
      language: language || "English",
      subject: subject || "General",
      audioConfig: {
        sampleRate: 24000,
        channels: 1,
        format: "audio/webm",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: (err as Error).message } });
  }
});
