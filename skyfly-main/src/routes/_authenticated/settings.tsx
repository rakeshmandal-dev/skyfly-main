import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, LogOut } from "lucide-react";
import { useEffect } from "react";
import { useLocalStore } from "@/lib/local-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — EduVault AI" }] }),
});

function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useLocalStore<"light" | "dark">("ev:theme", "light");
  const [notif, setNotif] = useLocalStore("ev:notif", true);
  const [emailUpd, setEmailUpd] = useLocalStore("ev:email-upd", true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><SettingsIcon className="h-7 w-7 text-primary" /> Settings</h1>
      <p className="mt-1 text-muted-foreground">Personalize your EduVault experience.</p>

      <div className="mt-8 space-y-4">
        <Row icon={theme === "dark" ? Moon : Sun} title="Appearance" desc="Switch between light and dark mode.">
          <div className="inline-flex rounded-full border bg-card p-1 text-xs">
            <button onClick={() => setTheme("light")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${theme === "light" ? "brand-bg text-white" : ""}`}><Sun className="h-3.5 w-3.5" /> Light</button>
            <button onClick={() => setTheme("dark")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${theme === "dark" ? "brand-bg text-white" : ""}`}><Moon className="h-3.5 w-3.5" /> Dark</button>
          </div>
        </Row>

        <Row icon={Bell} title="Notifications" desc="Study reminders & streak alerts.">
          <Toggle on={notif} onChange={setNotif} />
        </Row>

        <Row icon={Bell} title="Email updates" desc="Weekly progress recap & new content.">
          <Toggle on={emailUpd} onChange={setEmailUpd} />
        </Row>

        <Row icon={Shield} title="Privacy" desc="Your data stays private. Documents are encrypted at rest.">
          <span className="text-xs text-muted-foreground">RLS enabled</span>
        </Row>

        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <LogOut className="h-4 w-4" /> Sign out of EduVault
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, desc, children }: any) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl brand-bg text-white"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`h-6 w-11 rounded-full transition ${on ? "brand-bg" : "bg-muted"}`}>
      <span className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition ${on ? "translate-x-[22px]" : ""}`} />
    </button>
  );
}
