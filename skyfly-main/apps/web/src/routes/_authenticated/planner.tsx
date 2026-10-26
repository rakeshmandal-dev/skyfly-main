import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus, Trash2, Bell, GraduationCap } from "lucide-react";
import { useState } from "react";
import { useLocalStore } from "@/lib/local-store";

export const Route = createFileRoute("/_authenticated/planner")({
  component: Planner,
  head: () => ({ meta: [{ title: "Study Planner — EduVault AI" }] }),
});

type Event = { id: string; title: string; date: string; type: "task" | "exam" | "assignment" | "goal" };

const UPCOMING = [
  { name: "JEE Main Session 1", date: "2026-01-24", d: 197 },
  { name: "NEET UG", date: "2026-05-03", d: 296 },
  { name: "CBSE Board Practicals", date: "2026-02-10", d: 214 },
];

function Planner() {
  const [events, setEvents] = useLocalStore<Event[]>("ev:planner", [
    { id: "e1", title: "Complete Physics Ch 4", date: new Date().toISOString().slice(0, 10), type: "task" },
    { id: "e2", title: "Math assignment submission", date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), type: "assignment" },
    { id: "e3", title: "Weekly goal: 20 quizzes", date: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10), type: "goal" },
  ]);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<Event["type"]>("task");

  function add() {
    if (!title.trim()) return;
    setEvents([...events, { id: crypto.randomUUID(), title: title.trim(), date, type }]);
    setTitle("");
  }
  function del(id: string) { setEvents(events.filter((e) => e.id !== id)); }

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const monthEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const filtered = events.filter((e) => {
    if (view === "day") return e.date === today;
    if (view === "week") return e.date >= today && e.date <= weekEnd;
    return e.date >= today && e.date <= monthEnd;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const typeColor: Record<Event["type"], string> = {
    task: "bg-brand-cyan/20 text-brand-cyan",
    exam: "bg-brand-pink/20 text-brand-pink",
    assignment: "bg-brand-amber/20 text-brand-amber",
    goal: "bg-brand-emerald/20 text-brand-emerald",
  };

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><CalendarDays className="h-7 w-7 text-primary" /> Study Planner</h1>
      <p className="mt-1 text-muted-foreground">Plan daily, weekly & monthly. Track exams, assignments and goals.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 inline-flex rounded-full border bg-card p-1 text-xs">
            {(["day", "week", "month"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-1.5 capitalize transition ${view === v ? "brand-bg text-white" : "hover:bg-accent"}`}>{v}</button>
            ))}
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 grid grid-cols-[1fr_auto_auto_auto] gap-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New item…" className="rounded-lg border bg-background px-3 py-2 text-sm" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
              <select value={type} onChange={(e) => setType(e.target.value as Event["type"])} className="rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="task">Task</option><option value="assignment">Assignment</option><option value="exam">Exam</option><option value="goal">Goal</option>
              </select>
              <button onClick={add} className="inline-flex items-center gap-1 rounded-lg brand-bg px-3 py-2 text-sm text-white"><Plus className="h-4 w-4" /> Add</button>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Nothing scheduled for this {view}.</div>
            ) : (
              <ul className="divide-y">
                {filtered.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <div className="w-24 shrink-0 text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeColor[e.type]}`}>{e.type}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
                    <button onClick={() => del(e.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold"><GraduationCap className="h-4 w-4 text-primary" /> Upcoming exams</div>
            <ul className="space-y-3">
              {UPCOMING.map((u) => (
                <li key={u.name} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.date}</div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{u.d}d</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4 text-primary" /> Reminders</div>
            <p className="text-xs text-muted-foreground">Browser notifications coming soon. Enable them from Settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
