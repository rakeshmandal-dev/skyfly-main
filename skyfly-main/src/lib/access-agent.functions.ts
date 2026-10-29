import { createServerFn } from "@tanstack/react-start";
import { streamText, type ModelMessage } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

// Server side of "Sathi", the accessibility agent. Same gateway + auth as the other AI features.

const MODEL = "google/gemini-2.5-flash";

function gatewayModel() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  return createLovableAiGatewayProvider(key)(MODEL);
}

async function aiText(system: string, messages: ModelMessage[]) {
  const result = streamText({ model: gatewayModel(), system, messages });
  return await result.text;
}

function extractJson(text: string): any {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
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

export type AgentAction = {
  type: "navigate" | "click" | "fill" | "read_page" | "describe_camera" | "none";
  path?: string;
  label?: string;
  text?: string;
};
export type AgentDecision = { say: string; action: AgentAction };

type DecideInput = {
  text: string;
  lang: "hi-IN" | "en-IN";
  modes: string[];
  currentPath: string;
  pages: { path: string; label: string }[];
  pageHeading?: string;
  pageText?: string;
  habits?: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

const ACTIONS = new Set(["navigate", "click", "fill", "read_page", "describe_camera", "none"]);

/** The agent's brain: understands anything the local command parser could not. */
export const agentDecide = createServerFn({ method: "POST" })
  .inputValidator((d: DecideInput) => {
    if (!d?.text?.trim()) throw new Error("Please say or type something.");
    if (d.text.length > 600) throw new Error("That was too long. Please say it shorter.");
    return d;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }): Promise<AgentDecision> => {
    const language = data.lang === "hi-IN" ? "Hindi (Devanagari script)" : "simple English";
    const system = `You are Sathi, a warm and patient accessibility assistant inside the EduVault learning app.
Your student may be blind, deaf, or unable to speak (modes: ${data.modes.join(", ") || "not set"}). You operate the app FOR the student and decide what they probably need.

Reply with VALID JSON ONLY, no markdown, in exactly this shape:
{"say":"string","action":{"type":"navigate|click|fill|read_page|describe_camera|none","path":"optional","label":"optional","text":"optional"}}

Rules:
- "say" is spoken aloud or shown as captions: ${language}, very simple words, under 60 words, no markdown, no emoji.
- If the student asks a study doubt, answer it in "say" with action type "none". Explain step by step in plain spoken words.
- navigate: "path" must be exactly one of the allowed paths below.
- click: "label" is the visible button text. fill: "text" is what to type into the page's text box.
- read_page: read the current page aloud. describe_camera: describe what is in front of the student.
- NEVER choose destructive actions (delete, submit exam, sign out, pay). Instead explain and ask the student to confirm, with action "none".
- If the request is unclear, ask ONE short question with action "none".
- Mention what you are doing in "say" in a few words (for example: "Opening your notes.").
- Think about what the student really wants. Use their habits when helpful.

Allowed paths:
${data.pages.map((p) => `${p.path} = ${p.label}`).join("\n")}

Current page: ${data.currentPath}${data.pageHeading ? ` (heading: ${data.pageHeading})` : ""}
Student habits: ${data.habits || "none yet"}
${data.pageText ? `Text on screen (may be cut): ${data.pageText.slice(0, 700)}` : ""}`;

    const messages: ModelMessage[] = [
      ...(data.history ?? []).slice(-6).map((h) => ({ role: h.role, content: String(h.content).slice(0, 500) }) as ModelMessage),
      { role: "user", content: data.text.trim() },
    ];

    const raw = await aiText(system, messages);
    const parsed = extractJson(raw);
    if (!parsed || typeof parsed.say !== "string") {
      return { say: raw.replace(/[`*#]/g, "").trim().slice(0, 400), action: { type: "none" } };
    }
    const a = parsed.action ?? {};
    const action: AgentAction = {
      type: ACTIONS.has(a.type) ? a.type : "none",
      path: typeof a.path === "string" ? a.path : undefined,
      label: typeof a.label === "string" ? a.label : undefined,
      text: typeof a.text === "string" ? a.text : undefined,
    };
    return { say: parsed.say.trim().slice(0, 500), action };
  });

/** Describes a photo for a blind student — reads any text fully. */
export const describeScene = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string; lang: "hi-IN" | "en-IN" }) => {
    if (!d?.imageDataUrl?.startsWith("data:image/")) throw new Error("A photo is required.");
    if (d.imageDataUrl.length > 6_000_000) throw new Error("The photo is too large.");
    return d;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const language = data.lang === "hi-IN" ? "Hindi (Devanagari script)" : "simple English";
    const text = await aiText(
      `You describe pictures to a blind student, out loud, in ${language}. First say in one short sentence what the scene is. If there is printed or handwritten text (book, board, paper), read it out completely and clearly. Then mention important objects and where they are (left, right, front). Plain sentences only, no markdown, no emoji, under 150 words. If the picture is blurry or dark, say so and tell the student how to hold the camera better.`,
      [
        {
          role: "user",
          content: [
            { type: "text", text: "Please describe this picture for me." },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    );
    return { text: text.replace(/[`*#]/g, "").trim() };
  });
