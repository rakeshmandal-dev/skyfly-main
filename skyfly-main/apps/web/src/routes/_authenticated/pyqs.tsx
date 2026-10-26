import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileQuestion, Search, Download, Eye, Bookmark } from "lucide-react";
import { useLocalStore } from "@/lib/local-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pyqs")({
  component: PYQs,
  head: () => ({ meta: [{ title: "PYQs — EduVault AI" }] }),
});

type Paper = { id: string; university: string; semester: string; subject: string; year: number; questions: number };

const PAPERS: Paper[] = [
  { id: "p1", university: "AKTU", semester: "Sem 3", subject: "Data Structures", year: 2024, questions: 40 },
  { id: "p2", university: "AKTU", semester: "Sem 3", subject: "Data Structures", year: 2023, questions: 40 },
  { id: "p3", university: "DTU", semester: "Sem 2", subject: "Engineering Mathematics", year: 2024, questions: 35 },
  { id: "p4", university: "IITB", semester: "Sem 1", subject: "Physics", year: 2023, questions: 30 },
  { id: "p5", university: "NTA", semester: "JEE Main", subject: "Chemistry", year: 2024, questions: 75 },
  { id: "p6", university: "NTA", semester: "NEET", subject: "Biology", year: 2024, questions: 90 },
  { id: "p7", university: "CBSE", semester: "Class 12", subject: "Mathematics", year: 2024, questions: 38 },
  { id: "p8", university: "CBSE", semester: "Class 12", subject: "Physics", year: 2023, questions: 33 },
  { id: "p9", university: "VTU", semester: "Sem 4", subject: "Operating Systems", year: 2024, questions: 40 },
  { id: "p10", university: "MU", semester: "Sem 5", subject: "Computer Networks", year: 2023, questions: 40 },
  { id: "p11", university: "AKTU", semester: "Sem 4", subject: "DBMS", year: 2024, questions: 40 },
  { id: "p12", university: "GTU", semester: "Sem 3", subject: "Digital Electronics", year: 2023, questions: 35 },
];

const UNIS = ["All", ...Array.from(new Set(PAPERS.map((p) => p.university)))];
const SUBS = ["All", ...Array.from(new Set(PAPERS.map((p) => p.subject)))];
const YEARS = ["All", "2024", "2023", "2022"];

function PYQs() {
  const [q, setQ] = useState("");
  const [uni, setUni] = useState("All");
  const [sub, setSub] = useState("All");
  const [yr, setYr] = useState("All");
  const [bm, setBm] = useLocalStore<string[]>("ev:bm:pyqs", []);

  const filtered = PAPERS.filter((p) =>
    (uni === "All" || p.university === uni) &&
    (sub === "All" || p.subject === sub) &&
    (yr === "All" || String(p.year) === yr) &&
    (q === "" || p.subject.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><FileQuestion className="h-7 w-7 text-primary" /> Previous Year Papers</h1>
      <p className="mt-1 text-muted-foreground">Filter by university, semester, subject or year. Preview & download.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_repeat(3,auto)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject…" className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-3 text-sm" />
        </div>
        <select value={uni} onChange={(e) => setUni(e.target.value)} className="rounded-xl border bg-card px-3 py-2.5 text-sm">{UNIS.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={sub} onChange={(e) => setSub(e.target.value)} className="rounded-xl border bg-card px-3 py-2.5 text-sm">{SUBS.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={yr} onChange={(e) => setYr(e.target.value)} className="rounded-xl border bg-card px-3 py-2.5 text-sm">{YEARS.map((s) => <option key={s}>{s}</option>)}</select>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const saved = bm.includes(p.id);
          return (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-brand-emerald to-brand-cyan opacity-20 blur-2xl" />
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{p.university} · {p.year}</span>
                <button onClick={() => setBm(saved ? bm.filter((x) => x !== p.id) : [...bm, p.id])} className={`rounded-lg p-1.5 ${saved ? "text-brand-amber" : "text-muted-foreground hover:text-foreground"}`}>
                  <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                </button>
              </div>
              <h3 className="mt-3 line-clamp-2 text-base font-semibold">{p.subject}</h3>
              <div className="mt-1 text-xs text-muted-foreground">{p.semester} · {p.questions} questions</div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => toast.success("Opening preview")} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg brand-bg px-3 py-2 text-xs font-semibold text-white"><Eye className="h-3.5 w-3.5" /> Preview</button>
                <button onClick={() => toast.success("Download started")} className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-accent"><Download className="h-3.5 w-3.5" /> PDF</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
