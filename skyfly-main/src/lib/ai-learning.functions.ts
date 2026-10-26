import { createServerFn } from "@tanstack/react-start";
import { streamText, type ModelMessage } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getDefaultAIModel } from "@/lib/ai-gateway.server";

function gatewayModel() {
  return getDefaultAIModel();
}

async function aiText(system: string, messages: ModelMessage[]) {
  const result = streamText({ model: gatewayModel(), system, messages });
  return await result.text;
}

function extractJson(text: string): any {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  const direct = tryParse(cleaned);
  if (direct) return direct;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) return tryParse(cleaned.slice(start, end + 1));
  return null;
}

/** OCR + solve a photographed question (Camera AI). */
export const solveImageQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string; note?: string }) => {
    if (!d?.imageDataUrl?.startsWith("data:image/")) throw new Error("A photo is required.");
    return d;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const text = await aiText(
      "You are an expert teacher. Read the question(s) in the image carefully, then answer. Reply in markdown with: **Question read**, **Solution** (step by step), **Answer**, and one short **Tip**.",
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: data.note?.trim()
                ? `Student note: ${data.note.trim()}\nRead and solve the question in this image.`
                : "Read and solve the question in this image.",
            },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    );
    return { text };
  });

/** Short spoken-style answer for the Voice AI Teacher. */
export const speakAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: { question: string; subject?: string; language?: string }) => {
    if (!d?.question?.trim()) throw new Error("Please say a question.");
    return d;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const text = await aiText(
      `You are a friendly spoken tutor${data.subject ? ` for ${data.subject}` : ""}. Answer out loud in plain sentences, under 120 words. No markdown, no bullet points, no formulas in LaTeX — say them in words.${
        data.language ? ` Reply only in ${data.language}.` : ""
      }`,
      [{ role: "user", content: data.question }],
    );
    return { text: text.trim() };
  });

export type ExamQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

/** Generates a timed exam paper (AI Exam Simulation). */
export const generateExam = createServerFn({ method: "POST" })
  .inputValidator((d: { subject: string; exam: string; count: number; difficulty: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const count = Math.min(20, Math.max(5, Number(data.count) || 10));
    const raw = await aiText(
      "You are an exam paper setter. You reply with valid JSON only — never markdown, never explanations outside the JSON.",
      [
        {
          role: "user",
          content: `Create ${count} multiple-choice questions for a ${data.exam} level ${data.subject} exam at ${data.difficulty} difficulty.
Each question has exactly 4 options and one correct option index (0-3), plus a one-line explanation.
Respond with JSON only in exactly this shape:
{"questions":[{"question":"string","options":["a","b","c","d"],"answer":0,"explanation":"string"}]}`,
        },
      ],
    );
    const parsed = extractJson(raw);
    const questions: ExamQuestion[] = Array.isArray(parsed?.questions)
      ? parsed.questions
          .filter(
            (q: any) =>
              q && typeof q.question === "string" && Array.isArray(q.options) && q.options.length === 4,
          )
          .slice(0, count)
          .map((q: any) => ({
            question: String(q.question),
            options: q.options.map((o: any) => String(o)),
            answer: Math.min(3, Math.max(0, Number(q.answer) || 0)),
            explanation: String(q.explanation ?? ""),
          }))
      : [];
    if (questions.length === 0) throw new Error("Could not generate the paper. Please try again.");
    return { questions };
  });

/** Explains why an answer was wrong (AI Mistake Book). */
export const explainMistake = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("mistakes")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !row) throw new Error("Mistake not found.");

    const text = await aiText(
      "You are a patient teacher. Explain in markdown, under 180 words: why the student's answer is wrong, the correct reasoning step by step, and one memory tip.",
      [
        {
          role: "user",
          content: `Subject: ${row.subject}\nTopic: ${row.topic ?? "-"}\nQuestion: ${row.question}\nStudent answered: ${row.user_answer ?? "-"}\nCorrect answer: ${row.correct_answer ?? "-"}`,
        },
      ],
    );

    const { error: upErr } = await supabase
      .from("mistakes")
      .update({ explanation: text })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);
    return { explanation: text };
  });

