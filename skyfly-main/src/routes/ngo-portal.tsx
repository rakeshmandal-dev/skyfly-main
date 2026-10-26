import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartHandshake, Users, Mail, Copy, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ngo-portal")({
  component: NgoPortal,
  head: () => ({
    meta: [
      { title: "NGO Partner Portal — EduVault AI Impact Access" },
      {
        name: "description",
        content:
          "NGOs and school programmes can onboard students in bulk, share referral codes and track how many students are learning on EduVault AI.",
      },
      { property: "og:title", content: "NGO Partner Portal — EduVault AI" },
      {
        property: "og:description",
        content:
          "Add student emails in bulk, share your referral code and see your programme's usage summary.",
      },
    ],
  }),
});

function NgoPortal() {
  const queryClient = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [emails, setEmails] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["ngo-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ngo_partners")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const partner = partners.find((p) => p.id === selected) ?? partners[0];

  const { data: invites = [] } = useQuery({
    queryKey: ["ngo-invites", partner?.id],
    enabled: Boolean(partner?.id) && signedIn,
    queryFn: async () => {
      const { data } = await supabase
        .from("ngo_invites")
        .select("id, email, created_at")
        .eq("partner_id", partner!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  async function importEmails(e: React.FormEvent) {
    e.preventDefault();
    if (!partner) return;
    const list = Array.from(
      new Set(
        emails
          .split(/[\s,;]+/)
          .map((s) => s.trim().toLowerCase())
          .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 255),
      ),
    );
    if (!list.length) {
      toast.error("Add at least one valid email address.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("ngo_invites")
        .upsert(
          list.map((email) => ({ partner_id: partner.id, email })),
          { onConflict: "partner_id,email", ignoreDuplicates: true },
        );
      if (error) throw error;
      toast.success(`${list.length} student ${list.length === 1 ? "email" : "emails"} imported.`);
      setEmails("");
      queryClient.invalidateQueries({ queryKey: ["ngo-invites", partner.id] });
      queryClient.invalidateQueries({ queryKey: ["ngo-partners"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 glass border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl brand-bg glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              EduVault <span className="gradient-text">AI</span>
            </span>
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" as const }}
            className="rounded-full brand-bg px-4 py-2 text-sm font-semibold text-white shadow-glow hover:opacity-90"
          >
            {signedIn ? "Go to app" : "Create account"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-emerald to-brand-cyan text-white shadow-glow">
            <HeartHandshake className="h-5 w-5" />
          </span>
          NGO Partner Portal
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Onboard your students in bulk, share your referral code and track how your programme is
          being used — all free, as part of the Impact Access Program.
        </p>

        {isLoading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading partners…
          </div>
        ) : !partner ? (
          <p className="mt-10 text-sm text-muted-foreground">No partner organisations yet.</p>
        ) : (
          <>
            {partners.length > 1 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {partners.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${p.id === partner.id ? "brand-bg text-white shadow-glow" : "bg-card hover:bg-accent"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Students onboarded", value: partner.students_joined, icon: Users },
                { label: "Active this month", value: partner.active_students, icon: CheckCircle2 },
                { label: "Emails imported", value: partner.invited_emails, icon: Mail },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]"
                >
                  <s.icon className="h-5 w-5 text-brand-violet" />
                  <div className="mt-3 text-3xl font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border bg-card p-8 shadow-[var(--shadow-card)]">
                <h2 className="text-lg font-semibold">{partner.name} referral code</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Students enter this code during Impact Access signup to unlock premium instantly.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <code className="rounded-xl bg-muted px-4 py-3 text-xl font-bold tracking-widest">
                    {partner.referral_code}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(partner.referral_code);
                      toast.success("Referral code copied");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                </div>
                {partner.contact_email && (
                  <p className="mt-6 text-sm text-muted-foreground">
                    Programme contact:{" "}
                    <span className="font-medium text-foreground">{partner.contact_email}</span>
                  </p>
                )}
              </div>

              <div className="rounded-3xl border bg-card p-8 shadow-[var(--shadow-card)]">
                <h2 className="text-lg font-semibold">Bulk import student emails</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paste one email per line (or comma separated). We'll invite them to claim free
                  premium.
                </p>
                {signedIn ? (
                  <form onSubmit={importEmails} className="mt-4 space-y-3">
                    <textarea
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      rows={6}
                      placeholder={"priya@example.com\narjun@example.com"}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:opacity-90 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Import students
                    </button>
                  </form>
                ) : (
                  <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                    <Link to="/auth" className="font-semibold text-primary hover:underline">
                      Sign in
                    </Link>{" "}
                    to import students and see your invite list.
                  </p>
                )}

                {invites.length > 0 && (
                  <ul className="mt-6 max-h-48 space-y-1 overflow-y-auto text-sm">
                    {invites.map((i) => (
                      <li key={i.id} className="rounded-lg bg-muted/50 px-3 py-1.5">
                        {i.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
