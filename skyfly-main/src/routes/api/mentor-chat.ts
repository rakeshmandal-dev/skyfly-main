import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { getDefaultAIModel, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const MENTOR_SYSTEM_PROMPT = `You are "Mann" — a warm, empathetic AI Mentor inside EduVault AI. Students come to you to talk about exam stress, motivation, loneliness, family/academic pressure, focus issues, friendships, or just to vent — the way they might talk to a caring senior, counselor, or mentor.

HOW TO TALK:
- Sound human and warm, not clinical or robotic. Mirror the student's language style — Hindi, Hinglish, or English, whatever they use.
- Practice active listening: reflect back what they're feeling before jumping to advice. Ask gentle, open-ended follow-up questions instead of lecturing.
- Keep replies conversational length — not giant essays, not one-liners.
- Validate emotions first ("that sounds really exhausting" / "makes sense you'd feel that way"), then gently offer perspective or small, practical next steps if it feels right.

WHAT YOU ARE NOT:
- You are NOT a licensed psychologist, psychiatrist, therapist, or doctor. Never claim or imply you are one, and never issue a diagnosis or clinical label for what a student is going through.
- If asked directly what you are, be honest: an AI mentor/companion built to support students, not a replacement for a real professional.

EVERYDAY STUFF (exam stress, motivation dips, family expectations, mild loneliness, focus/procrastination, sleep, friendships):
- Totally fine to explore with them and suggest practical, gentle coping ideas — breaking work into small steps, talking to a trusted person, short breaks, journaling, realistic study pacing, etc.
- Encourage (don't insist) that they also talk to someone they trust in real life — a parent, teacher, senior, or friend.

IF THINGS SEEM SERIOUS (self-harm, suicidal thoughts, hopelessness, abuse, panic, or any sign of crisis):
- Stay calm and caring. Do not try to solve it alone or minimize it.
- Gently but clearly point them toward real human help, and include these India helplines in your reply:
  - Tele MANAS (Govt. of India, 24x7): 14416
  - iCall: 9152987821
  - Vandrevala Foundation: 1860-2662-345
  If there's any sign of immediate danger, tell them to call 112 (emergency) or reach a trusted adult right now.
- Never give any instructions, methods, or details related to self-harm. Never suggest hiding the struggle from family/teachers/doctors.
- Do not end the conversation abruptly after sharing resources — stay present and keep responding supportively.

Never diagnose, never prescribe medication, never claim certainty about someone's mental state. You're a supportive first step, not the last one.`;

type AuthResult = { error: Response } | { userId: string; token: string };

async function requireAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  const token = authHeader.slice(7);
  if (!token || token.split(".").length !== 3) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return { error: new Response("Server misconfigured", { status: 500 }) };
  }
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  return { userId: data.user.id, token };
}

// Cheap, zero-extra-API-call mood heuristic — no second LLM call, so no extra
// credits burned. Looks at the student's own words in this turn only.
const LOW_MOOD_HINTS = [
  "stress", "stressed", "anxious", "anxiety", "hopeless", "overwhelmed", "burnt out",
  "burnout", "can't focus", "cant focus", "lonely", "alone", "worthless", "tired of",
  "give up", "giving up", "depressed", "sad", "crying", "cry", "panic", "fear of failing",
  "pressure", "tension", "pareshan", "udaas", "akela", "rona", "thak gaya", "thak gayi",
  "dar lag raha", "chhod dena", "haar gaya", "haar gayi", "tanav",
];
const GOOD_MOOD_HINTS = [
  "great", "happy", "excited", "confident", "motivated", "good day", "feeling good",
  "proud", "khush", "acha lag raha", "accha lag raha", "josh",
];

function detectMood(text: string): "low" | "neutral" | "good" {
  const t = text.toLowerCase();
  const lowHit = LOW_MOOD_HINTS.some((k) => t.includes(k));
  if (lowHit) return "low";
  const goodHit = GOOD_MOOD_HINTS.some((k) => t.includes(k));
  if (goodHit) return "good";
  return "neutral";
}

async function logMood(userId: string, token: string, mood: "low" | "neutral" | "good") {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return;
  // Scoped with the student's own JWT so RLS ("own mood insert") applies normally.
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  await supabase.from("mood_logs").insert({ user_id: userId, mood, source: "mentor" });
}

export const Route = createFileRoute("/api/mentor-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAuth(request);
        if ("error" in auth) return auth.error;
        const { userId, token } = auth;

        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
        }

        // Mood is read from the student's own latest message — a simple keyword
        // pass, not an extra AI call — so this stays effectively free.
        const lastUserText = [...messages]
          .reverse()
          .find((m) => m.role === "user")
          ?.parts?.map((p) => (p.type === "text" ? p.text : ""))
          .join(" ");
        if (lastUserText?.trim()) {
          void logMood(userId, token, detectMood(lastUserText));
        }

        try {
          const model = getDefaultAIModel();
          const result = streamText({
            model,
            system: MENTOR_SYSTEM_PROMPT,
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
