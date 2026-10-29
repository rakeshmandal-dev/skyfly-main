// Sathi (Accessibility Agent) — memory that lives in the browser (localStorage).
// No database migration needed. Habits are learned from how the student uses the app.

export type AccessMode = "blind" | "deaf" | "mute";
export type AgentLang = "hi-IN" | "en-IN";

export type AgentMemory = {
  setupDone: boolean;
  modes: AccessMode[];
  lang: AgentLang;
  /** Speech speed 0.6 (slow) – 1.4 (fast). */
  rate: number;
  /** Agent speaks its answers aloud (turn off if the student uses their own screen reader). */
  speakAloud: boolean;
  /** After the agent finishes talking it listens again automatically. */
  handsFree: boolean;
  /** page -> number of visits */
  visits: Record<string, number>;
  /** 3-hour block -> page -> visits (learns "at this time I usually open X") */
  hourly: Record<string, Record<string, number>>;
  /** from page -> to page -> count (learns "after Notes I open Quiz") */
  transitions: Record<string, Record<string, number>>;
  /** Quick phrases for students who cannot speak. */
  phrases: string[];
};

export const DEFAULT_PHRASES = [
  "Please repeat that",
  "I have a doubt",
  "Yes",
  "No",
  "Thank you",
  "Please wait",
  "मुझे मदद चाहिए",
  "धन्यवाद",
];

export const DEFAULT_MEMORY: AgentMemory = {
  setupDone: false,
  modes: [],
  lang: "hi-IN",
  rate: 0.95,
  speakAloud: true,
  handsFree: false,
  visits: {},
  hourly: {},
  transitions: {},
  phrases: DEFAULT_PHRASES,
};

const key = (userId: string) => `eduvault.sathi.v1.${userId}`;

export function loadMemory(userId: string): AgentMemory {
  if (typeof window === "undefined") return DEFAULT_MEMORY;
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return DEFAULT_MEMORY;
    return { ...DEFAULT_MEMORY, ...(JSON.parse(raw) as Partial<AgentMemory>) };
  } catch {
    return DEFAULT_MEMORY;
  }
}

export function saveMemory(userId: string, m: AgentMemory) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(m));
  } catch {
    /* storage full or blocked — agent still works, just forgets */
  }
}

const hourBlock = () => String(Math.floor(new Date().getHours() / 3));

/** Learn from a page change. */
export function recordVisit(m: AgentMemory, from: string | null, to: string): AgentMemory {
  const visits = { ...m.visits, [to]: (m.visits[to] ?? 0) + 1 };
  const b = hourBlock();
  const hourly = { ...m.hourly, [b]: { ...(m.hourly[b] ?? {}), [to]: (m.hourly[b]?.[to] ?? 0) + 1 } };
  const transitions = { ...m.transitions };
  if (from && from !== to) {
    transitions[from] = { ...(transitions[from] ?? {}), [to]: (transitions[from]?.[to] ?? 0) + 1 };
  }
  return { ...m, visits, hourly, transitions };
}

function top(counts: Record<string, number> | undefined, min: number, exclude: string) {
  if (!counts) return null;
  let best: string | null = null;
  let bestN = 0;
  for (const [path, n] of Object.entries(counts)) {
    if (path === exclude || n < min) continue;
    if (n > bestN) {
      best = path;
      bestN = n;
    }
  }
  return best;
}

/** "After this page the student usually opens …" */
export const suggestNext = (m: AgentMemory, current: string) => top(m.transitions[current], 2, current);

/** "At this time of day the student usually opens …" */
export const suggestByTime = (m: AgentMemory, current: string) => top(m.hourly[hourBlock()], 3, current);
