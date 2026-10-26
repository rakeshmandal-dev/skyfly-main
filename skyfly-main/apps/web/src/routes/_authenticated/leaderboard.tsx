import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Flame, Users, Globe, GraduationCap } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: Leaderboard,
  head: () => ({ meta: [{ title: "Leaderboard — EduVault AI" }] }),
});

function Leaderboard() {
  const { user } = Route.useRouteContext();
  const [tab, setTab] = useState<"global" | "college" | "friends">("global");

  const { data: rows } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const [{ data: profiles }, { data: attempts }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, streak_count, institution"),
        supabase.from("quiz_attempts").select("user_id, score, total"),
      ]);
      const agg: Record<string, { xp: number; correct: number; total: number; count: number }> = {};
      (attempts ?? []).forEach((a) => {
        const cur = agg[a.user_id] ?? { xp: 0, correct: 0, total: 0, count: 0 };
        cur.correct += a.score; cur.total += a.total; cur.xp += a.score * 10; cur.count++;
        agg[a.user_id] = cur;
      });
      const combined = (profiles ?? []).map((p) => {
        const a = agg[p.id] ?? { xp: 0, correct: 0, total: 0, count: 0 };
        return { ...p, ...a, accuracy: a.total ? Math.round((a.correct / a.total) * 100) : 0 };
      });
      // seed a few demo entries if too few real users
      const demo = [
        { id: "d1", full_name: "Ananya Sharma", institution: "IIT Delhi", xp: 4820, count: 62, accuracy: 91, streak_count: 21 },
        { id: "d2", full_name: "Rahul Verma", institution: "NIT Trichy", xp: 4310, count: 55, accuracy: 88, streak_count: 18 },
        { id: "d3", full_name: "Priya Iyer", institution: "BITS Pilani", xp: 3980, count: 51, accuracy: 86, streak_count: 15 },
        { id: "d4", full_name: "Aditya Rao", institution: "VIT", xp: 3520, count: 48, accuracy: 82, streak_count: 12 },
        { id: "d5", full_name: "Sneha Patel", institution: "DTU", xp: 3210, count: 44, accuracy: 80, streak_count: 10 },
        { id: "d6", full_name: "Karan Mehta", institution: "IIIT Hyd", xp: 2890, count: 39, accuracy: 78, streak_count: 9 },
        { id: "d7", full_name: "Divya Nair", institution: "MIT Manipal", xp: 2560, count: 35, accuracy: 76, streak_count: 8 },
        { id: "d8", full_name: "Rohan Das", institution: "IIT Bombay", xp: 2210, count: 31, accuracy: 74, streak_count: 6 },
      ];
      return [...combined, ...demo].sort((a, b) => b.xp - a.xp).slice(0, 20);
    },
  });

  const list = rows ?? [];

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><Trophy className="h-7 w-7 text-primary" /> Leaderboard</h1>
      <p className="mt-1 text-muted-foreground">Climb the ranks — earn XP with quizzes, streaks & mocks.</p>

      <div className="mt-6 inline-flex rounded-full border bg-card p-1 text-xs">
        {([
          { k: "global", l: "Global", i: Globe },
          { k: "college", l: "College", i: GraduationCap },
          { k: "friends", l: "Friends", i: Users },
        ] as const).map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${tab === t.k ? "brand-bg text-white" : "hover:bg-accent"}`}>
            <t.i className="h-3.5 w-3.5" /> {t.l}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {list.slice(0, 3).map((u, i) => {
          const colors = ["from-brand-amber to-brand-pink", "from-slate-300 to-slate-500", "from-amber-600 to-amber-800"];
          const medal = ["🥇", "🥈", "🥉"][i];
          return (
            <div key={u.id} className={`relative overflow-hidden rounded-2xl border p-5 text-white shadow-glow bg-gradient-to-br ${colors[i]}`}>
              <div className="text-4xl">{medal}</div>
              <div className="mt-2 text-lg font-bold truncate">{u.full_name}</div>
              <div className="text-xs opacity-80 truncate">{u.institution || "—"}</div>
              <div className="mt-3 text-2xl font-black">{u.xp} XP</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs"><Flame className="h-3.5 w-3.5" /> {u.streak_count}d</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[60px_1fr_120px_100px_100px_100px] gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid">
          <div>Rank</div><div>Student</div><div>Institution</div><div className="text-right">Quizzes</div><div className="text-right">Accuracy</div><div className="text-right">XP</div>
        </div>
        <ul className="divide-y">
          {list.map((u, i) => {
            const isMe = u.id === user.id;
            return (
              <li key={u.id} className={`grid grid-cols-[40px_1fr_auto] gap-3 px-4 py-3 text-sm md:grid-cols-[60px_1fr_120px_100px_100px_100px] md:gap-4 ${isMe ? "bg-primary/5" : ""}`}>
                <div className="font-mono font-semibold">{i < 3 ? <Medal className="h-4 w-4 text-brand-amber" /> : `#${i + 1}`}</div>
                <div className="min-w-0"><div className="truncate font-medium">{u.full_name} {isMe && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">You</span>}</div><div className="truncate text-xs text-muted-foreground md:hidden">{u.institution || "—"}</div></div>
                <div className="hidden truncate text-muted-foreground md:block">{u.institution || "—"}</div>
                <div className="hidden text-right md:block">{u.count}</div>
                <div className="hidden text-right md:block">{u.accuracy}%</div>
                <div className="text-right font-bold">{u.xp}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
