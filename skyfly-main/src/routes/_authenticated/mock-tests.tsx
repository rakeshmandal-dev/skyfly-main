import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Clock, Trophy, ArrowRight, Play, Pause, StopCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { QUIZZES } from "@/lib/quiz-bank";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mock-tests")({
  component: MockTests,
  head: () => ({ meta: [{ title: "Mock Tests — EduVault AI" }] }),
});

type Mock = { id: string; title: string; subject: string; duration: number; questions: number; type: "Full-length" | "Subject-wise" };

const MOCKS: Mock[] = [
  { id: "m1", title: "JEE Main Full Mock #1", subject: "PCM", duration: 180, questions: 30, type: "Full-length" },
  { id: "m2", title: "NEET Full Mock #1", subject: "PCB", duration: 180, questions: 30, type: "Full-length" },
  { id: "m3", title: "Physics Sectional", subject: "Physics", duration: 60, questions: 20, type: "Subject-wise" },
  { id: "m4", title: "Chemistry Sectional", subject: "Chemistry", duration: 60, questions: 20, type: "Subject-wise" },
  { id: "m5", title: "Mathematics Sectional", subject: "Mathematics", duration: 60, questions: 20, type: "Subject-wise" },
  { id: "m6", title: "Coding Placement Mock", subject: "DSA", duration: 90, questions: 25, type: "Full-length" },
];

// Build a full pool from quiz-bank
const POOL = QUIZZES.flatMap((q) => q.questions.map((qq) => ({ ...qq, subject: q.subject })));

function MockTests() {
  const [active, setActive] = useState<Mock | null>(null);
  return active ? <Runner mock={active} onEnd={() => setActive(null)} /> : <List onStart={setActive} />;
}

function List({ onStart }: { onStart: (m: Mock) => void }) {
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><ClipboardList className="h-7 w-7 text-primary" /> Mock Tests</h1>
      <p className="mt-1 text-muted-foreground">Professional, timed practice — like the real exam.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCKS.map((m) => (
          <div key={m.id} className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-brand-amber to-brand-pink opacity-20 blur-2xl" />
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{m.type}</span>
            <h3 className="mt-3 text-lg font-semibold">{m.title}</h3>
            <div className="mt-1 text-xs text-muted-foreground">{m.subject}</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {m.duration} min</span>
              <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {m.questions} Qs</span>
            </div>
            <button onClick={() => onStart(m)} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg brand-bg px-3 py-2 text-sm font-semibold text-white">Start test <ArrowRight className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Runner({ mock, onEnd }: { mock: Mock; onEnd: () => void }) {
  const { user } = Route.useRouteContext();
  const [qs] = useState(() => {
    const shuffled = [...POOL].sort(() => Math.random() - 0.5).slice(0, mock.questions);
    return shuffled;
  });
  const [answers, setAnswers] = useState<number[]>(Array(qs.length).fill(-1));
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(mock.duration * 60);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (paused || done) return;
    const t = setInterval(() => setLeft((s) => (s <= 1 ? (submit(), 0) : s - 1)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, done]);

  const score = answers.reduce((s, a, i) => s + (a === qs[i].answer ? 1 : 0), 0);
  const attempted = answers.filter((a) => a >= 0).length;

  async function submit() {
    setDone(true);
    await supabase.from("quiz_attempts").insert({
      user_id: user.id, subject: mock.subject, topic: mock.title,
      difficulty: "Medium", score, total: qs.length,
    });
    toast.success(`Test submitted · +${score * 10} XP`);
  }

  if (done) {
    const pct = Math.round((score / qs.length) * 100);
    const rank = Math.max(1, Math.round((100 - pct) * 12));
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <div className="rounded-3xl border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl brand-bg text-white"><Trophy className="h-8 w-8" /></div>
            <h2 className="mt-4 text-3xl font-bold">Result: {mock.title}</h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <S label="Score" value={`${score}/${qs.length}`} />
            <S label="Accuracy" value={`${pct}%`} />
            <S label="Attempted" value={`${attempted}`} />
            <S label="Rank (est.)" value={`#${rank}`} />
          </div>
          <div className="mt-6 rounded-xl border p-4">
            <div className="mb-2 text-sm font-semibold">Time analysis</div>
            <div className="text-xs text-muted-foreground">Total time used: {mock.duration - Math.round(left / 60)} min of {mock.duration} min · Avg {Math.round(((mock.duration * 60 - left) / qs.length))}s per question</div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={onEnd} className="rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white">Back to tests</button>
          </div>
        </div>
      </div>
    );
  }

  const q = qs[idx];
  const m = Math.floor(left / 60), s = left % 60;
  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">{mock.title}</div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm font-mono"><Clock className="h-4 w-4" /> {m}:{String(s).padStart(2, "0")}</div>
          <button onClick={() => setPaused(!paused)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-accent">{paused ? <><Play className="h-3.5 w-3.5" /> Resume</> : <><Pause className="h-3.5 w-3.5" /> Pause</>}</button>
          <button onClick={submit} className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs text-white"><StopCircle className="h-3.5 w-3.5" /> Submit</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="text-xs text-muted-foreground">Question {idx + 1} of {qs.length}</div>
          <h3 className="mt-1 text-lg font-semibold">{q.q}</h3>
          <div className="mt-4 space-y-2">
            {q.options.map((opt: string, i: number) => {
              const sel = answers[idx] === i;
              return (
                <button key={i} onClick={() => setAnswers(answers.map((a, j) => (j === idx ? i : a)))} className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${sel ? "border-primary bg-primary/10 font-medium" : "hover:bg-accent"}`}>
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Previous</button>
            <button onClick={() => setIdx(Math.min(qs.length - 1, idx + 1))} disabled={idx === qs.length - 1} className="rounded-lg brand-bg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Next</button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">Question palette</div>
          <div className="grid grid-cols-5 gap-2">
            {qs.map((_, i) => {
              const state = answers[i] >= 0 ? "brand-bg text-white" : i === idx ? "border-primary" : "border";
              return <button key={i} onClick={() => setIdx(i)} className={`h-9 rounded-lg border text-xs font-medium ${state}`}>{i + 1}</button>;
            })}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Attempted: {attempted}/{qs.length}</div>
        </div>
      </div>
    </div>
  );
}

function S({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-4"><div className="text-2xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}
