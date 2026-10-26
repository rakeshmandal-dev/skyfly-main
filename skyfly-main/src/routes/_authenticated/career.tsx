import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Compass, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateCareerPlan } from "@/lib/ai-learning.functions";

export const Route = createFileRoute("/_authenticated/career")({
  component: CareerPlan,
  head: () => ({
    meta: [
      { title: "AI Career Plan — EduVault AI" },
      {
        name: "description",
        content: "Get a personalised career and stream roadmap based on your interests and marks.",
      },
      { property: "og:title", content: "AI Career Plan — EduVault AI" },
      {
        property: "og:description",
        content: "Get a personalised career and stream roadmap based on your interests and marks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const LEVELS = ["Class 10", "Class 12", "Diploma", "Undergraduate", "Postgraduate"];

function CareerPlan() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const generate = useServerFn(generateCareerPlan);
  const [interests, setInterests] = useState("");
  const [marks, setMarks] = useState("");
  const [currentLevel, setCurrentLevel] = useState(LEVELS[1]);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: ["career-plans", user.id],
    queryFn: async () =>
      (
        await supabase
          .from("career_plans")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)
      ).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!interests.trim() || loading) return;
    setLoading(true);
    setPlan(null);
    try {
      const res = await generate({ data: { interests, marks, currentLevel, goal } });
      setPlan(res.plan);
      qc.invalidateQueries({ queryKey: ["career-plans", user.id] });
      toast.success("Your roadmap is ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build your plan. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold">
        <Compass className="h-7 w-7 text-primary" /> AI Career Plan
      </h1>
      <p className="mt-1 text-muted-foreground">
        Tell us about you — get a personalised stream and career roadmap.
      </p>

      <form
        onSubmit={submit}
        className="mt-6 grid gap-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] md:grid-cols-2"
      >
        <label className="text-sm md:col-span-1">
          <span className="font-medium">Current level</span>
          <select
            value={currentLevel}
            onChange={(e) => setCurrentLevel(e.target.value)}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
          >
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium">Marks / performance</span>
          <input
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="e.g. 82% in Class 10, strong in Maths"
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Interests & strengths</span>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={3}
            required
            placeholder="e.g. I love coding and design, dislike biology, enjoy solving puzzles"
            className="mt-1 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Dream goal (optional)</span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. become a software engineer at a product company"
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading || !interests.trim()}
            className="inline-flex items-center gap-2 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Building your roadmap...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate my career plan
              </>
            )}
          </button>
        </div>
      </form>

      {plan && (
        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{plan}</ReactMarkdown>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-xl font-semibold">Earlier plans</h2>
          <div className="space-y-3">
            {history.map((h) => (
              <details key={h.id} className="rounded-2xl border bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  {h.current_level} · {new Date(h.created_at).toLocaleString()}
                </summary>
                <div className="prose prose-sm mt-3 max-w-none dark:prose-invert">
                  <ReactMarkdown>{h.plan_markdown}</ReactMarkdown>
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
