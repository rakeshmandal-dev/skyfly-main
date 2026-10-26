import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Sparkles, FolderLock, Users, GraduationCap, TrendingUp, Flame,
  Trophy, ArrowRight, BookOpen, Target, Zap, CheckCircle2, Circle,
  Brain, ClipboardList, LineChart, FileText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — EduVault AI" }] }),
});

type Task = Pick<Tables<"daily_tasks">, "id" | "text" | "done">;

const DEFAULT_TASKS = [
  "Revise Kinematics (Physics)",
  "Solve 20 aptitude questions",
  "Watch DSA lecture — Recursion",
  "Attempt Chemistry quick quiz",
];

function Dashboard() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const { data: goal } = useQuery({
    queryKey: ["study-goal", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_goals")
        .upsert({ user_id: user.id }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const goalMin = goal?.daily_goal_minutes ?? 60;
  const studiedMin = goal?.studied_today_minutes ?? 0;

  const { data: tasks = [] } = useQuery({
    queryKey: ["daily-tasks", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("id, text, done")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (data.length > 0) return data;

      const { data: seeded, error: seedError } = await supabase
        .from("daily_tasks")
        .insert(DEFAULT_TASKS.map((text) => ({ user_id: user.id, text })))
        .select("id, text, done")
        .order("created_at", { ascending: true });
      if (seedError) throw seedError;
      return seeded;
    },
  });

  async function setGoalMin(minutes: number) {
    const nextGoal = Math.min(600, Math.max(10, minutes || 60));
    const { error } = await supabase
      .from("study_goals")
      .upsert({ user_id: user.id, daily_goal_minutes: nextGoal }, { onConflict: "user_id" });
    if (!error) await queryClient.invalidateQueries({ queryKey: ["study-goal", user.id] });
  }

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user.id],
    queryFn: async () => {
      const [docs, attempts, posts] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("quiz_attempts").select("score, total, created_at, subject").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      const totalQ = attempts.data?.reduce((s, a) => s + a.total, 0) ?? 0;
      const totalC = attempts.data?.reduce((s, a) => s + a.score, 0) ?? 0;
      return {
        docs: docs.count ?? 0,
        posts: posts.count ?? 0,
        quizzes: attempts.data?.length ?? 0,
        accuracy: totalQ ? Math.round((totalC / totalQ) * 100) : 0,
        xp: totalC * 10,
        recent: attempts.data?.slice(0, 5) ?? [],
      };
    },
  });

  const firstName = (profile?.full_name || "Student").split(" ")[0];
  const goalPct = Math.min(100, Math.round((studiedMin / Math.max(1, goalMin)) * 100));

  async function toggleTask(id: string, done: boolean) {
    const { error } = await supabase
      .from("daily_tasks")
      .update({ done: !done })
      .eq("id", id)
      .eq("user_id", user.id);
    if (!error) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["daily-tasks", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["study-goal", user.id] }),
      ]);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      {/* Greeting */}
      <div className="relative overflow-hidden rounded-3xl hero-bg p-6 text-white md:p-10">
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              <Flame className="h-3.5 w-3.5 text-brand-amber" /> {profile?.streak_count ?? 5}-day streak
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              <Zap className="h-3.5 w-3.5 text-brand-amber" /> {stats?.xp ?? 0} XP
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">Hey {firstName} 👋</h1>
          <p className="mt-2 max-w-lg text-white/80">Small daily wins build big results. Let's crush today's goal.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/ai" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:opacity-90 transition">
              Ask AI <Sparkles className="h-4 w-4" />
            </Link>
            <Link to="/quiz" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition">
              Take a quiz <Brain className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Goal + Tasks */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Daily study goal</div>
            <input type="number" min={10} max={600} value={goalMin} onChange={(e) => void setGoalMin(Number(e.target.value))} className="w-20 rounded-lg border bg-background px-2 py-1 text-right text-sm" />
          </div>
          <div className="mt-4 text-3xl font-bold">{studiedMin}<span className="text-base text-muted-foreground">/{goalMin} min</span></div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full brand-bg transition-all" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{goalPct}% complete today</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" /> Today's tasks</div>
            <span className="text-xs text-muted-foreground">{tasks.filter((t) => t.done).length}/{tasks.length} done</span>
          </div>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <button onClick={() => void toggleTask(t.id, t.done)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent">
                  {t.done ? <CheckCircle2 className="h-4 w-4 text-brand-emerald" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className={t.done ? "text-muted-foreground line-through" : ""}>{t.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Zap, label: "XP Points", value: stats?.xp ?? 0, color: "from-brand-amber to-brand-pink" },
          { icon: Trophy, label: "Quizzes taken", value: stats?.quizzes ?? 0, color: "from-brand-violet to-brand-pink" },
          { icon: TrendingUp, label: "Accuracy", value: `${stats?.accuracy ?? 0}%`, color: "from-brand-emerald to-brand-cyan" },
          { icon: FolderLock, label: "Documents", value: stats?.docs ?? 0, color: "from-brand-cyan to-brand-violet" },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-2xl`} />
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <div className="mt-3 text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="mt-10 mb-4 text-xl font-semibold">Jump back in</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/ai", icon: Sparkles, title: "AI Study Assistant", desc: "Solve doubts, get explanations.", color: "from-brand-violet to-brand-pink" },
          { to: "/notes", icon: FileText, title: "Notes", desc: "Semester & subject-wise notes.", color: "from-brand-cyan to-brand-violet" },
          { to: "/pyqs", icon: BookOpen, title: "Previous Year Papers", desc: "University & year-wise PYQs.", color: "from-brand-emerald to-brand-cyan" },
          { to: "/quiz", icon: Brain, title: "Quick Quiz", desc: "Bite-sized topic drills.", color: "from-brand-pink to-brand-amber" },
          { to: "/mock-tests", icon: ClipboardList, title: "Mock Tests", desc: "Timed, full-length practice.", color: "from-brand-amber to-brand-pink" },
          { to: "/progress", icon: LineChart, title: "Progress Analytics", desc: "Track accuracy & study time.", color: "from-brand-violet to-brand-cyan" },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow">
            <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${a.color} opacity-20 blur-2xl transition group-hover:opacity-40`} />
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-glow`}>
              <a.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{a.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <h2 className="mt-10 mb-4 text-xl font-semibold">Recent activity</h2>
      <div className="rounded-2xl border bg-card p-2 shadow-[var(--shadow-card)]">
        {(stats?.recent?.length ?? 0) === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No quiz activity yet. <Link to="/quiz" className="text-primary underline">Start a quiz</Link>.</div>
        ) : (
          <ul className="divide-y">
            {stats!.recent.map((a: any, i: number) => (
              <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg brand-bg text-white"><Brain className="h-4 w-4" /></div>
                  <div>
                    <div className="font-medium">{a.subject} quiz</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="font-semibold">{a.score}/{a.total}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI suggestions */}
      <h2 className="mt-10 mb-4 text-xl font-semibold">AI study suggestions</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Revise weak topic: Thermodynamics (last accuracy 55%)",
          "Attempt a 15-min Aptitude sprint",
          "Read chapter summary: Organic Chemistry basics",
          "Try 5 Hard DSA problems today",
          "Watch: Integration by parts (10 min)",
          "Solve a JEE 2023 physics paper",
        ].map((s) => (
          <div key={s} className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {s}
          </div>
        ))}
      </div>
    </div>
  );
}
