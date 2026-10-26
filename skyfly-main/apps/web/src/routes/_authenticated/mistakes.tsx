import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookX, Loader2, Sparkles, RotateCw, CheckCircle2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  explainMistake,
  retrySimilarQuestion,
  type ExamQuestion,
} from "@/lib/ai-learning.functions";

export const Route = createFileRoute("/_authenticated/mistakes")({
  component: MistakeBook,
  head: () => ({
    meta: [
      { title: "AI Mistake Book — EduVault AI" },
      {
        name: "description",
        content: "Every question you got wrong, grouped by subject, explained by AI.",
      },
      { property: "og:title", content: "AI Mistake Book — EduVault AI" },
      {
        property: "og:description",
        content: "Every question you got wrong, grouped by subject, explained by AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function MistakeBook() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const explain = useServerFn(explainMistake);
  const retry = useServerFn(retrySimilarQuestion);
  const [busy, setBusy] = useState<string | null>(null);
  const [practice, setPractice] = useState<Record<string, ExamQuestion>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});

  const { data: mistakes = [], isLoading } = useQuery({
    queryKey: ["mistakes", user.id],
    queryFn: async () =>
      (
        await supabase
          .from("mistakes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const grouped = mistakes.reduce<Record<string, typeof mistakes>>((acc, m) => {
    const key = m.subject || "Other";
    (acc[key] ||= []).push(m);
    return acc;
  }, {});

  async function onExplain(id: string) {
    setBusy(id);
    try {
      await explain({ data: { id } });
      qc.invalidateQueries({ queryKey: ["mistakes", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not explain this one.");
    } finally {
      setBusy(null);
    }
  }

  async function onRetry(id: string) {
    setBusy(id + ":retry");
    try {
      const q = await retry({ data: { id } });
      setPractice((p) => ({ ...p, [id]: q }));
      setPicked((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create a practice question.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold">
        <BookX className="h-7 w-7 text-primary" /> AI Mistake Book
      </h1>
      <p className="mt-1 text-muted-foreground">
        Questions you got wrong, grouped by subject — with AI explanations and practice.
      </p>

      {isLoading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your mistakes...
        </div>
      ) : mistakes.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)]">
          Nothing here yet. Attempt a quiz — anything you get wrong lands here automatically.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {Object.entries(grouped).map(([subject, items]) => (
            <section key={subject}>
              <h2 className="mb-3 text-xl font-semibold">
                {subject}{" "}
                <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
              </h2>
              <div className="space-y-3">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]"
                  >
                    {m.topic && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {m.topic}
                      </span>
                    )}
                    <div className="mt-2 font-medium">{m.question}</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Your answer: <span className="text-destructive">{m.user_answer || "—"}</span>
                      {" · "}Correct:{" "}
                      <span className="text-brand-emerald">{m.correct_answer || "—"}</span>
                    </div>

                    {m.explanation && (
                      <div className="prose prose-sm mt-3 max-w-none rounded-xl border bg-muted/30 p-3 dark:prose-invert">
                        <ReactMarkdown>{m.explanation}</ReactMarkdown>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => onExplain(m.id)}
                        disabled={busy === m.id}
                        className="inline-flex items-center gap-2 rounded-full brand-bg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {busy === m.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {m.explanation ? "Explain again" : "Explain my mistake"}
                      </button>
                      <button
                        onClick={() => onRetry(m.id)}
                        disabled={busy === m.id + ":retry"}
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-50"
                      >
                        {busy === m.id + ":retry" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCw className="h-3.5 w-3.5" />
                        )}
                        Retry similar question
                      </button>
                    </div>

                    {practice[m.id] && (
                      <div className="mt-4 rounded-xl border p-4">
                        <div className="text-sm font-medium">{practice[m.id].question}</div>
                        <div className="mt-3 space-y-2">
                          {practice[m.id].options.map((opt, i) => {
                            const chosen = picked[m.id];
                            const isPicked = chosen === i;
                            const isCorrect = practice[m.id].answer === i;
                            const show = chosen !== undefined;
                            return (
                              <button
                                key={i}
                                onClick={() =>
                                  chosen === undefined && setPicked((p) => ({ ...p, [m.id]: i }))
                                }
                                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  show && isCorrect
                                    ? "border-brand-emerald bg-brand-emerald/10"
                                    : show && isPicked
                                      ? "border-destructive bg-destructive/10"
                                      : "hover:bg-accent"
                                }`}
                              >
                                {show && isCorrect && (
                                  <CheckCircle2 className="h-4 w-4 text-brand-emerald" />
                                )}
                                {show && isPicked && !isCorrect && (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                <span>
                                  {String.fromCharCode(65 + i)}. {opt}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {picked[m.id] !== undefined && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            {practice[m.id].explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
