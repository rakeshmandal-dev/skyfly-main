import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Atom, FlaskConical, Dna, Calculator, Code2, Sigma, Cpu, Landmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/subjects")({
  component: Subjects,
  head: () => ({ meta: [{ title: "Subjects — EduVault AI" }] }),
});

const SUBJECTS = [
  { name: "Physics", icon: Atom, chapters: 22, color: "from-brand-violet to-brand-pink" },
  { name: "Chemistry", icon: FlaskConical, chapters: 28, color: "from-brand-emerald to-brand-cyan" },
  { name: "Biology", icon: Dna, chapters: 26, color: "from-brand-pink to-brand-amber" },
  { name: "Mathematics", icon: Sigma, chapters: 24, color: "from-brand-cyan to-brand-violet" },
  { name: "Computer Science", icon: Cpu, chapters: 20, color: "from-brand-amber to-brand-pink" },
  { name: "Coding & DSA", icon: Code2, chapters: 30, color: "from-brand-violet to-brand-cyan" },
  { name: "Aptitude", icon: Calculator, chapters: 15, color: "from-brand-emerald to-brand-violet" },
  { name: "General Studies", icon: Landmark, chapters: 18, color: "from-brand-cyan to-brand-emerald" },
];

function Subjects() {
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><BookOpen className="h-7 w-7 text-primary" /> Subjects</h1>
      <p className="mt-1 text-muted-foreground">Browse chapter-wise material and jump into practice.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => (
          <Link key={s.name} to="/notes" className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow">
            <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-2xl`} />
            <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-glow`}>
              <s.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">{s.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.chapters} chapters · notes, quizzes & PYQs</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full bg-gradient-to-r ${s.color}`} style={{ width: `${20 + (s.chapters % 60)}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
