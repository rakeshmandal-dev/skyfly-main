export type TeachLanguage = {
  /** English name used in AI prompts. */
  name: string;
  /** Native/endonym label shown in the picker. */
  native: string;
  /** BCP-47 tag handed to speech synthesis. */
  code: string;
};

/** Every Indian scheduled language we support, plus Indian English. */
export const LANGUAGES: TeachLanguage[] = [
  { name: "English", native: "English (India)", code: "en-IN" },
  { name: "Hindi", native: "हिन्दी", code: "hi-IN" },
  { name: "Bengali", native: "বাংলা", code: "bn-IN" },
  { name: "Tamil", native: "தமிழ்", code: "ta-IN" },
  { name: "Telugu", native: "తెలుగు", code: "te-IN" },
  { name: "Marathi", native: "मराठी", code: "mr-IN" },
  { name: "Gujarati", native: "ગુજરાતી", code: "gu-IN" },
  { name: "Kannada", native: "ಕನ್ನಡ", code: "kn-IN" },
  { name: "Malayalam", native: "മലയാളം", code: "ml-IN" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ", code: "pa-IN" },
  { name: "Odia", native: "ଓଡ଼ିଆ", code: "or-IN" },
  { name: "Urdu", native: "اردو", code: "ur-IN" },
  { name: "Assamese", native: "অসমীয়া", code: "as-IN" },
  { name: "Konkani", native: "कोंकणी", code: "kok-IN" },
  { name: "Maithili", native: "मैथिली", code: "mai-IN" },
  { name: "Sanskrit", native: "संस्कृतम्", code: "sa-IN" },
  { name: "Nepali", native: "नेपाली", code: "ne-IN" },
  { name: "Sindhi", native: "سنڌي", code: "sd-IN" },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0]!;

/**
 * Languages that share a script / are mutually intelligible enough that their
 * browser voice is an acceptable stand-in when the exact voice is missing.
 */
const NEIGHBOURS: Record<string, string[]> = {
  "hi-IN": ["mr-IN", "ne-IN", "sa-IN", "kok-IN", "mai-IN", "ur-IN"],
  "mr-IN": ["hi-IN", "sa-IN", "kok-IN"],
  "kok-IN": ["mr-IN", "hi-IN"],
  "mai-IN": ["hi-IN", "bn-IN"],
  "sa-IN": ["hi-IN", "mr-IN"],
  "ne-IN": ["hi-IN", "mr-IN"],
  "as-IN": ["bn-IN"],
  "bn-IN": ["as-IN"],
  "or-IN": ["bn-IN", "hi-IN"],
  "ur-IN": ["hi-IN", "sd-IN"],
  "sd-IN": ["ur-IN", "hi-IN"],
  "pa-IN": ["hi-IN"],
  "gu-IN": ["hi-IN"],
  "en-IN": ["en-GB", "en-US"],
};

export type VoiceMatch = {
  voice: SpeechSynthesisVoice | null;
  /** exact = same tag, language = same language other region, related = closest cousin, none = default voice */
  quality: "exact" | "language" | "related" | "none";
  /** Language the fallback voice actually speaks, when it isn't the requested one. */
  fallbackOf?: string;
};

function label(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

/** Picks the best available browser voice for a BCP-47 tag. */
export function matchVoice(voices: SpeechSynthesisVoice[], code: string): VoiceMatch {
  const norm = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
  const wanted = code.toLowerCase();
  const base = wanted.split("-")[0] ?? wanted;

  const exact = voices.find((v) => norm(v) === wanted);
  if (exact) return { voice: exact, quality: "exact" };

  const sameLanguage = voices.find((v) => norm(v).startsWith(base + "-") || norm(v) === base);
  if (sameLanguage) return { voice: sameLanguage, quality: "language" };

  for (const cousin of NEIGHBOURS[code] ?? []) {
    const cousinBase = cousin.toLowerCase().split("-")[0]!;
    const found = voices.find((v) => norm(v) === cousin.toLowerCase() || norm(v).startsWith(cousinBase + "-"));
    if (found) return { voice: found, quality: "related", fallbackOf: label(cousin) };
  }

  const indian = voices.find((v) => norm(v).endsWith("-in"));
  if (indian) return { voice: indian, quality: "related", fallbackOf: indian.name };

  return { voice: voices[0] ?? null, quality: "none" };
}