/** Generates a similar practice question for a logged mistake. */
export const retrySimilarQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("mistakes")
      .select("subject, topic, question")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !row) throw new Error("Mistake not found.");

    const raw = await aiText("You reply with valid JSON only.", [
      {
        role: "user",
        content: `Write ONE new multiple-choice question testing the same concept as this one (do not copy it).
Subject: ${row.subject}, Topic: ${row.topic ?? "-"}
Original: ${row.question}
JSON only: {"question":"string","options":["a","b","c","d"],"answer":0,"explanation":"string"}`,
      },
    ]);
    const q = extractJson(raw);
    if (!q?.question || !Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error("Could not create a practice question. Try again.");
    }
    return {
      question: String(q.question),
      options: q.options.map((o: any) => String(o)),
      answer: Math.min(3, Math.max(0, Number(q.answer) || 0)),
      explanation: String(q.explanation ?? ""),
    } as ExamQuestion;
  });

/** Builds a personalised career roadmap (AI Career Plan). */
export const generateCareerPlan = createServerFn({ method: "POST" })
  .inputValidator((d: { interests: string; marks: string; currentLevel: string; goal: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const text = await aiText(
      "You are an experienced career counsellor for Indian students. Reply in markdown with clear headings: Best-fit streams/careers (top 3 with why), Recommended path (12/24 months timeline), Skills to build, Exams & colleges to target, Backup options. Be concrete and encouraging.",
      [
        {
          role: "user",
          content: `Current level: ${data.currentLevel}\nInterests: ${data.interests}\nMarks / academic performance: ${data.marks}\nGoal: ${data.goal || "not specified"}`,
        },
      ],
    );

    const { error } = await supabase.from("career_plans").insert({
      user_id: userId,
      interests: data.interests,
      marks: data.marks,
      current_level: data.currentLevel,
      goal: data.goal,
      plan_markdown: text,
    });
    if (error) throw new Error(error.message);
    return { plan: text };
  });

/** One turn of the simulated viva (question or final feedback).
 *
 * mode "exam" (default): AI examiner questions the student, ends with a score /100.
 * mode "teach" (Reverse Viva / "Teach the AI"): the student explains a topic and the
 *   AI plays a curious, slightly-confused junior who asks doubts — ends with a
 *   clarity/depth score (shown out of 100 for consistency) and what was missing.
 *
 * panel: when true (exam mode only) the single model role-plays 3 examiner personas
 *   in one reply — Strict Examiner, Friendly Examiner, Cross-Questioner — each line
 *   labelled "**Name:** ..." so the client can render them as separate bubbles.
 */
export const vivaTurn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      subject: string;
      history: { role: "examiner" | "student"; text: string }[];
      finish?: boolean;
      mode?: "exam" | "teach";
      panel?: boolean;
    }) => d,
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const mode = data.mode === "teach" ? "teach" : "exam";
    const panel = mode === "exam" && !!data.panel;
    const otherRoleLabel = mode === "teach" ? "Junior" : "Examiner";
    const history = (data.history ?? [])
      .map((h) => `${h.role === "examiner" ? otherRoleLabel : "Student"}: ${h.text}`)
      .join("\n");

    if (data.finish) {
      const gradingPrompt =
        mode === "teach"
          ? `You are grading how clearly a student EXPLAINED the topic "${data.subject}" to a curious junior. Score clarity + depth out of 100 (be it as if scoring 1-10 clarity and 1-10 depth, then scale to /100) and give short feedback (max 150 words, markdown) on what was well explained and what was missing or unclear.
Transcript:
${history}
JSON only: {"score":0,"feedback":"string"}`
          : `You are the examiner${panel ? " panel" : ""} of a ${data.subject} viva. Grade the student out of 100 and give short constructive feedback (max 150 words, markdown).
Transcript:
${history}
JSON only: {"score":0,"feedback":"string"}`;

      const raw = await aiText("You reply with valid JSON only.", [
        { role: "user", content: gradingPrompt },
      ]);
      const parsed = extractJson(raw) ?? {};
      const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
      const feedback = String(parsed.feedback ?? "No feedback available.");
      const { supabase, userId } = context;
      await supabase.from("viva_sessions").insert({
        user_id: userId,
        subject: `${data.subject}${mode === "teach" ? " (Teach the AI)" : panel ? " (Panel)" : ""}`,
        transcript: data.history as unknown as never,
        score,
        feedback,
      });
      return { done: true as const, score, feedback };
    }

    let system: string;
    if (mode === "teach") {
      system = `You are a curious, slightly-confused JUNIOR student. The student is trying to TEACH YOU the topic "${data.subject}". Ask exactly ONE short follow-up question or doubt at a time (max 2 sentences) — the kind a real junior would ask ("wait, why does that happen?", "but what if...?"). Occasionally misunderstand on purpose to test if they can re-explain simply. Never lecture back or give the answer yourself — you are the one learning. Stay encouraging and genuinely curious.`;
    } else if (panel) {
      system = `You are simulating THREE examiners at once for a ${data.subject} oral viva panel: "Strict Examiner" (tough, precise, wants exact answers), "Friendly Examiner" (warm, encouraging, simplifies when student struggles), and "Cross-Questioner" (pokes holes, asks "but what about..." follow-ups, sometimes references what another examiner just asked, e.g. "as Professor asked earlier..."). For each turn, have exactly ONE of the three personas speak (pick whichever fits best, vary it turn to turn), prefixed EXACTLY like "**Strict Examiner:** ..." or "**Friendly Examiner:** ..." or "**Cross-Questioner:** ...", ask ONE question, max 2 sentences after the label. Never reveal full answers.`;
    } else {
      system = `You are a strict but friendly examiner conducting an oral viva in ${data.subject}. Ask exactly ONE question at a time, no more than 2 sentences. If the student just answered, briefly acknowledge (max 1 short sentence) then ask the next, progressively harder question. Never reveal full answers.`;
    }

    const starterPrompt =
      mode === "teach"
        ? `Ask the student to start teaching you about ${data.subject} — invite them to explain any part of it they like, then react as their curious junior.`
        : "Start the viva with your first question.";

    const text = await aiText(system, [{ role: "user", content: history || starterPrompt }]);
    return { done: false as const, question: text.trim() };
  });

