import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, FileText, FileQuestion, Brain, ClipboardList } from "lucide-react";
import { useLocalStore } from "@/lib/local-store";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  component: Bookmarks,
  head: () => ({ meta: [{ title: "Bookmarks — EduVault AI" }] }),
});

function Bookmarks() {
  const [notes] = useLocalStore<string[]>("ev:bm:notes", []);
  const [pyqs] = useLocalStore<string[]>("ev:bm:pyqs", []);
  const [quizzes] = useLocalStore<string[]>("ev:bm:quizzes", []);
  const [mocks] = useLocalStore<string[]>("ev:bm:mocks", []);

  const sections = [
    { label: "Notes", count: notes.length, icon: FileText, to: "/notes", color: "from-brand-cyan to-brand-violet" },
    { label: "PYQs", count: pyqs.length, icon: FileQuestion, to: "/pyqs", color: "from-brand-emerald to-brand-cyan" },
    { label: "Quizzes", count: quizzes.length, icon: Brain, to: "/quiz", color: "from-brand-pink to-brand-amber" },
    { label: "Mock tests", count: mocks.length, icon: ClipboardList, to: "/mock-tests", color: "from-brand-amber to-brand-pink" },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><Bookmark className="h-7 w-7 text-primary" /> Bookmarks</h1>
      <p className="mt-1 text-muted-foreground">All the study material you've saved for later.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.label} to={s.to} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow">
            <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-2xl`} />
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-glow`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-3xl font-bold">{s.count}</div>
            <div className="text-sm text-muted-foreground">Saved {s.label.toLowerCase()}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
        Tap the bookmark icon on any note, PYQ paper, quiz or mock test to save it. Your bookmarks stay on this device.
      </div>
    </div>
  );
}
