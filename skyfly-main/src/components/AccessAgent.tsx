import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Accessibility, BookOpen, Camera, Captions, Check, Mic, MicOff, Send, Settings2, Square, Volume2, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { useSpeech } from "@/lib/speech";
import { agentDecide, describeScene, type AgentDecision } from "@/lib/access-agent.functions";
import {
  loadMemory, recordVisit, saveMemory, suggestByTime, suggestNext,
  type AccessMode, type AgentLang, type AgentMemory,
} from "@/lib/access-agent/memory";
import { PAGES, pageLabel } from "@/lib/access-agent/pages";
import { parseCommand, type Intent } from "@/lib/access-agent/commands";
import { langFor, strings } from "@/lib/access-agent/strings";
import {
  captureFrame, fillInput, findClickable, interactiveLabels, pageHeading, pageText, scrollPage,
} from "@/lib/access-agent/dom";

/**
 * Sathi — an accessibility agent for students who cannot see, hear or speak.
 *  • Blind: speaks everything, understands voice commands, reads pages, describes the camera view.
 *  • Deaf: captions for the agent, for the app's own speech (3D teacher) and for people around (microphone).
 *  • Mute: type or tap quick phrases and Sathi speaks for the student.
 * It learns habits (stored on the device) and suggests the next step — but always asks before acting.
 */

type LogLine = { id: number; who: "you" | "agent"; text: string };
type CaptionLine = { id: number; kind: "room" | "app"; text: string };
type Pending = { run: () => Promise<void> | void };

const MODE_INFO: { mode: AccessMode; key: string; title: string; hint: string }[] = [
  { mode: "blind", key: "1", title: "I cannot see", hint: "Voice control, reads the screen aloud" },
  { mode: "deaf", key: "2", title: "I cannot hear", hint: "Live captions and visual alerts" },
  { mode: "mute", key: "3", title: "I cannot speak", hint: "Type or tap phrases, Sathi speaks for me" },
];