/**
 * OCR / Image Document Reader: Extracts readable text from photographed notes or textbook pages.
 * Rejects illegible images honestly rather than inventing syllabus facts.
 */
export const extractTextFromImage = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string }) => {
    if (!d?.imageDataUrl?.startsWith("data:image/")) {
      throw new Error("A valid image file (PNG, JPG, WebP) is required.");
    }
    // Strict 10MB payload size check (~13.7MB in base64 data URL)
    if (d.imageDataUrl.length > 14 * 1024 * 1024) {
      throw new Error("Image file exceeds the 10MB limit.");
    }
    return d;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const text = await aiText(
      "You are an OCR and document reader for visually impaired students. Transcribe all readable text from this study document or whiteboard verbatim. If there are tables or mathematical formulas, transcribe them clearly in words. If the image is illegible, blurry, or blank, reply EXACTLY with: 'NO_READABLE_TEXT_FOUND'. Do not invent hypothetical syllabus facts.",
      [
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe the text in this image accurately." },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    );
    const cleaned = text.trim();
    if (cleaned.includes("NO_READABLE_TEXT_FOUND") || cleaned.length < 5) {
      throw new Error("Unable to extract legible text from this image. Please ensure clear lighting and legible writing, or upload a text file.");
    }
    return { extractedText: cleaned };
  });

/**
 * Study Reader AI Coach: Explains, summarizes, and answers doubts about extracted study material.
 */
export const explainStudyDocument = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      documentText: string;
      mode: "simple" | "summary" | "quiz" | "qa";
      question?: string;
      language?: string;
    }) => {
      if (!d?.documentText?.trim()) {
        throw new Error("Document text is required.");
      }
      // Safety cap text to avoid model context overflow
      if (d.documentText.length > 15000) {
        d.documentText = d.documentText.slice(0, 15000);
      }
      return d;
    },
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const lang = data.language ? ` in ${data.language}` : " in plain English";
    let prompt = "";
    if (data.mode === "simple") {
      prompt = `Explain the following study material in simple, conversational language suitable for audio read-aloud${lang}. Use clear analogies, avoid complex visual references, and break concepts into intuitive steps. Conclude with a brief reminder that official exam questions may vary.`;
    } else if (data.mode === "summary") {
      prompt = `Summarize the core concepts and key formulas from this study material${lang}. Make it easy to listen to or read with a screen reader.`;
    } else if (data.mode === "quiz") {
      prompt = `Based strictly on the following study material, generate 3 practice revision questions with spoken-friendly answer explanations${lang}.`;
    } else {
      prompt = `A student has a doubt about this study material: "${data.question ?? "Explain the main topic"}". Answer their question directly and concisely${lang}.`;
    }

    const text = await aiText(
      "You are an accessible, supportive AI Study Coach for students. Your explanations must be accurate, encouraging, and easy to understand when read aloud. Never fabricate facts outside the text.",
      [
        {
          role: "user",
          content: `${prompt}\n\n--- DOCUMENT CONTENT ---\n${data.documentText}`,
        },
      ],
    );
    return { text: text.trim() };
  });

