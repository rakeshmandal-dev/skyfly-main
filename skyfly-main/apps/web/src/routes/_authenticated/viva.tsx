import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, MicOff, MessagesSquare, Trophy, GraduationCap, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { vivaTurn } from "@/lib/ai-learning.functions";

export const Route = createFileRoute("/_authenticated/viva")({
  component: Viva,
  head: () => ({
    meta: [
      { title: "AI Viva Interview — EduVault AI" },
      { name: "description", content: "Practise an oral exam with an AI examiner and get scored." },
      { property: "og:title", content: "AI Viva Interview — EduVault AI" },
      {
        property: "og:description",
        content: "Practise an oral exam with an AI examiner and get scored.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"];

type Mode = "exam" | "teach";
type Msg = { role: "examiner" | "student"; text: string; persona?: string };

const PERSONA_STYLES: Record<string, string> = {
  "Strict Examiner": "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900",
  "Friendly Examiner": "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900",
  "Cross-Questioner": "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
};

function parsePersona(text: string): { persona?: string; text: string } {
  const m = text.match(/^\*\*(Strict Examiner|Friendly Examiner|Cross-Questioner):\*\*\s*/);
  if (!m) return { text };
  return { persona: m[1], text: text.slice(m[0].length) };
}

function Viva() {
  const turn = useServerFn(vivaTurn);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [mode, setMode] = useState<Mode>("exam");
  const [panel, setPanel] = useState(false);
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<Msg[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    window.speechSynthesis.speak(u);
  }

  function toggleMic() {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Speech input isn't available in this browser.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setAnswer(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function run(next: Msg[], finish = false) {
    setBusy(true);
    try {
      const res = await turn({
        data: {
          subject,
          history: next.map((m) => ({ role: m.role, text: m.text })),
          finish,
          mode,
          panel,
        },
      });
      if (res.done) {
        setResult({ score: res.score, feedback: res.feedback });
      } else {
        const { persona, text } = parsePersona(res.question);
        setHistory([...next, { role: "examiner", text, persona }]);
        speak(text);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The examiner went quiet. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setStarted(true);
    setResult(null);
    setHistory([]);
    await run([]);
  }

  async function submitAnswer() {
    const a = answer.trim();
    if (!a || busy) return;
    const next: Msg[] = [...history, { role: "student", text: a }];
    setHistory(next);
    setAnswer("");
    await run(next);
  }

  const otherLabel = mode === "teach" ? "Junior" : "Examiner";

  if (result) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl brand-bg text-white">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-3xl font-bold">{result.score}/100</h2>
          <p className="mt-1 text-muted-foreground">
            {subject} {mode === "teach" ? "— teaching clarity" : panel ? "— panel viva" : "viva"}
          </p>
          <div className="prose prose-sm mx-auto mt-5 max-w-none text-left dark:prose-invert">
            <ReactMarkdown>{result.feedback}</ReactMarkdown>
          </div>
          <button
            onClick={() => {
              setResult(null);
              setStarted(false);
              setHistory([]);
            }}
            className="mt-6 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white"
          >
            New viva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold">
        <MessagesSquare className="h-7 w-7 text-primary" /> AI Viva Interview
      </h1>
      <p className="mt-1 text-muted-foreground">
        {mode === "teach"
          ? "Explain the topic — the AI plays a curious junior and asks you doubts."
          : "An examiner asks one question at a time. Answer by typing or speaking."}
      </p>

      {!started ? (
        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <label className="text-sm">
            <span className="font-medium">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>

          <div className="mt-4">
            <span className="text-sm font-medium">Mode</span>
            <div className="mt-1 inline-flex w-full rounded-xl border p-1 text-sm">
              <button
                onClick={() => setMode("exam")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${mode === "exam" ? "brand-bg text-white" : "hover:bg-accent"}`}
              >
                <MessagesSquare className="h-4 w-4" /> Normal Viva
              </button>
              <button
                onClick={() => setMode("teach")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${mode === "teach" ? "brand-bg text-white" : "hover:bg-accent"}`}
              >
                <GraduationCap className="h-4 w-4" /> Teach the AI
              </button>
            </div>
          </div>

          {mode === "exam" && (
            <label className="mt-4 flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Users className="h-4 w-4" /> Panel Mode (3 examiners)
              </span>
              <input
                type="checkbox"
                checked={panel}
                onChange={(e) => setPanel(e.target.checked)}
                className="h-4 w-4"
              />
            </label>
          )}

          <button
            onClick={start}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Start viva
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {history.map((m, i) => {
              const personaStyle = m.persona ? PERSONA_STYLES[m.persona] : undefined;
              return (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl border p-4 text-sm ${
                    m.role === "student"
                      ? "ml-auto brand-bg border-transparent text-white"
                      : personaStyle || "bg-card"
                  }`}
                >
                  {m.persona && <div className="mb-1 text-xs font-semibold opacity-70">{m.persona}</div>}
                  {m.text}
                </div>
              );
            })}
            {busy && (
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {otherLabel} is thinking...
              </div>
            )}
          </div>

          <div className="mt-6 flex items-end gap-3">
            <button
              onClick={toggleMic}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white ${listening ? "bg-destructive animate-pulse" : "brand-bg"}`}
              title={listening ? "Stop" : "Speak your answer"}
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
              rows={2}
              placeholder={mode === "teach" ? "Explain your point..." : "Your answer"}
              className="flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-sm"
            />
            <button
              onClick={submitAnswer}
              disabled={!answer.trim() || busy}
              className="rounded-full brand-bg px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {mode === "teach" ? "Explain" : "Answer"}
            </button>
          </div>
          <button
            onClick={() => run(history, true)}
            disabled={busy || history.length < 2}
            className="mt-4 rounded-full border px-5 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
          >
            Finish & get my score
          </button>
        </>
      )}
    </div>
  );
}