export function AccessAgent({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const decide = useServerFn(agentDecide);
  const describe = useServerFn(describeScene);
  const speech = useSpeech();

  const [memory, setMemory] = useState<AgentMemory>(() => loadMemory(userId));
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [lastSaid, setLastSaid] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [loopOn, setLoopOn] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionLines, setCaptionLines] = useState<CaptionLine[]>([]);
  const [liveCaption, setLiveCaption] = useState("");
  const [miniCaption, setMiniCaption] = useState("");
  const [flash, setFlash] = useState(false);

  // Always-fresh values for callbacks that run later (timers, speech events, keyboard).
  const memRef = useRef(memory);
  memRef.current = memory;
  const speechRef = useRef(speech);
  speechRef.current = speech;
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const busyRef = useRef(false);
  const pendingRef = useRef<Pending | null>(null);
  const lastSaidRef = useRef("");
  const navLabelRef = useRef<string | null>(null);
  const prevPathRef = useRef<string | null>(null);
  const lastSuggestRef = useRef(0);
  const errCount = useRef(0);
  const idRef = useRef(0);
  const miniTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const isBlind = memory.modes.includes("blind");
  const isDeaf = memory.modes.includes("deaf");
  const isMute = memory.modes.includes("mute");
  const canVoice = !isMute;
  const S = strings(memory.lang);

  useEffect(() => {
    saveMemory(userId, memory);
  }, [userId, memory]);

  // ───────────────────────── talking ─────────────────────────

  function addLog(who: LogLine["who"], text: string) {
    setLog((l) => [...l.slice(-5), { id: ++idRef.current, who, text }]);
  }

  /** Everything Sathi says goes through here: log, speech, captions, vibration. */
  function say(text: string, opts?: { force?: boolean }) {
    const m = memRef.current;
    lastSaidRef.current = text;
    setLastSaid(text);
    addLog("agent", text);
    if (m.modes.includes("deaf")) {
      setFlash(true);
      setTimeout(() => setFlash(false), 450);
      try {
        navigator.vibrate?.(70);
      } catch {
        /* not supported */
      }
      setMiniCaption(text.slice(0, 220));
      clearTimeout(miniTimer.current);
      miniTimer.current = setTimeout(() => setMiniCaption(""), 10000);
    }
    if (m.speakAloud || opts?.force) {
      speechRef.current.speak(text, langFor(text, m.lang), undefined, m.rate);
    }
  }

  function pushCaption(kind: CaptionLine["kind"], text: string) {
    setCaptionLines((l) => [...l.slice(-5), { id: ++idRef.current, kind, text }]);
    if (kind === "app") {
      setMiniCaption(text.slice(0, 220));
      clearTimeout(miniTimer.current);
      miniTimer.current = setTimeout(() => setMiniCaption(""), 8000);
    }
  }

  /** Mute students: speak typed text or a phrase out loud. */
  function speakOut(text: string) {
    const t = text.trim();
    if (!t) return;
    addLog("you", `Spoken: ${t}`);
    speechRef.current.speak(t, langFor(t, memRef.current.lang), undefined, memRef.current.rate);
  }

  // ───────────────────────── hands ─────────────────────────

  function goTo(path: string): boolean {
    const page = PAGES.find((p) => p.path === path);
    if (!page) return false;
    const m = memRef.current;
    const label = pageLabel(page, m.lang === "hi-IN");
    if (pathRef.current === path) {
      say(strings(m.lang).opened(label));
      return true;
    }
    navLabelRef.current = label;
    navigate({ to: path as never });
    return true;
  }

  function askToConfirm(text: string, run: Pending["run"]) {
    pendingRef.current = { run };
    setPendingText(text);
    setOpen(true);
    say(text);
  }

  function runClick(label: string) {
    const T = strings(memRef.current.lang);
    const target = findClickable(label);
    if (!target) {
      say(T.notFound(label));
      return;
    }
    if (target.risky) {
      askToConfirm(T.confirmRisky(target.label), () => {
        target.click();
        say(T.clicked(target.label));
      });
      return;
    }
    target.click();
    say(T.clicked(target.label));
  }

  function readPage() {
    const T = strings(memRef.current.lang);
    const t = pageText(1400);
    say(t || T.emptyPage);
  }

  function listOptions() {
    const T = strings(memRef.current.lang);
    const labels = interactiveLabels(10);
    say(labels.length ? `${T.optionsIntro} ${labels.join(", ")}.` : T.noOptions);
  }

  async function describeCamera() {
    const T = strings(memRef.current.lang);
    say(T.cameraWorking);
    const img = await captureFrame();
    if (!img) {
      say(T.cameraFail);
      return;
    }
    setBusy(true);
    busyRef.current = true;
    try {
      const r = await describe({ data: { imageDataUrl: img, lang: memRef.current.lang } });
      say(r.text);
    } catch {
      say(T.aiFail);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }

  async function runAction(res: AgentDecision) {
    const T = strings(memRef.current.lang);
    const a = res.action;
    switch (a.type) {
      case "navigate":
        if (!(a.path && goTo(a.path))) say(res.say);
        return;
      case "click":
        if (a.label) runClick(a.label);
        else say(res.say);
        return;
      case "fill":
        if (a.text) say(fillInput(a.text) ? T.filled : T.noInput);
        else say(res.say);
        return;
      case "read_page":
        readPage();
        return;
      case "describe_camera":
        await describeCamera();
        return;
      default:
        say(res.say);
    }
  }

  /** The agent's own thinking: anything the local command parser did not understand. */
  async function askBrain(text: string) {
    const T = strings(memRef.current.lang);
    setBusy(true);
    busyRef.current = true;
    try {
      const m = memRef.current;
      const habits = Object.entries(m.visits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([p, n]) => `${p} (${n}x)`)
        .join(", ");
      const res = await decide({
        data: {
          text,
          lang: m.lang,
          modes: m.modes,
          currentPath: pathRef.current,
          pages: PAGES.map((p) => ({ path: p.path, label: p.label })),
          pageHeading: pageHeading(),
          pageText: pageText(700),
          habits,
          history: historyRef.current,
        },
      });
      historyRef.current = [
        ...historyRef.current,
        { role: "user" as const, content: text },
        { role: "assistant" as const, content: res.say },
      ].slice(-8);
      setBusy(false);
      busyRef.current = false;
      await runAction(res);
    } catch {
      say(T.aiFail);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }

  async function execute(intent: Intent) {
    const m = memRef.current;
    const T = strings(m.lang);
    switch (intent.type) {
      case "stop":
        speechRef.current.stop();
        return;
      case "mic_off":
        rec.stopListening();
        setLoopOn(false);
        say(T.micOff);
        return;
      case "repeat":
        say(lastSaidRef.current || T.nothingRepeat);
        return;
      case "slower":
        setMemory((x) => ({ ...x, rate: Math.max(0.6, +(x.rate - 0.15).toFixed(2)) }));
        say(T.slower);
        return;
      case "faster":
        setMemory((x) => ({ ...x, rate: Math.min(1.4, +(x.rate + 0.15).toFixed(2)) }));
        say(T.faster);
        return;
      case "help":
        say(T.help);
        return;
      case "read_page":
        readPage();
        return;
      case "list_options":
        listOptions();
        return;
      case "describe_camera":
        await describeCamera();
        return;
      case "back":
        window.history.back();
        return;
      case "scroll":
        scrollPage(intent.dir);
        return;
      case "logout":
        askToConfirm(T.confirmLogout, async () => {
          await supabase.auth.signOut();
          say(T.signedOut);
          navigate({ to: "/auth", replace: true });
        });
        return;
      case "click":
        runClick(intent.label);
        return;
      case "fill":
        say(fillInput(intent.text) ? T.filled : T.noInput);
        return;
      case "navigate":
        goTo(intent.path);
        return;
      case "yes":
      case "no":
        return;
      default:
        await askBrain(intent.text);
    }
  }

  async function handleUtterance(raw: string) {
    const text = raw.trim();
    if (!text) return;
    errCount.current = 0;
    addLog("you", text);
    speechRef.current.stop();
    const T = strings(memRef.current.lang);
    const awaiting = pendingRef.current;
    const intent = parseCommand(text, !!awaiting);
    if (awaiting) {
      pendingRef.current = null;
      setPendingText(null);
      if (intent.type === "yes") {
        await awaiting.run();
        return;
      }
      if (intent.type === "no" || intent.type === "stop") {
        say(T.cancelled);
        return;
      }
      // anything else = a brand new command; fall through
    }
    await execute(intent);
  }

  async function answerPending(yes: boolean) {
    const p = pendingRef.current;
    pendingRef.current = null;
    setPendingText(null);
    if (yes && p) await p.run();
    else say(strings(memRef.current.lang).cancelled);
  }

  // Latest versions of the functions, for effects/timers/speech callbacks.
  const fns = useRef({ handleUtterance, announcePage, maybeSuggest, offer, micPress, hardStop });
  fns.current = { handleUtterance, announcePage, maybeSuggest, offer, micPress, hardStop };

  // ───────────────────────── listening ─────────────────────────

  const rec = useVoiceRecognition({
    language: memory.lang,
    onResult: (t) => setInterim(t),
    onFinalResult: (t) => {
      setInterim("");
      void fns.current.handleUtterance(t);
    },
    onError: (e) => {
      setInterim("");
      if (e === "not-allowed" || e === "service-not-allowed") {
        setMicBlocked(true);
        setLoopOn(false);
        return;
      }
      if (e !== "no-speech" && e !== "aborted" && ++errCount.current >= 3) {
        setLoopOn(false);
        errCount.current = 0;
      }
    },
  });

  function micPress() {
    if (rec.isListening || loopOn) {
      rec.stopListening();
      setLoopOn(false);
      speechRef.current.stop();
      return;
    }
    if (micBlocked || !rec.isSupported) {
      say(S.micBlocked);
      return;
    }
    speechRef.current.stop();
    setLoopOn(memRef.current.handsFree);
    rec.startListening(memRef.current.lang);
  }

  function hardStop() {
    speechRef.current.stop();
    rec.stopListening();
    setLoopOn(false);
    setInterim("");
  }

  // Hands-free: after Sathi finishes talking, listen again.
  useEffect(() => {
    if (!loopOn || speech.speaking || rec.isListening || busy || captionsOn || micBlocked || !rec.isSupported) return;
    const t = setTimeout(() => rec.startListening(memRef.current.lang), 700);
    return () => clearTimeout(t);
  }, [loopOn, speech.speaking, rec.isListening, busy, captionsOn, micBlocked, rec.isSupported]);

  useEffect(() => {
    if (rec.permissionDenied) {
      setMicBlocked(true);
      setLoopOn(false);
    }
  }, [rec.permissionDenied]);

  // ───────────────────────── live captions (deaf) ─────────────────────────

  // 1) People around the student, through the microphone.
  useEffect(() => {
    if (!captionsOn || typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setCaptionsOn(false);
      return;
    }
    let stopped = false;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = memory.lang;
    r.onresult = (e: any) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const item = e.results[i];
        if (item.isFinal) {
          const t = String(item[0].transcript).trim();
          if (t) pushCaption("room", t);
        } else {
          partial += item[0].transcript;
        }
      }
      setLiveCaption(partial);
    };
    r.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        stopped = true;
        setCaptionsOn(false);
        setMicBlocked(true);
      }
    };
    r.onend = () => {
      if (!stopped) {
        try {
          r.start();
        } catch {
          /* already started */
        }
      }
    };
    try {
      r.start();
    } catch {
      /* already started */
    }
    return () => {
      stopped = true;
      try {
        r.abort();
      } catch {
        /* ignore */
      }
      setLiveCaption("");
    };
  }, [captionsOn, memory.lang]);

  // 2) Everything the app itself speaks (3D teacher, Voice AI…) is mirrored as text.
  useEffect(() => {
    if (!isDeaf || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const original = synth.speak.bind(synth);
    (synth as any).speak = (u: SpeechSynthesisUtterance) => {
      try {
        window.dispatchEvent(new CustomEvent("access-agent:spoken", { detail: u.text }));
      } catch {
        /* ignore */
      }
      original(u);
    };
    const onSpoken = (e: Event) => {
      const t = String((e as CustomEvent).detail ?? "").trim();
      if (!t || lastSaidRef.current.includes(t)) return;
      pushCaption("app", t);
    };
    window.addEventListener("access-agent:spoken", onSpoken);
    return () => {
      delete (synth as any).speak;
      window.removeEventListener("access-agent:spoken", onSpoken);
    };
  }, [isDeaf]);

  function toggleCaptions() {
    if (captionsOn) {
      setCaptionsOn(false);
      return;
    }
    // One microphone user at a time: captions replace voice commands.
    rec.stopListening();
    setLoopOn(false);
    setMicBlocked(false);
    setCaptionsOn(true);
  }

  // ───────────────────────── learning & suggestions ─────────────────────────

  function offer(path: string, kind: "next" | "time") {
    const page = PAGES.find((p) => p.path === path);
    if (!page) return;
    const m = memRef.current;
    const T = strings(m.lang);
    const label = pageLabel(page, m.lang === "hi-IN");
    lastSuggestRef.current = Date.now();
    askToConfirm(kind === "next" ? T.suggestNext(label) : T.suggestTime(label), () => {
      goTo(path);
    });
  }

  function maybeSuggest() {
    const m = memRef.current;
    if (!m.setupDone || m.modes.length === 0 || pendingRef.current || busyRef.current) return;
    if (Date.now() - lastSuggestRef.current < 120_000) return;
    const next = suggestNext(m, pathRef.current);
    if (next) offer(next, "next");
  }

  function announcePage() {
    const m = memRef.current;
    const opened = navLabelRef.current;
    navLabelRef.current = null;
    if (!m.setupDone || m.modes.length === 0) return;
    if (opened || m.modes.includes("blind")) {
      const T = strings(m.lang);
      const h = pageHeading();
      const parts: string[] = [];
      if (opened) parts.push(T.opened(opened));
      if (h && !(opened && h.toLowerCase().includes(opened.toLowerCase()))) parts.push(T.heading(h));
      if (parts.length) say(parts.join(" "));
    }
    maybeSuggest();
  }

  // Learn from every page change and tell the student where they are.
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (prev === pathname) return;
    setMemory((m) => recordVisit(m, prev, pathname));
    if (prev === null) return;
    const t = setTimeout(() => fns.current.announcePage(), 900);
    return () => clearTimeout(t);
  }, [pathname]);

  // "At this time you usually open …" — once, shortly after the app opens.
  useEffect(() => {
    const t = setTimeout(() => {
      const m = memRef.current;
      if (!m.setupDone || m.modes.length === 0 || pendingRef.current) return;
      const p = suggestByTime(m, pathRef.current);
      if (p) fns.current.offer(p, "time");
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  // ───────────────────────── first run & keyboard ─────────────────────────

  useEffect(() => {
    if (memRef.current.setupDone) return;
    const t = setTimeout(() => {
      const sp = speechRef.current;
      sp.speak(strings("hi-IN").welcome, "hi-IN", () => sp.speak(strings("en-IN").welcome, "en-IN"));
    }, 800);
    return () => {
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!memRef.current.setupDone) return;
      if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setOpen(true);
        if (!memRef.current.modes.includes("mute")) fns.current.micPress();
      } else if (e.key === "Escape") {
        fns.current.hardStop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function finishSetup(modes: AccessMode[]) {
    speechRef.current.stop();
    setMemory((m) => ({
      ...m,
      setupDone: true,
      modes,
      speakAloud: !modes.includes("deaf"),
      handsFree: modes.includes("blind") && !modes.includes("mute"),
    }));
    setLoopOn(false);
    setOpen(modes.length > 0);
    if (modes.length > 0) setTimeout(() => say(strings(memRef.current.lang).ready), 150);
  }

  function toggleMode(mode: AccessMode) {
    setMemory((m) => ({
      ...m,
      modes: m.modes.includes(mode) ? m.modes.filter((x) => x !== mode) : [...m.modes, mode],
    }));
  }

  function submitText(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    setInput("");
    void handleUtterance(t);
  }

  // ───────────────────────── screen ─────────────────────────

  if (!memory.setupDone) {
    return (
      <div data-access-agent>
        <SetupDialog
          onDone={finishSetup}
          onPick={(t) => speechRef.current.speak(t, "en-IN")}
        />
      </div>
    );
  }

  const bigText = isDeaf ? "text-xl leading-relaxed font-semibold" : "text-sm";
  const emptyHint = memory.lang === "hi-IN" ? "मुझसे कुछ भी कहिए या टाइप कीजिए।" : "Say or type anything to me.";

  return (
    <div data-access-agent>
      {/* Screen-reader users who turn off Sathi's voice still get every message. */}
      <div className="sr-only" role="status" aria-live="polite">
        {memory.speakAloud ? "" : lastSaid}
      </div>

      {flash && <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] ring-[10px] ring-inset ring-primary/70" />}

      {!open && miniCaption && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed inset-x-3 bottom-24 z-[60] mx-auto max-w-xl rounded-2xl bg-foreground px-4 py-3 text-left text-lg font-semibold leading-snug text-background shadow-2xl"
          aria-live="polite"
        >
          {miniCaption}
        </button>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Sathi, the accessibility assistant. Shortcut: Alt plus A."
          className={`fixed bottom-4 right-4 z-[60] grid h-16 w-16 place-items-center rounded-full brand-bg text-white shadow-xl ring-4 ring-background focus-visible:outline-none focus-visible:ring-primary ${
            rec.isListening || loopOn || captionsOn ? "animate-pulse" : ""
          }`}
        >
          <Accessibility className="h-8 w-8" />
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Sathi accessibility assistant"
          className="fixed bottom-3 right-3 z-[60] flex max-h-[88vh] w-[min(94vw,410px)] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl"
        >
          <header className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-lg brand-bg text-white">
                <Accessibility className="h-5 w-5" />
              </span>
              Sathi
              <span className="text-[11px] font-normal text-muted-foreground">Alt+A</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                aria-label="Sathi settings"
                aria-expanded={showSettings}
                className="rounded-lg p-2 hover:bg-accent"
              >
                <Settings2 className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close Sathi" className="rounded-lg p-2 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {showSettings && (
              <div className="space-y-3 rounded-xl border bg-background p-3 text-sm">
                <div>
                  <div className="mb-1 font-semibold">My needs</div>
                  <div className="flex flex-wrap gap-2">
                    {MODE_INFO.map((m) => (
                      <button
                        key={m.mode}
                        type="button"
                        aria-pressed={memory.modes.includes(m.mode)}
                        onClick={() => toggleMode(m.mode)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                          memory.modes.includes(m.mode) ? "bg-primary text-primary-foreground" : "bg-card"
                        }`}
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 font-semibold">Language</div>
                  <div className="flex gap-2">
                    {(["hi-IN", "en-IN"] as AgentLang[]).map((l) => (
                      <button
                        key={l}
                        type="button"
                        aria-pressed={memory.lang === l}
                        onClick={() => setMemory((m) => ({ ...m, lang: l }))}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold ${memory.lang === l ? "bg-primary text-primary-foreground" : "bg-card"}`}
                      >
                        {l === "hi-IN" ? "हिन्दी" : "English"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center justify-between gap-2">
                  <span>Sathi speaks aloud (turn off if you use a screen reader)</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={memory.speakAloud}
                    onChange={(e) => setMemory((m) => ({ ...m, speakAloud: e.target.checked }))}
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span>Hands-free: listen again after I finish talking</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={memory.handsFree}
                    onChange={(e) => setMemory((m) => ({ ...m, handsFree: e.target.checked }))}
                  />
                </label>
                <div className="flex items-center justify-between gap-2">
                  <span>Speed {memory.rate.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <button type="button" className="rounded-lg border px-3 py-1 text-xs" onClick={() => void execute({ type: "slower" })}>
                      Slower
                    </button>
                    <button type="button" className="rounded-lg border px-3 py-1 text-xs" onClick={() => void execute({ type: "faster" })}>
                      Faster
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-lg border px-3 py-2 text-xs" onClick={() => say(S.help, { force: true })}>
                    What can you do?
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-2 text-xs"
                    onClick={() => setMemory((m) => ({ ...m, visits: {}, hourly: {}, transitions: {} }))}
                  >
                    Forget my habits
                  </button>
                </div>
              </div>
            )}

            {/* What Sathi is saying right now */}
            <div className={`rounded-xl border bg-background p-3 ${bigText}`} aria-live={memory.speakAloud ? "off" : "polite"}>
              {busy ? S.thinking : lastSaid || emptyHint}
            </div>
            {interim && <p className="text-xs italic text-muted-foreground">Hearing: {interim}</p>}
            {micBlocked && <p className="text-xs text-destructive">{S.micBlocked}</p>}

            {/* Sathi asks, student answers */}
            {pendingText && (
              <div className="rounded-xl border-2 border-primary bg-primary/5 p-3">
                <p className="text-sm font-medium">{pendingText}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void answerPending(true)}
                    className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 font-bold text-primary-foreground"
                  >
                    <Check className="h-4 w-4" /> Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => void answerPending(false)}
                    className="min-h-12 flex-1 rounded-lg border px-3 font-bold"
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Big controls */}
            <div className="grid grid-cols-2 gap-2">
              {canVoice && (
                <button
                  type="button"
                  onClick={micPress}
                  aria-pressed={rec.isListening || loopOn}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 font-bold ${
                    rec.isListening || loopOn ? "bg-destructive text-white" : "brand-bg text-white"
                  }`}
                >
                  {rec.isListening || loopOn ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {rec.isListening || loopOn ? "Stop listening" : "Talk to Sathi"}
                </button>
              )}
              <button
                type="button"
                onClick={() => speech.stop()}
                className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-destructive px-3 font-bold text-destructive"
              >
                <Square className="h-5 w-5" /> Stop talking
              </button>
              <button
                type="button"
                onClick={() => void describeCamera()}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold"
              >
                <Camera className="h-4 w-4" /> What is in front?
              </button>
              <button
                type="button"
                onClick={readPage}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold"
              >
                <BookOpen className="h-4 w-4" /> Read this page
              </button>
              {isDeaf && (
                <button
                  type="button"
                  onClick={toggleCaptions}
                  aria-pressed={captionsOn}
                  className={`col-span-2 flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 font-bold ${
                    captionsOn ? "bg-primary text-primary-foreground" : "border-2 border-primary text-primary"
                  }`}
                >
                  <Captions className="h-5 w-5" /> {captionsOn ? "Live captions ON — tap to stop" : "Start live captions (microphone)"}
                </button>
              )}
            </div>

            {/* Captions for deaf students */}
            {isDeaf && (captionLines.length > 0 || liveCaption) && (
              <div className="space-y-1 rounded-xl border bg-background p-3" aria-live="polite">
                {captionLines.map((c) => (
                  <p key={c.id} className="text-lg font-semibold leading-snug">
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase text-muted-foreground">
                      {c.kind === "room" ? "Heard" : "App"}
                    </span>
                    {c.text}
                  </p>
                ))}
                {liveCaption && <p className="text-lg italic text-muted-foreground">{liveCaption}</p>}
              </div>
            )}

            {/* Quick phrases for students who cannot speak */}
            {isMute && (
              <div>
                <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Volume2 className="h-3.5 w-3.5" /> Tap a phrase — Sathi says it aloud
                </div>
                <div className="flex flex-wrap gap-2">
                  {memory.phrases.map((p) => (
                    <span key={p} className="inline-flex items-center overflow-hidden rounded-full border bg-background">
                      <button type="button" onClick={() => speakOut(p)} className="min-h-10 px-3 text-sm font-medium">
                        {p}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove phrase ${p}`}
                        onClick={() => setMemory((m) => ({ ...m, phrases: m.phrases.filter((x) => x !== p) }))}
                        className="px-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {log.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer font-semibold">Conversation</summary>
                <ul className="mt-1 space-y-1">
                  {log.map((l) => (
                    <li key={l.id}>
                      <strong>{l.who === "you" ? "You" : "Sathi"}:</strong> {l.text.slice(0, 200)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* Typing works for everyone — and is the main way for students who cannot speak. */}
          <form onSubmit={submitText} className="flex items-center gap-2 border-t p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Type a command or question for Sathi"
              placeholder={memory.lang === "hi-IN" ? "टाइप कीजिए: नोट्स खोलो…" : "Type: open notes…"}
              className="min-h-12 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm"
            />
            {isMute && (
              <button
                type="button"
                onClick={() => {
                  speakOut(input);
                  setInput("");
                }}
                aria-label="Speak this text aloud"
                className="grid min-h-12 w-12 place-items-center rounded-xl border-2 border-primary text-primary"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            )}
            <button type="submit" aria-label="Send to Sathi" className="grid min-h-12 w-12 place-items-center rounded-xl brand-bg text-white">
              <Send className="h-5 w-5" />
            </button>
          </form>
          {isMute && input.trim() && !memory.phrases.includes(input.trim()) && (
            <button
              type="button"
              onClick={() => setMemory((m) => ({ ...m, phrases: [...m.phrases, input.trim()].slice(-20) }))}
              className="border-t px-3 py-2 text-left text-xs font-semibold text-primary"
            >
              + Save "{input.trim().slice(0, 40)}" as a quick phrase
            </button>
          )}
        </section>
      )}
    </div>
  );
}

/** First-run screen. Works by tapping or with the keys 1, 2, 3, Enter and Escape. */
function SetupDialog({ onDone, onPick }: { onDone: (modes: AccessMode[]) => void; onPick: (spoken: string) => void }) {
  const [pick, setPick] = useState<AccessMode[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function toggle(mode: AccessMode) {
    const on = !pick.includes(mode);
    setPick(on ? [...pick, mode] : pick.filter((m) => m !== mode));
    onPick(`${mode === "blind" ? "Cannot see" : mode === "deaf" ? "Cannot hear" : "Cannot speak"} ${on ? "selected" : "removed"}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "1") toggle("blind");
    else if (e.key === "2") toggle("deaf");
    else if (e.key === "3") toggle("mute");
    else if (e.key === "Enter" && e.target === e.currentTarget) onDone(pick);
    else if (e.key === "Escape") onDone([]);
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-background/90 p-4 backdrop-blur">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Sathi. Press 1 if you cannot see, 2 if you cannot hear, 3 if you cannot speak, then Enter. Escape to skip."
        onKeyDown={onKeyDown}
        className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-5 shadow-2xl outline-none"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl brand-bg text-white">
            <Accessibility className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-xl font-bold">Meet Sathi</h2>
            <p className="text-sm text-muted-foreground">Your learning helper. Choose what suits you.</p>
          </div>
        </div>

        <div className="space-y-2">
          {MODE_INFO.map((m) => (
            <button
              key={m.mode}
              type="button"
              aria-pressed={pick.includes(m.mode)}
              onClick={() => toggle(m.mode)}
              className={`flex min-h-16 w-full items-center gap-3 rounded-xl border-2 px-4 text-left ${
                pick.includes(m.mode) ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-sm font-bold">{m.key}</span>
              <span>
                <span className="block text-base font-bold">{m.title}</span>
                <span className="block text-xs text-muted-foreground">{m.hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDone(pick)}
            className="min-h-12 flex-1 rounded-xl brand-bg px-4 font-bold text-white"
          >
            Start
          </button>
          <button type="button" onClick={() => onDone([])} className="min-h-12 rounded-xl border px-4 font-semibold">
            Skip
          </button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">Keys: 1, 2, 3 to choose · Enter to start · Escape to skip</p>
      </div>
    </div>
  );
}

