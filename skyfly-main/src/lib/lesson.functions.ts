import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function callAI(messages: unknown[]) {
  const geminiKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"];
  const openaiKey = process.env["OPENAI_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];

  let endpoint = "";
  let apiKey = "";
  let model = "";

  if (geminiKey) {
    endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    apiKey = geminiKey;
    model = "gemini-2.0-flash";
  } else if (openaiKey) {
    endpoint = "https://api.openai.com/v1/chat/completions";
    apiKey = openaiKey;
    model = "gpt-4o-mini";
  } else if (lovableKey) {
    endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    apiKey = lovableKey;
    model = "google/gemini-2.0-flash";
  } else {
    throw new Error(
      "AI API key not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your .env file."
    );
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("The teacher is a bit busy right now. Please try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted for this workspace. Please add credits to continue.");
    throw new Error(`Lesson generation failed (${res.status}). ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned) as T;
}

export const buildLesson = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        text: z.string().min(30),
        language: z.string().default("English"),
        fileName: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const source = data.text.slice(0, 45000);
    const raw = await callAI([
      {
        role: "system",
        content:
          "You are an experienced school teacher who turns study material into a spoken classroom lesson. " +
          "Reply with STRICT JSON only, no markdown. Shape: " +
          '{"title":string,"subject":string,"topics":[{"id":string,"title":string,"summary":string,' +
          '"explanation":string,"simple":string,"keyPoints":string[]}]}. ' +
          "Create 5-10 topics that follow the document order. " +
          '"explanation" is what the teacher SAYS out loud: 120-220 words, warm, spoken style, with examples, ' +
          "no markdown, no bullet characters, no emojis. " +
          '"simple" re-explains the same topic in very easy words for a beginner, 60-110 words. ' +
          `Write EVERY field — titles, summaries, explanations, simple versions and key points — in ${data.language}, ` +
          `using the natural script and vocabulary of ${data.language}. Keep only widely used technical terms in English when no common ${data.language} word exists. ` +
          "Never mix in English sentences.",
      },
      {
        role: "user",
        content: `Document${data.fileName ? ` "${data.fileName}"` : ""}:\n\n${source}`,
      },
    ]);

    return parseJson<{
      title: string;
      subject: string;
      topics: Array<{
        id: string;
        title: string;
        summary: string;
        explanation: string;
        simple: string;
        keyPoints: string[];
      }>;
    }>(raw);
  });

export const askTeacher = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        question: z.string().min(1),
        context: z.string().default(""),
        language: z.string().default("English"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const answer = await callAI([
      {
        role: "system",
        content:
          "You are a patient classroom teacher answering a student's question about the lesson material. " +
          "Answer out loud in a spoken style: plain sentences, no markdown, no bullets, under 140 words. " +
          `Answer entirely in ${data.language}, in its natural script, keeping only unavoidable technical terms in English. ` +
          "If the material does not cover it, say so briefly and still help.",
      },
      {
        role: "user",
        content: `Lesson material:\n${data.context.slice(0, 20000)}\n\nStudent question: ${data.question}`,
      },
    ]);

    return { answer: answer.trim() };
  });
