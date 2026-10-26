import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Brain, Clock, Zap, Trophy, CheckCircle2, XCircle, RotateCw, ArrowRight } from "lucide-react";
import { QUIZZES, type QuizSet } from "@/lib/quiz-bank";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: Quiz,
  head: () => ({ meta: [{ title: "Quiz — EduVault AI" }] }),
});

function Quiz() {
  const { user } = Route.useRouteContext();
  const [active, setActive] = useState<QuizSet | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!active || submitted) return;
    const t = setInterval(() => setTimeLeft((s) => (s <= 1 ? (submit(), 0) : s - 1)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, submitted]);

  function start(qz: QuizSet) {
    setActive(qz); setAnswers(Array(qz.questions.length).fill(-1));
    setIdx(0); setSubmitted(false); setTimeLeft(qz.questions.length * 45);
  }

  async function submit() {
    if (!active) return;
    setSubmitted(true);
    const score = active.questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
    await supabase.from("quiz_attempts").insert({
      user_id: user.id, subject: active.subject, topic: active.topic,
      difficulty: active.difficulty, score, total: active.questions.length,
    });
    toast.success(`+${score * 10} XP earned!`);
  }

  const score = useMemo(
    () => (active ? active.questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0) : 0),
    [active, answers]
  );

  if (!active) return <QuizList onStart={start} />;

  if (submitted) {
    const pct = Math.round((score / active.questions.length) * 100);
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl brand-bg text-white"><Trophy className="h-8 w-8" /></div>
          <h2 className="mt-4 text-3xl font-bold">Quiz complete!</h2>
          <p className="mt-1 text-muted-foreground">{active.subject} · {active.topic}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Score" value={`${score}/${active.questions.length}`} />
            <Stat label="Accuracy" value={`${pct}%`} />
            <Stat label="XP" value={`+${score * 10}`} />
          </div>
          <div className="mt-6 space-y-3 text-left">
            {active.questions.map((q, i) => {
              const ok = answers[i] === q.answer;
              return (
                <div key={i} className="rounded-xl border p-4">
                  <div className="flex items-start gap-2 text-sm font-medium">
                    {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-emerald" /> : <XCircle className="mt-0.5 h-4 w-4 text-destructive" />}
                    <span>{i + 1}. {q.q}</span>
                  </div>
                  <div className="ml-6 mt-2 text-xs">
                    <div className="text-muted-foreground">Your answer: <span className={ok ? "text-brand-emerald" : "text-destructive"}>{answers[i] >= 0 ? q.options[answers[i]] : "—"}</span></div>
                    {!ok && <div className="text-brand-emerald">Correct: {q.options[q.answer]}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => start(active)} className="inline-flex items-center gap-2 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white"><RotateCw className="h-4 w-4" /> Retry</button>
            <button onClick={() => setActive(null)} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-accent">Pick another</button>
          </div>
        </div>
      </div>
    );
  }

  const q = active.questions[idx];
  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">{active.subject} · {active.topic} · <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{active.difficulty}</span></div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm font-mono"><Clock className="h-4 w-4" /> {mins}:{String(secs).padStart(2, "0")}</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full brand-bg transition-all" style={{ width: `${((idx + 1) / active.questions.length) * 100}%` }} />
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="text-xs text-muted-foreground">Question {idx + 1} of {active.questions.length}</div>
        <h3 className="mt-1 text-xl font-semibold">{q.q}</h3>
        <div className="mt-4 space-y-2">
          {q.options.map((opt, i) => {
            const sel = answers[idx] === i;
            return (
              <button key={i} onClick={() => setAnswers(answers.map((a, j) => (j === idx ? i : a)))}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${sel ? "border-primary bg-primary/10 font-medium" : "hover:bg-accent"}`}>
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Previous</button>
          {idx < active.questions.length - 1 ? (
            <button onClick={() => setIdx(idx + 1)} className="inline-flex items-center gap-1 rounded-lg brand-bg px-4 py-2 text-sm font-semibold text-white">Next <ArrowRight className="h-4 w-4" /></button>
          ) : (
            <button onClick={submit} className="inline-flex items-center gap-1 rounded-lg brand-bg px-4 py-2 text-sm font-semibold text-white">Submit</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-4"><div className="text-2xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}

function QuizList({ onStart }: { onStart: (qz: QuizSet) => void }) {
  const [diff, setDiff] = useState<string>("All");
  const list = QUIZZES.filter((q) => diff === "All" || q.difficulty === diff);
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><Brain className="h-7 w-7 text-primary" /> Quiz</h1>
      <p className="mt-1 text-muted-foreground">Subject & topic quizzes with instant results, XP and analysis.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {["All", "Easy", "Medium", "Hard"].map((d) => (
          <button key={d} onClick={() => setDiff(d)} className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${diff === d ? "brand-bg border-transparent text-white" : "hover:bg-accent"}`}>{d}</button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((q) => (
          <div key={q.id} className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-brand-pink to-brand-amber opacity-20 blur-2xl" />
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{q.subject}</span>
            <h3 className="mt-3 text-lg font-semibold">{q.topic}</h3>
            <div className="mt-1 text-xs text-muted-foreground">{q.questions.length} questions · {q.difficulty}</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{q.questions.length * 45}s</span>
              <span className="inline-flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> +{q.questions.length * 10} XP</span>
            </div>
            <button onClick={() => onStart(q)} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg brand-bg px-3 py-2 text-sm font-semibold text-white">Start quiz <ArrowRight className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
