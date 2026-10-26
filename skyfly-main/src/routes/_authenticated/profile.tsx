import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile — EduVault AI" }] }),
});

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });

  const [form, setForm] = useState({
    full_name: "", username: "", bio: "", institution: "", grade_or_year: "", skills: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        username: profile.username ?? "",
        bio: profile.bio ?? "",
        institution: profile.institution ?? "",
        grade_or_year: profile.grade_or_year ?? "",
        skills: (profile.skills ?? []).join(", "),
      });
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name || null,
      username: form.username || null,
      bio: form.bio || null,
      institution: form.institution || null,
      grade_or_year: form.grade_or_year || null,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const initials = (form.full_name || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><UserIcon className="h-7 w-7 text-primary" /> Your Profile</h1>
      <p className="mt-1 text-muted-foreground">This is how other students see you.</p>

      <div className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-card)]">
        <div className="h-32 hero-bg" />
        <div className="px-6 pb-6">
          <div className="-mt-10 grid h-20 w-20 place-items-center rounded-2xl border-4 border-card brand-bg text-2xl font-bold text-white shadow-glow">{initials}</div>
        </div>

        <form onSubmit={save} className="grid gap-4 px-6 pb-8 sm:grid-cols-2">
          <Field label="Full name"><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} /></Field>
          <Field label="Username"><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} /></Field>
          <Field label="Institution / School"><input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className={inputCls} /></Field>
          <Field label="Grade / Year"><input value={form.grade_or_year} onChange={(e) => setForm({ ...form, grade_or_year: e.target.value })} placeholder="e.g. Class 12, 2nd year B.Tech" className={inputCls} /></Field>
          <Field label="Skills (comma-separated)" full><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, DSA, Physics" className={inputCls} /></Field>
          <Field label="Bio" full><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className={inputCls} /></Field>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
