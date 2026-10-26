import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search, Bookmark, Download, Eye, Star, TrendingUp, Volume2 } from "lucide-react";
import { useLocalStore } from "@/lib/local-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notes")({
  component: Notes,
  head: () => ({ meta: [{ title: "Notes — EduVault AI" }] }),
});

type Note = {
  id: string; title: string; subject: string; semester: string; unit: string;
  pages: number; downloads: number; featured?: boolean; popular?: boolean;
};

const NOTES: Note[] = [
  { id: "n1", title: "Kinematics — Complete Notes", subject: "Physics", semester: "Sem 1", unit: "Unit 1", pages: 24, downloads: 1204, featured: true, popular: true },
  { id: "n2", title: "Chemical Bonding Masterclass", subject: "Chemistry", semester: "Sem 1", unit: "Unit 2", pages: 32, downloads: 980, featured: true },
  { id: "n3", title: "Differential Calculus", subject: "Mathematics", semester: "Sem 2", unit: "Unit 3", pages: 40, downloads: 1520, popular: true },
  { id: "n4", title: "Cell Biology in Depth", subject: "Biology", semester: "Sem 1", unit: "Unit 1", pages: 28, downloads: 760 },
  { id: "n5", title: "DSA — Arrays & Strings", subject: "Computer Science", semester: "Sem 3", unit: "Unit 2", pages: 36, downloads: 2140, popular: true, featured: true },
  { id: "n6", title: "Organic Chemistry Reactions", subject: "Chemistry", semester: "Sem 2", unit: "Unit 4", pages: 44, downloads: 890 },
  { id: "n7", title: "Thermodynamics — Laws & Cycles", subject: "Physics", semester: "Sem 2", unit: "Unit 3", pages: 30, downloads: 1050 },
  { id: "n8", title: "Linear Algebra Essentials", subject: "Mathematics", semester: "Sem 3", unit: "Unit 1", pages: 38, downloads: 670 },
  { id: "n9", title: "Genetics & Evolution", subject: "Biology", semester: "Sem 3", unit: "Unit 2", pages: 26, downloads: 540 },
  { id: "n10", title: "Operating Systems Basics", subject: "Computer Science", semester: "Sem 4", unit: "Unit 1", pages: 50, downloads: 1830, popular: true },
];

const SUBJECTS = ["All", ...Array.from(new Set(NOTES.map((n) => n.subject)))];
const SEMS = ["All", "Sem 1", "Sem 2", "Sem 3", "Sem 4"];

function Notes() {
  const [q, setQ] = useState("");
  const [sub, setSub] = useState("All");
  const [sem, setSem] = useState("All");
  const [bm, setBm] = useLocalStore<string[]>("ev:bm:notes", []);
  const [recent, setRecent] = useLocalStore<string[]>("ev:recent:notes", []);

  const filtered = NOTES.filter((n) =>
    (sub === "All" || n.subject === sub) &&
    (sem === "All" || n.semester === sem) &&
    (q === "" || n.title.toLowerCase().includes(q.toLowerCase()))
  );

  function toggleBm(id: string) {
    setBm(bm.includes(id) ? bm.filter((x) => x !== id) : [...bm, id]);
  }
  function open(id: string) {
    setRecent([id, ...recent.filter((x) => x !== id)].slice(0, 6));
    toast.success("Opening note…");
  }

  const recentNotes = recent.map((id) => NOTES.find((n) => n.id === id)).filter(Boolean) as Note[];
  const featured = NOTES.filter((n) => n.featured);
  const popular = NOTES.filter((n) => n.popular);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><FileText className="h-7 w-7 text-primary" /> Notes</h1>
      <p className="mt-1 text-muted-foreground">Semester, subject & unit-wise notes — search, bookmark, download.</p>

      {/* Search + filters */}
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-3 text-sm" />
        </div>
        <select value={sub} onChange={(e) => setSub(e.target.value)} className="rounded-xl border bg-card px-3 py-2.5 text-sm">
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={sem} onChange={(e) => setSem(e.target.value)} className="rounded-xl border bg-card px-3 py-2.5 text-sm">
          {SEMS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {recentNotes.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-semibold">Recently viewed</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{recentNotes.map((n) => <Card key={n.id} n={n} bm={bm} toggleBm={toggleBm} open={open} />)}</div>
        </>
      )}

      <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-semibold"><Star className="h-4 w-4 text-brand-amber" /> Featured</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{featured.map((n) => <Card key={n.id} n={n} bm={bm} toggleBm={toggleBm} open={open} />)}</div>

      <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-semibold"><TrendingUp className="h-4 w-4 text-brand-emerald" /> Popular</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{popular.map((n) => <Card key={n.id} n={n} bm={bm} toggleBm={toggleBm} open={open} />)}</div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">All notes ({filtered.length})</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((n) => <Card key={n.id} n={n} bm={bm} toggleBm={toggleBm} open={open} />)}</div>
    </div>
  );
}

function Card({ n, bm, toggleBm, open }: { n: Note; bm: string[]; toggleBm: (id: string) => void; open: (id: string) => void }) {
  const saved = bm.includes(n.id);
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-glow">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-brand-violet to-brand-pink opacity-20 blur-2xl" />
      <div className="flex items-start justify-between">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{n.subject}</span>
        <button onClick={() => toggleBm(n.id)} className={`rounded-lg p-1.5 ${saved ? "text-brand-amber" : "text-muted-foreground hover:text-foreground"}`}>
          <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-semibold">{n.title}</h3>
      <div className="mt-1 text-xs text-muted-foreground">{n.semester} · {n.unit} · {n.pages} pages</div>
      <div className="mt-1 text-xs text-muted-foreground">{n.downloads.toLocaleString()} downloads</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => open(n.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg brand-bg px-3 py-2 text-xs font-semibold text-white">
          <Eye className="h-3.5 w-3.5" /> View
        </button>
        <Link
          to="/study-reader"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
          title="Listen in Accessible Study Reader with AI"
        >
          <Volume2 className="h-3.5 w-3.5" /> Listen
        </Link>
        <button onClick={() => toast.success("Download started")} className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-accent">
          <Download className="h-3.5 w-3.5" /> PDF
        </button>
      </div>
    </div>
  );
}
