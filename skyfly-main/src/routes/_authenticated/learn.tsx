import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, BookOpen, Code2, Calculator, FlaskConical, Atom, Dna, Trophy, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/learn")({
  component: Learn,
  head: () => ({ meta: [{ title: "Learn — EduVault AI" }] }),
});

const TRACKS = [
  { title: "JEE Main & Advanced", icon: Atom, desc: "Physics, Chemistry, Math with PYQs & mocks", color: "from-brand-violet to-brand-pink" },
  { title: "NEET", icon: Dna, desc: "Biology, Physics, Chemistry — AIIMS ready", color: "from-brand-emerald to-brand-cyan" },
  { title: "School 6–12", icon: BookOpen, desc: "CBSE / ICSE / State boards curriculum", color: "from-brand-cyan to-brand-violet" },
  { title: "College Subjects", icon: GraduationCap, desc: "Engineering, Diploma, ITI, BSc & more", color: "from-brand-pink to-brand-amber" },
  { title: "Coding Practice", icon: Code2, desc: "DSA, Web, Python, C++ — beginner to advanced", color: "from-brand-amber to-brand-pink" },
  { title: "Aptitude", icon: Calculator, desc: "Quant, LR, Verbal for placements & exams", color: "from-brand-violet to-brand-cyan" },
];

const DIFFICULTIES = ["Beginner", "Easy", "Medium", "Hard", "Advanced"];

const SOON = ["UPSC", "GATE", "CAT", "SSC", "Banking", "CUET", "Scholarships", "Internships"];

function Learn() {
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><GraduationCap className="h-7 w-7 text-primary" /> Learning Modules</h1>
      <p className="mt-1 text-muted-foreground">Pick a track. Practice with AI-explained quizzes. Track your streak.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {DIFFICULTIES.map((d) => (
          <span key={d} className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">{d}</span>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TRACKS.map((t) => (
          <button key={t.title} className="group relative overflow-hidden rounded-2xl border bg-card p-6 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow">
            <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${t.color} opacity-20 blur-2xl transition group-hover:opacity-40`} />
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-glow`}>
              <t.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Quizzes</span>
              <span className="inline-flex items-center gap-1"><FlaskConical className="h-3.5 w-3.5" /> Mocks</span>
              <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> PYQs</span>
            </div>
          </button>
        ))}
      </div>

      <h2 className="mt-12 mb-4 text-xl font-semibold">Coming soon</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SOON.map((s) => (
          <div key={s} className="flex items-center gap-3 rounded-xl border border-dashed bg-card p-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
