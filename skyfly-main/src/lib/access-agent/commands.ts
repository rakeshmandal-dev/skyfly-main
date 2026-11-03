// Understands what the student said — works offline for common commands (zero AI credits).
// Anything it does not understand is sent to the AI brain.
import { PAGES } from "./pages";

export type Intent =
  | { type: "stop" }
  | { type: "mic_off" }
  | { type: "yes" }
  | { type: "no" }
  | { type: "repeat" }
  | { type: "slower" }
  | { type: "faster" }
  | { type: "help" }
  | { type: "read_page" }
  | { type: "list_options" }
  | { type: "describe_camera" }
  | { type: "back" }
  | { type: "scroll"; dir: "up" | "down" }
  | { type: "logout" }
  | { type: "click"; label: string }
  | { type: "fill"; text: string }
  | { type: "navigate"; path: string }
  | { type: "unknown"; text: string };

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole-word / whole-phrase match that also works for Devanagari. */
function has(norm: string, phrases: string[]) {
  const padded = ` ${norm} `;
  return phrases.some((p) => padded.includes(` ${p} `));
}

const NAV_VERBS = ["open", "go", "goto", "show", "take", "kholo", "kholiye", "kholna", "jao", "chalo", "dikhao", "dikhaiye", "खोलो", "खोलिए", "जाओ", "चलो", "दिखाओ"];

const YES = ["yes", "yeah", "yep", "ok", "okay", "sure", "haan", "han", "haa", "ha", "theek hai", "kar do", "karo", "हाँ", "हां", "ठीक है", "जी", "कर दो", "करो"];
const NO = ["no", "nope", "nahi", "nahin", "mat", "na", "नहीं", "ना", "मत"];

/** `awaitingAnswer` = the agent just asked a yes/no question. */
export function parseCommand(raw: string, awaitingAnswer = false): Intent {
  const norm = normalize(raw);
  if (!norm) return { type: "unknown", text: raw };

  if (awaitingAnswer && norm.split(" ").length <= 3) {
    if (has(norm, YES)) return { type: "yes" };
    if (has(norm, NO)) return { type: "no" };
  }

  // "click <label>" / "type <words>" keep the original words, so match first.
  const click = norm.match(/^(?:click|press|tap|dabao|dabana|dabaye|dabaiye|दबाओ|दबाइए|क्लिक)\s+(?:on\s+|the\s+)?(.+)$/u);
  if (click?.[1]) return { type: "click", label: click[1] };
  const fill = norm.match(/^(?:type|write|likho|likhiye|लिखो|लिखिए)\s+(.+)$/u);
  if (fill?.[1]) {
    // keep the student's own capitalisation/punctuation for typed text
    const original = raw.trim().replace(/^\S+\s+/, "");
    return { type: "fill", text: original || fill[1] };
  }

  if (has(norm, ["stop listening", "mic off", "mic band", "mic band karo", "सुनना बंद", "माइक बंद"])) return { type: "mic_off" };
  if (has(norm, ["stop", "ruko", "ruk", "ruk jao", "chup", "cancel", "रुको", "रुक", "चुप", "बंद करो"])) return { type: "stop" };
  if (has(norm, ["repeat", "again", "dobara", "phir se", "fir se", "दोबारा", "फिर से", "दोहराओ"])) return { type: "repeat" };
  if (has(norm, ["slower", "slow", "dheere", "dhire", "धीरे"])) return { type: "slower" };
  if (has(norm, ["faster", "fast", "tez", "तेज़", "तेज"])) return { type: "faster" };
  if (has(norm, ["help", "madad", "what can you do", "मदद", "हेल्प"])) return { type: "help" };
  if (has(norm, ["logout", "log out", "sign out", "signout", "साइन आउट", "लॉग आउट"])) return { type: "logout" };
  if (has(norm, ["back", "go back", "wapas", "peeche", "पीछे", "वापस"])) return { type: "back" };
  if (has(norm, ["scroll down", "niche", "neeche", "नीचे", "down"])) return { type: "scroll", dir: "down" };
  if (has(norm, ["scroll up", "upar", "ऊपर", "up"])) return { type: "scroll", dir: "up" };
  if (has(norm, ["send", "bhejo", "bhej do", "भेजो", "भेज दो"])) return { type: "click", label: "send" };

  if (
    has(norm, ["whats in front of me", "what is in front of me", "in front of me", "describe", "surroundings", "saamne", "samne", "aas paas", "aaspaas", "dekho", "सामने", "देखो", "आसपास", "क्या दिख"]) ||
    norm.includes("सामने क्या")
  )
    return { type: "describe_camera" };

  if (has(norm, ["options", "buttons", "what can i press", "kya kar sakta hu", "kaun se button", "विकल्प", "बटन", "कौन से बटन"])) return { type: "list_options" };
  if (has(norm, ["read", "read page", "read this", "padho", "padh do", "sunao", "पढ़ो", "पढ़", "सुनाओ"])) return { type: "read_page" };

  // Navigation: longest matching keyword wins ("impact access" beats "impact").
  const padded = ` ${norm} `;
  let best: { path: string; len: number } | null = null;
  for (const page of PAGES) {
    for (const k of page.keys) {
      const kn = normalize(k);
      if (padded.includes(` ${kn} `) && (!best || kn.length > best.len)) best = { path: page.path, len: kn.length };
    }
  }
  if (best) {
    const words = norm.split(" ").length;
    if (has(norm, NAV_VERBS) || words <= 3) return { type: "navigate", path: best.path };
  }

  return { type: "unknown", text: raw };
}
