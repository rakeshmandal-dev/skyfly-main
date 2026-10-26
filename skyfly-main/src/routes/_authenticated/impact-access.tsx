import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartHandshake, CheckCircle2, Loader2, School, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/impact-access")({
  component: ImpactAccess,
  head: () => ({
    meta: [
      { title: "Impact Access — Free premium for every student | EduVault AI" },
      {
        name: "description",
        content:
          "Students from government and government-aided schools can unlock EduVault AI premium free through the Impact Access Program.",
      },
      { property: "og:title", content: "Impact Access — Free premium for every student" },
      {
        property: "og:description",
        content:
          "Apply with your school type, income declaration or an NGO referral code and get full premium access at no cost.",
      },
    ],
  }),
});

type SchoolType = "government" | "government_aided";

function ImpactAccess() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const [schoolType, setSchoolType] = useState<SchoolType>(
    meta.impact_school_type === "government_aided" ? "government_aided" : "government",
  );
  const [income, setIncome] = useState(Boolean(meta.impact_income_declared));
  const [code, setCode] = useState(String(meta.impact_referral_code ?? ""));
  const [saving, setSaving] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: ["impact-application", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("impact_applications")
        .select("*, ngo_partners(name)")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (meta.impact_referral_code) setCode(String(meta.impact_referral_code));
  }, [meta.impact_referral_code]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!income && !code.trim()) {
      toast.error("Tick the income declaration or add an NGO referral code.");
      return;
    }
    setSaving(true);
    try {
      let partnerId: string | null = null;
      const trimmed = code.trim().toUpperCase();
      if (trimmed) {
        const { data: partner } = await supabase
          .from("ngo_partners")
          .select("id")
          .eq("referral_code", trimmed)
          .maybeSingle();
        if (!partner) {
          toast.error("That referral code doesn't match any partner organisation.");
          setSaving(false);
          return;
        }
        partnerId = partner.id;
      }

      const { error } = await supabase.from("impact_applications").insert({
        user_id: user.id,
        school_type: schoolType,
        income_declared: income,
        referral_code: trimmed || null,
        partner_id: partnerId,
      });
      if (error) throw error;

      await supabase
        .from("profiles")
        .update({ impact_access: true, impact_partner_id: partnerId })
        .eq("id", user.id);

      toast.success("Impact Access unlocked — premium is now free for you.");
      queryClient.invalidateQueries({ queryKey: ["impact-application", user.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your application");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-emerald to-brand-cyan text-white shadow-glow">
          <HeartHandshake className="h-5 w-5" />
        </span>
        Impact Access Program
      </h1>
      <p className="mt-3 text-muted-foreground">
        Learning shouldn't depend on what a family can afford. Students from government and
        government-aided schools get every premium feature — AI tutor, vault, mock tests — free.
      </p>

      {isLoading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your status…
        </div>
      ) : application ? (
        <div className="mt-8 rounded-3xl border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-brand-emerald" />
            <div>
              <div className="text-lg font-semibold">Impact Access is active</div>
              <div className="text-sm text-muted-foreground">
                Premium unlocked at no cost. Nothing else to do.
              </div>
            </div>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">School type</dt>
              <dd className="mt-1 text-sm font-medium">
                {application.school_type === "government_aided" ? "Government-aided" : "Government"}
              </dd>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Declaration</dt>
              <dd className="mt-1 text-sm font-medium">
                {application.income_declared ? "Self-declared" : "Not required"}
              </dd>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Partner</dt>
              <dd className="mt-1 text-sm font-medium">
                {(application as any)?.ngo_partners?.name ?? "Direct application"}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mt-8 space-y-6 rounded-3xl border bg-card p-8 shadow-[var(--shadow-card)]"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">I study in a</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["government", "Government school"],
                  ["government_aided", "Government-aided school"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSchoolType(value)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${schoolType === value ? "border-primary bg-accent" : "hover:bg-accent/50"}`}
                >
                  <School className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm">
            <input
              type="checkbox"
              checked={income}
              onChange={(e) => setIncome(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              I declare that my family income is low and paid plans are out of reach.
              <span className="mt-1 block text-xs text-muted-foreground">
                Self-declared — no documents needed. We trust you.
              </span>
            </span>
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium">NGO referral code (optional)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={32}
              placeholder="e.g. BRIGHT25"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm uppercase outline-none ring-ring focus:ring-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Got a code from an NGO or school programme? Add it and your access is instant.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-full brand-bg px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Unlock free premium access
          </button>
        </form>
      )}
    </div>
  );
}
