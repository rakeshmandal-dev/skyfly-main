import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, Clock, Loader2, Sparkles, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateExam, type ExamQuestion } from "@/lib/ai-learning.functions";

export const Route = createFileRoute("/_authenticated/exam")({
  component: ExamSimulation,
  head: () => ({
    meta: [
      { title: "AI Exam Simulation — EduVault AI" },
      {
        name: "description",
        content: "Timed AI-generated mock exams for JEE, NEET and school subjects.",
      },
      { property: "og:title", content: "AI Exam Simulation — EduVault AI" },
      {
        property: "og:description",
        content: "Timed AI-generated mock exams for JEE, NEET and school subjects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"];
const EXAMS = ["School", "JEE", "NEET"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function ExamSimulation() {
  const { user } = Route.useRouteContext();
  const gen = useServerFn(generateExam);

  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [exam, setExam] = useState(EXAMS[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);

  const questionsRef = useRef<ExamQuestion[] | null>(null);
  const answersRef = useRef<number[]>([]);
  const submittingRef = useRef(false);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submit = useCallback(async () => {
    const qs = questionsRef.current;
    if (!qs || submittingRef.current) return;
    submittingRef.current = true;
    const s = qs.reduce((acc, q, i) => acc + (answersRef.current[i] === q.answer ? 1 : 0), 0);
    setScore(s);
    setSubmitted(true);
    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      subject,
      topic: `${exam} mock exam`,
      difficulty,
      score: s,
      total: qs.length,
    });
    const wrong = qs
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => answersRef.current[i] !== q.answer)
      .map(({ q, i }) => ({
        user_id: user.id,
        subject,
        topic: `${exam} mock exam`,
        question: q.question,
        user_answer: answersRef.current[i] >= 0 ? q.options[answersRef.current[i]] : null,
        correct_answer: q.options[q.answer],
        source: "exam",
      }));
    if (wrong.length) await supabase.from("mistakes").insert(wrong);
    toast.success(`Scored ${s}/${qs.length}`);
  }, [user.id, subject, exam, difficulty]);

  useEffect(() => {
    if (!questions || submitted) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [questions, submitted, submit]);

  async function start() {
    setLoading(true);
    try {
      const res = await gen({ data: { subject, exam, count, difficulty } });
      setQuestions(res.questions);
      setAnswers(Array(res.questions.length).fill(-1));
      setIdx(0);
      setSubmitted(false);
      setScore(0);
      setTimeLeft(res.questions.length * 60);
      submittingRef.current = false;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate the paper.");
    } finally {
      setLoading(false);
    }
  }

  if (!questions) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <ClipboardList className="h-7 w-7 text-primary" /> AI Exam Simulation
        </h1>
        <p className="mt-1 text-muted-foreground">
          A fresh timed paper, generated for your subject and level.
        </p>
        <div className="mt-6 grid gap-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] sm:grid-cols-2">
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
          <label className="text-sm">
            <span className="font-medium">Exam</span>
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              {EXAMS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              {DIFFICULTIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium">Questions</span>
            <input
              type="number"
              min={5}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 10)}
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              onClick={start}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Setting your paper...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Start exam
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl brand-bg text-white">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-3xl font-bold">Exam complete!</h2>
          <p className="mt-1 text-muted-foreground">
            {subject} · {exam} · {difficulty}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Score", value: `${score}/${questions.length}` },
              { label: "Accuracy", value: `${pct}%` },
              { label: "XP", value: `+${score * 10}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-4">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 text-left">
            {questions.map((q, i) => {
              const ok = answers[i] === q.answer;
              return (
                <div key={i} className="rounded-xl border p-4">
                  <div className="flex items-start gap-2 text-sm font-medium">
                    {ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-emerald" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
                    )}
                    <span>
                      {i + 1}. {q.question}
                    </span>
                  </div>
                  <div className="ml-6 mt-2 text-xs text-muted-foreground">
                    Your answer: {answers[i] >= 0 ? q.options[answers[i]] : "—"}
                    {!ok && (
                      <span className="text-brand-emerald"> · Correct: {q.options[q.answer]}</span>
                    )}
                  </div>
                  <p className="ml-6 mt-1 text-xs">{q.explanation}</p>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setQuestions(null)}
            className="mt-6 inline-flex items-center gap-2 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white"
          >
            New paper
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {subject} · {exam} ·{" "}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{difficulty}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 font-mono text-sm">
          <Clock className="h-4 w-4" /> {mins}:{String(secs).padStart(2, "0")}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full brand-bg transition-all"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="text-xs text-muted-foreground">
          Question {idx + 1} of {questions.length}
        </div>
        <h3 className="mt-1 text-xl font-semibold">{q.question}</h3>
        <div className="mt-4 space-y-2">
          {q.options.map((opt, i) => {
            const sel = answers[idx] === i;
            return (
              <button
                key={i}
                onClick={() => setAnswers(answers.map((a, j) => (j === idx ? i : a)))}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${sel ? "border-primary bg-primary/10 font-medium" : "hover:bg-accent"}`}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          {idx < questions.length - 1 ? (
            <button
              onClick={() => setIdx(idx + 1)}
              className="rounded-lg brand-bg px-4 py-2 text-sm font-semibold text-white"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              className="rounded-lg brand-bg px-4 py-2 text-sm font-semibold text-white"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
