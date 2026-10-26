import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, TrendingUp, Zap, Clock, BookOpen } from "lucide-react";
import { ResponsiveContainer, LineChart as RLine, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/progress")({
  component: Progress,
  head: () => ({ meta: [{ title: "Progress — EduVault AI" }] }),
});

const COLORS = ["hsl(265 85% 62%)", "hsl(190 90% 50%)", "hsl(340 85% 60%)", "hsl(155 70% 45%)", "hsl(38 95% 55%)"];

function Progress() {
  const { user } = Route.useRouteContext();
  const { data } = useQuery({
    queryKey: ["progress", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("quiz_attempts").select("*").eq("user_id", user.id).order("created_at");
      return data ?? [];
    },
  });

  const attempts = data ?? [];
  const totalQ = attempts.reduce((s, a) => s + a.total, 0);
  const totalC = attempts.reduce((s, a) => s + a.score, 0);
  const accuracy = totalQ ? Math.round((totalC / totalQ) * 100) : 0;

  // Weekly graph (last 7 days)
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const day = attempts.filter((a) => a.created_at.slice(0, 10) === key);
    const s = day.reduce((x, a) => x + a.score, 0);
    const t = day.reduce((x, a) => x + a.total, 0);
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }), acc: t ? Math.round((s / t) * 100) : 0, attempts: day.length };
  });

  // Monthly hours (mock: 30-45 min per attempt)
  const monthly = Array.from({ length: 4 }, (_, i) => {
    const start = new Date(); start.setDate(start.getDate() - (28 - i * 7));
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const inW = attempts.filter((a) => { const d = new Date(a.created_at); return d >= start && d < end; });
    return { week: `W${i + 1}`, hours: Math.round((inW.length * 0.6) * 10) / 10 };
  });

  // Subject distribution
  const bySubj: Record<string, number> = {};
  attempts.forEach((a) => { bySubj[a.subject] = (bySubj[a.subject] ?? 0) + a.total; });
  const subjData = Object.entries(bySubj).map(([name, value]) => ({ name, value }));

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><LineChart className="h-7 w-7 text-primary" /> Progress Analytics</h1>
      <p className="mt-1 text-muted-foreground">Study insights across quizzes, mocks and subjects.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Clock, label: "Est. study hours", value: `${Math.round(attempts.length * 0.6 * 10) / 10}h` },
          { icon: TrendingUp, label: "Overall accuracy", value: `${accuracy}%` },
          { icon: Zap, label: "XP earned", value: totalC * 10 },
          { icon: BookOpen, label: "Attempts", value: attempts.length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <div className="mt-3 text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 text-sm font-semibold">Weekly accuracy</div>
          <div className="h-64">
            <ResponsiveContainer>
              <RLine data={weekly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="acc" stroke="hsl(265 85% 62%)" strokeWidth={3} dot={{ r: 4 }} />
              </RLine>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 text-sm font-semibold">Monthly study hours</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(190 90% 50%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-3 text-sm font-semibold">Subject distribution</div>
          {subjData.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Take some quizzes to see subject breakdown.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={subjData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {subjData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
