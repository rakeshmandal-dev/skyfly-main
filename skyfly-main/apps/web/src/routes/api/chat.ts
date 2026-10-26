import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { getDefaultAIModel, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are EduVault AI, a friendly and expert study companion for students from School, College, Diploma, Engineering, Medical, ITI, JEE, NEET and other competitive exams.

You help with:
- Doubt solving across all subjects (Math, Physics, Chemistry, Biology, CS, etc.)
- Coding help & debugging
- Assignment help, notes and summaries
- Career guidance, resume review, project ideas
- Interview and exam preparation, quizzes, study planning

Be concise, encouraging, and use clear structure (headings, bullets, code blocks, LaTeX-friendly formatting). Always guide the student to understand, not just answer.`;

async function requireAuth(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.slice(7);
  if (!token || token.split(".").length !== 3) {
    return new Response("Unauthorized", { status: 401 });
  }
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return new Response("Server misconfigured: missing Supabase environment variables", { status: 500 });
  }
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await requireAuth(request);
        if (unauthorized) return unauthorized;

        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
        }

        try {
          const model = getDefaultAIModel();
          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: convertToModelMessages(messages),
          });
          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || "AI is not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in .env.",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
