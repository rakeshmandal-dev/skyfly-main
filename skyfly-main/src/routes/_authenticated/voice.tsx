import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  VolumeX,
  AudioLines,
  PhoneOff,
  Play,
  Pause,
  Square,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { speakAnswer } from "@/lib/ai-learning.functions";
import { useAccessibility } from "@/lib/accessibility";

export const Route = createFileRoute("/_authenticated/voice")({
  component: VoiceTeacher,
  head: () => ({
    meta: [
      { title: "Voice AI Teacher — EduVault AI" },
      {
        name: "description",
        content: "Accessible, voice-enabled AI tutor for blind and low-vision students with English and Hindi speech.",
      },
      { property: "og:title", content: "Voice AI Teacher — EduVault AI" },
      {
        property: "og:description",
        content: "Accessible, voice-enabled AI tutor for blind and low-vision students with English and Hindi speech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SUBJECTS = ["Any subject", "Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science"];

type Lang = { label: string; code: string; prompt: string };

const ENGLISH: Lang = { label: "English", code: "en-IN", prompt: "English" };
const HINDI: Lang = { label: "Hindi", code: "hi-IN", prompt: "Hindi (Devanagari script)" };
const BENGALI: Lang = { label: "Bengali", code: "bn-IN", prompt: "Bengali" };
const TAMIL: Lang = { label: "Tamil", code: "ta-IN", prompt: "Tamil" };
const TELUGU: Lang = { label: "Telugu", code: "te-IN", prompt: "Telugu" };
const GUJARATI: Lang = { label: "Gujarati", code: "gu-IN", prompt: "Gujarati" };
const PUNJABI: Lang = { label: "Punjabi", code: "pa-IN", prompt: "Punjabi" };

const SCRIPTS: { lang: Lang; re: RegExp }[] = [
  { lang: HINDI, re: /[\u0900-\u097F]/ }, // Devanagari
  { lang: BENGALI, re: /[\u0980-\u09FF]/ },
  { lang: PUNJABI, re: /[\u0A00-\u0A7F]/ },
  { lang: GUJARATI, re: /[\u0A80-\u0AFF]/ },
  { lang: TAMIL, re: /[\u0B80-\u0BFF]/ },
  { lang: TELUGU, re: /[\u0C00-\u0C7F]/ },
];

function detectLanguage(text: string): Lang {
  const t = text.trim();
  if (!t) return ENGLISH;
  for (const s of SCRIPTS) {
    if (s.re.test(t)) return s.lang;
  }
  return ENGLISH;
}

const SILENCE_MS = 15000;

type Turn = { id: string; role: "you" | "teacher"; text: string; timestamp: Date };

export function VoiceTeacher() {
  const ask = useServerFn(speakAnswer);
  const { announce } = useAccessibility();

  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>("auto");
  const [detectedLabel, setDetectedLabel] = useState<string>("Auto-detect");
  const [conversation, setConversation] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [lastTeacherSpeech, setLastTeacherSpeech] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const convRef = useRef(false);
  const draftRef = useRef("");
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendRef = useRef<(q: string) => void>(() => {});
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const langRef = useRef<Lang>(ENGLISH);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const clearSilence = () => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = null;
  };

  const stopConversation = useCallback(() => {
    convRef.current = false;
    setConversation(false);
    clearSilence();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setIsPaused(false);
    announce("Voice conversation stopped.");
  }, [announce]);

  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    setDraft("");
    draftRef.current = "";
    try {
      // Pick recognition language based on selection
      if (selectedLanguageCode === "hi-IN") {
        rec.lang = "hi-IN";
      } else if (selectedLanguageCode === "en-US") {
        rec.lang = "en-US";
      } else {
        rec.lang = "en-IN";
      }
      rec.start();
      setListening(true);
      setNotice(null);
      announce("Microphone active. Please speak your doubt now.");
      clearSilence();
      silenceRef.current = setTimeout(() => {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        if (convRef.current && !draftRef.current.trim()) {
          const timeoutMsg = "No speech detected for 15 seconds. Microphone paused to preserve privacy.";
          setNotice(timeoutMsg);
          announce(timeoutMsg);
          convRef.current = false;
          setConversation(false);
        }
      }, SILENCE_MS);
    } catch {
      /* already started */
    }
  }, [announce, selectedLanguageCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
    if (!SR) {
      setSupported(false);
      setNotice("Speech recognition is not supported in this browser. Please use the accessible text input below.");
      return;
    }
    const rec = new SR();
    rec.lang = selectedLanguageCode === "hi-IN" ? "hi-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      setHasMicPermission(true);
    };

    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setDraft(text);
      draftRef.current = text;
      setNotice(null);
    };

    rec.onend = () => {
      setListening(false);
      clearSilence();
      const said = draftRef.current.trim();
      if (said) {
        announce(`Question captured: ${said}`);
        sendRef.current(said);
      }
    };

    rec.onerror = (e: any) => {
      setListening(false);
      clearSilence();
      const err = String(e?.error ?? "");
      if (err === "no-speech") return;
      convRef.current = false;
      setConversation(false);
      if (err === "not-allowed" || err === "permission-denied") {
        setHasMicPermission(false);
        const errMsg = "Microphone access was denied. Please allow microphone permissions in your browser or type your question below.";
        setNotice(errMsg);
        announce(errMsg, "assertive");
      } else {
        const errMsg = `Speech recognition encountered an issue (${err}). You can still ask by typing below.`;
        setNotice(errMsg);
        announce(errMsg);
      }
    };

    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      clearSilence();
      window.speechSynthesis?.cancel();
    };
  }, [announce, selectedLanguageCode]);

  function pickBestVoice(voices: SpeechSynthesisVoice[], langCode: string) {
    if (!voices.length) return null;
    const lang = langCode.split("-")[0].toLowerCase();
    const exact = voices.filter((v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
    const base = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
    const matched = exact.length ? exact : base;

    if (!matched.length) {
      if (lang !== "en") return voices.find((v) => !v.localService) ?? voices[0];
    }
    const pool = matched.length ? matched : voices;

    const preferred = [
      "Google हिन्दी",
      "Google UK English Female",
      "Google US English",
      "Microsoft Zira",
      "Microsoft Hazel",
      "Microsoft Kalpana",
      "Microsoft Hemant",
      "Samantha",
      "Rishi",
      "Veena",
    ];
    for (const name of preferred) {
      const found = pool.find((v) => v.name.includes(name));
      if (found) return found;
    }
    return pool.find((v) => !v.localService) ?? pool[0];
  }

  function ensureVoice() {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    if (voiceRef.current) return voiceRef.current;
    const best = pickBestVoice(window.speechSynthesis.getVoices(), langRef.current.code);
    voiceRef.current = best;
    return best;
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      voiceRef.current = pickBestVoice(window.speechSynthesis.getVoices(), langRef.current.code);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    voiceRef.current = pickBestVoice(window.speechSynthesis.getVoices(), langRef.current.code);
  }, [detectedLabel, selectedLanguageCode]);

  function speak(text: string) {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) {
      if (convRef.current) startListening();
      return;
    }
    window.speechSynthesis.cancel();
    setLastTeacherSpeech(text);

    // Split into comfortable sentence chunks so SpeechSynthesis does not time out on Chrome
    const chunks =
      text.match(/[^.!?।\n]+[.!?।]*\s*/g)?.reduce<string[]>((acc, s) => {
        const last = acc[acc.length - 1];
        if (last && (last + s).length < 200) acc[acc.length - 1] = last + s;
        else acc.push(s);
        return acc;
      }, []) ?? [text];

    const voice = ensureVoice();

    chunks.forEach((chunk, idx) => {
      const u = new SpeechSynthesisUtterance(chunk.trim());
      u.lang = langRef.current.code;
      u.rate = speechRate;
      u.pitch = 1;
      if (voice) u.voice = voice;

      if (idx === 0) {
        u.onstart = () => {
          setSpeaking(true);
          setIsPaused(false);
          announce("Teacher is speaking aloud.", "polite");
        };
      }

      if (idx === chunks.length - 1) {
        const done = () => {
          setSpeaking(false);
          setIsPaused(false);
          announce("Speech finished.", "polite");
          if (convRef.current) startListening();
        };
        u.onend = done;
        u.onerror = done;
      }

      window.speechSynthesis.speak(u);
    });
  }

  const pauseAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      announce("Audio paused.");
    }
  };

  const resumeAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      announce("Audio resumed.");
    }
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setIsPaused(false);
      announce("Audio stopped.");
    }
  };

  const replayLastAudio = () => {
    if (lastTeacherSpeech) {
      speak(lastTeacherSpeech);
    }
  };

  async function send(question: string) {
    const q = question.trim();
    if (!q || thinking) return;

    let targetLang: Lang;
    if (selectedLanguageCode === "hi-IN") {
      targetLang = HINDI;
    } else if (selectedLanguageCode === "en-IN" || selectedLanguageCode === "en-US") {
      targetLang = ENGLISH;
    } else {
      targetLang = detectLanguage(q);
    }

    langRef.current = targetLang;
    setDetectedLabel(targetLang.label);
    const newTurnId = crypto.randomUUID();
    setTurns((t) => [...t, { id: newTurnId, role: "you", text: q, timestamp: new Date() }]);
    setDraft("");
    draftRef.current = "";
    setThinking(true);
    announce("Thinking... AI is generating your spoken answer.", "polite");

    try {
      const res = await ask({
        data: {
          question: q,
          subject: subject === SUBJECTS[0] ? undefined : subject,
          language: targetLang.prompt,
        },
      });
      setTurns((t) => [
        ...t,
        { id: crypto.randomUUID(), role: "teacher", text: res.text, timestamp: new Date() },
      ]);
      announce(`Teacher replied: ${res.text}`);
      speak(res.text);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Could not answer that. Please try again.";
      toast.error(errMessage);
      announce(`Error: ${errMessage}`, "assertive");
      if (convRef.current) startListening();
    } finally {
      setThinking(false);
    }
  }
  sendRef.current = send;

  function toggleMic() {
    if (listening) {
      stopConversation();
      return;
    }
    setNotice(null);
    window.speechSynthesis?.cancel();
    convRef.current = true;
    setConversation(true);
    startListening();
  }

  const currentStatus = speaking
    ? isPaused
      ? "paused"
      : "speaking"
    : listening
      ? "listening"
      : thinking
        ? "processing"
        : "idle";

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-10">
      {/* Header with Semantic Accessibility */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            <AudioLines className="h-7 w-7 text-primary" aria-hidden="true" />
            <span>Voice AI Learning Assistant</span>
          </h1>
          <div className="flex items-center gap-2">
            <div
              role="status"
              aria-live="polite"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                currentStatus === "listening"
                  ? "bg-red-500/10 text-red-500 border border-red-500/30"
                  : currentStatus === "speaking"
                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                    : currentStatus === "processing"
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                      : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  currentStatus === "listening"
                    ? "bg-red-500 animate-ping"
                    : currentStatus === "speaking"
                      ? "bg-blue-500"
                      : currentStatus === "processing"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-muted-foreground"
                }`}
                aria-hidden="true"
              />
              <span className="capitalize">Status: {currentStatus}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Voice-enabled doubts solving in English & Hindi. Optimized for screen readers, keyboard navigation, and auditory study.
        </p>
      </header>

      {/* Security & Explicit Consent Notice */}
      <div
        role="region"
        aria-label="Microphone privacy and consent policy"
        className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
        <p>
          <strong className="text-foreground">Privacy Protection:</strong> The microphone records only when you explicitly tap or trigger the button. Recordings are never kept running in the background and automatically stop after 15 seconds of silence.
        </p>
      </div>

      {/* Error / Warning Notice Banner */}
      {notice && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-4 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs font-semibold underline hover:no-underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Voice Assistant Interaction Stage */}
      <section
        aria-label="Voice conversation avatar and controls"
        className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 shadow-sm"
      >
        {/* Animated Avatar / Orb */}
        <div className="relative grid h-44 w-44 place-items-center">
          <span
            className={`absolute inset-0 rounded-full brand-bg opacity-20 transition-all ${
              currentStatus === "speaking"
                ? "animate-ping [animation-duration:0.8s]"
                : currentStatus === "listening"
                  ? "animate-ping [animation-duration:1.5s]"
                  : ""
            }`}
            aria-hidden="true"
          />
          <span
            className={`absolute inset-4 rounded-full brand-bg opacity-30 blur-md transition-transform duration-300 ${
              currentStatus === "speaking"
                ? "scale-125 animate-pulse"
                : currentStatus === "listening"
                  ? "scale-110 animate-pulse"
                  : currentStatus === "processing"
                    ? "animate-pulse"
                    : "scale-100"
            }`}
            aria-hidden="true"
          />
          <button
            onClick={toggleMic}
            disabled={!supported}
            aria-label={
              currentStatus === "listening"
                ? "Microphone listening. Tap or press Enter to stop."
                : currentStatus === "processing"
                  ? "AI is thinking. Please wait."
                  : "Start voice question. Tap or press Enter to speak."
            }
            className={`relative grid h-28 w-28 place-items-center rounded-full text-white shadow-xl transition-all duration-200 focus-visible:ring-4 focus-visible:ring-primary focus-visible:outline-none ${
              currentStatus === "listening"
                ? "bg-destructive scale-105 ring-4 ring-destructive/40"
                : currentStatus === "speaking"
                  ? "brand-bg ring-4 ring-primary/40"
                  : "brand-bg hover:scale-105 active:scale-95"
            } disabled:opacity-40`}
          >
            {thinking ? (
              <Loader2 className="h-10 w-10 animate-spin" aria-hidden="true" />
            ) : currentStatus === "listening" ? (
              <MicOff className="h-10 w-10" aria-hidden="true" />
            ) : (
              <Mic className="h-10 w-10" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* State Announcement text */}
        <p className="mt-4 text-base font-medium text-foreground text-center" aria-live="polite">
          {currentStatus === "speaking"
            ? isPaused
              ? "Audio is paused"
              : "Teacher is answering aloud..."
            : currentStatus === "listening"
              ? "Listening... ask your question now."
              : currentStatus === "processing"
                ? "Thinking and preparing your lesson..."
                : conversation
                  ? "Conversation mode is active. Tap mic to speak again."
                  : "Tap the microphone or press Enter to begin."}
        </p>

        {/* Text-to-Speech Playback Controls (Play, Pause, Resume, Stop, Speed) */}
        <div
          role="group"
          aria-label="Speech playback controls"
          className="mt-6 flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-border bg-background/80 p-2.5"
        >
          {speaking && !isPaused && (
            <button
              onClick={pauseAudio}
              aria-label="Pause audio playback"
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Pause className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Pause</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={resumeAudio}
              aria-label="Resume audio playback"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Resume</span>
            </button>
          )}

          {(speaking || isPaused) && (
            <button
              onClick={stopAudio}
              aria-label="Stop audio playback"
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Stop</span>
            </button>
          )}

          {lastTeacherSpeech && !speaking && (
            <button
              onClick={replayLastAudio}
              aria-label="Replay last answer aloud"
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Replay answer</span>
            </button>
          )}

          {/* Speech Rate Control */}
          <div className="flex items-center gap-1 pl-2 border-l border-border">
            <span id="rate-label" className="text-xs text-muted-foreground">Speed:</span>
            {([0.8, 1.0, 1.25] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSpeechRate(r);
                  announce(`Speech speed set to ${r}x`);
                }}
                aria-pressed={speechRate === r}
                className={`rounded-lg px-2 py-1 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-primary ${
                  speechRate === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>

          {/* Mute Voice Toggle */}
          <button
            onClick={() => {
              setMuted((m) => !m);
              window.speechSynthesis?.cancel();
              announce(muted ? "Voice narration turned on" : "Voice narration muted");
            }}
            aria-label={muted ? "Unmute voice response" : "Mute voice response"}
            className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 text-destructive" aria-hidden="true" /> : <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{muted ? "Muted" : "Sound on"}</span>
          </button>

          {conversation && (
            <button
              onClick={stopConversation}
              aria-label="End conversation and disconnect microphone"
              className="flex items-center gap-1.5 rounded-xl bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>End conversation</span>
            </button>
          )}
        </div>
      </section>

      {/* Controls: Subject & Language Selection */}
      <section
        aria-label="Study configuration options"
        className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3"
      >
        {/* Subject Filter */}
        <div className="space-y-1">
          <label htmlFor="subject-select" className="text-xs font-semibold text-muted-foreground">
            Subject Focus
          </label>
          <select
            id="subject-select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Language Selection: English / Hindi / Auto */}
        <div className="space-y-1">
          <label htmlFor="language-select" className="text-xs font-semibold text-muted-foreground">
            Spoken Language
          </label>
          <select
            id="language-select"
            value={selectedLanguageCode}
            onChange={(e) => {
              setSelectedLanguageCode(e.target.value);
              announce(`Language preference set to ${e.target.value}`);
            }}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="auto">Auto-detect from Speech (Indian English & Hindi)</option>
            <option value="en-IN">English (India) — en-IN</option>
            <option value="hi-IN">Hindi (हिन्दी) — hi-IN</option>
            <option value="en-US">English (US) — en-US</option>
          </select>
        </div>

        {/* Detected Script Indicator */}
        <div className="space-y-1 sm:col-span-2 md:col-span-1">
          <span className="text-xs font-semibold text-muted-foreground">Detected Dialect</span>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 text-xs text-foreground">
            <AudioLines className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate">Active: <strong>{detectedLabel}</strong></span>
          </div>
        </div>
      </section>

      {/* Conversation Turns / Transcript with Screen Reader Landmark */}
      <section
        aria-label="Conversation dialogue history"
        role="log"
        aria-live="polite"
        className="mt-6 space-y-3"
      >
        <h2 className="sr-only">Conversation Transcript</h2>
        {turns.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            <p>Your dialogue history will appear here. Press the microphone button above or type your doubt below.</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Try asking: <em>"Explain photosynthesis in simple words"</em> or <em>"न्यूटन का दूसरा नियम समझाइए"</em>.
            </p>
          </div>
        )}

        {turns.map((t) => (
          <article
            key={t.id}
            tabIndex={0}
            aria-label={`${t.role === "you" ? "You asked" : "Teacher answered"}: ${t.text}`}
            className={`max-w-[85%] rounded-2xl border p-4 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              t.role === "you"
                ? "ml-auto brand-bg border-transparent text-white shadow-sm"
                : "bg-card border-border text-card-foreground shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 opacity-80 text-xs font-semibold">
              <span>{t.role === "you" ? "👤 You" : "🎓 AI Teacher"}</span>
              <time className="text-[10px]">
                {t.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </time>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{t.text}</p>
          </article>
        ))}
      </section>

      {/* Fallback & Primary Text Input Form for Accessibility */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        aria-label="Send a question using keyboard or text input"
        className="mt-6 flex flex-col sm:flex-row items-end gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
      >
        <div className="flex-1 w-full space-y-1">
          <label htmlFor="voice-text-fallback" className="text-xs font-semibold text-muted-foreground">
            Type your doubt (Keyboard fallback)
          </label>
          <textarea
            id="voice-text-fallback"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={2}
            placeholder={listening ? "Listening... or type here anytime" : "Type your question here (Press Enter to submit)..."}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={toggleMic}
            disabled={!supported}
            aria-label={listening ? "Stop microphone" : "Start microphone"}
            className={`grid h-11 w-11 place-items-center rounded-xl text-white transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              listening ? "bg-destructive animate-pulse" : "brand-bg"
            } disabled:opacity-40`}
            title={listening ? "Stop listening" : "Start speech input"}
          >
            {listening ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
          </button>

          <button
            type="submit"
            disabled={!draft.trim() || thinking}
            className="h-11 rounded-xl brand-bg px-5 text-sm font-semibold text-white shadow-glow hover:opacity-90 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition"
          >
            {thinking ? "Thinking..." : "Ask Question"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VoiceTeacher;
