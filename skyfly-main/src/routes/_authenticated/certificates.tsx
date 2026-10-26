import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Award, Lock, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/certificates")({
  component: Certificates,
  head: () => ({ meta: [{ title: "Certificates — EduVault AI" }] }),
});

const CERTS = [
  { id: "c1", title: "Quiz Rookie", desc: "Complete your first 5 quizzes", req: 5 },
  { id: "c2", title: "Consistent Learner", desc: "Attempt 20 quizzes", req: 20 },
  { id: "c3", title: "Accuracy Star", desc: "Reach 80%+ overall accuracy (min 10 quizzes)", req: 10, acc: 80 },
  { id: "c4", title: "Mock Test Champion", desc: "Complete 3 mock tests", req: 3, kind: "mock" as const },
  { id: "c5", title: "XP 500 Club", desc: "Earn 500 XP", req: 500, kind: "xp" as const },
  { id: "c6", title: "XP 2000 Elite", desc: "Earn 2000 XP", req: 2000, kind: "xp" as const },
];

function Certificates() {
  const { user } = Route.useRouteContext();
  const { data } = useQuery({
    queryKey: ["certs", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("quiz_attempts").select("*").eq("user_id", user.id);
      return data ?? [];
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () =>
      (await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()).data,
  });
  const attempts = data ?? [];
  const totalQ = attempts.reduce((s, a) => s + a.total, 0);
  const totalC = attempts.reduce((s, a) => s + a.score, 0);
  const acc = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
  const xp = totalC * 10;
  const mocks = attempts.filter((a) => a.topic?.toLowerCase().includes("mock")).length;

  function earned(c: (typeof CERTS)[number]) {
    if (c.kind === "xp") return xp >= c.req;
    if (c.kind === "mock") return mocks >= c.req;
    if (c.acc) return attempts.length >= c.req && acc >= c.acc;
    return attempts.length >= c.req;
  }

  async function downloadCertificate(c: (typeof CERTS)[number]) {
    const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js");
    const name = profile?.full_name || "Student";
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(6);
    doc.rect(24, 24, width - 48, height - 48);
    doc.setDrawColor(236, 72, 153);
    doc.setLineWidth(1.5);
    doc.rect(36, 36, width - 72, height - 72);

    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("EDUVAULT AI", width / 2, 90, { align: "center" });

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(30);
    doc.text("Certificate of Achievement", width / 2, 140, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("This certifies that", width / 2, 190, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(236, 72, 153);
    doc.text(name, width / 2, 230, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(`has earned the "${c.title}" certificate`, width / 2, 265, { align: "center" });
    doc.setFontSize(12);
    doc.text(c.desc, width / 2, 288, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Issued on ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`,
      width / 2,
      height - 70,
      { align: "center" },
    );

    doc.save(`EduVault-Certificate-${c.title.replace(/\s+/g, "-")}.pdf`);
    toast.success("Certificate downloaded");
  }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><Award className="h-7 w-7 text-primary" /> Certificates</h1>
      <p className="mt-1 text-muted-foreground">Earn shareable certificates as you progress.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CERTS.map((c) => {
          const done = earned(c);
          return (
            <div key={c.id} className={`relative overflow-hidden rounded-2xl border p-6 shadow-[var(--shadow-card)] ${done ? "bg-card" : "bg-muted/30"}`}>
              <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${done ? "brand-bg" : "bg-muted-foreground/20"} opacity-20 blur-2xl`} />
              <div className={`grid h-14 w-14 place-items-center rounded-2xl ${done ? "brand-bg text-white shadow-glow" : "bg-muted text-muted-foreground"}`}>
                {done ? <Award className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              {done ? (
                <button onClick={() => void downloadCertificate(c)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg brand-bg px-3 py-2 text-xs font-semibold text-white">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
              ) : (
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5" /> Keep going to unlock</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
