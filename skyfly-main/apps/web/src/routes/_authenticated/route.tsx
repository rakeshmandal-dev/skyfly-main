import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, FolderLock, Sparkles, Users, GraduationCap,
  User as UserIcon, LogOut, Menu, X, FileText, FileQuestion, Brain,
  ClipboardList, BookOpen, CalendarDays, LineChart, Trophy,
  Bookmark, Award, Settings as SettingsIcon, Video, Mic, Camera,
  Compass, MessagesSquare, BookX, HeartHandshake, Zap, Coins,
  MessageSquare, Sun, Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
    return { user: data.user };
  },
  component: AuthedLayout,
});

const NAV_GROUPS = [
  {
    title: "AI & 3D Learning",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/classroom", label: "3D Classroom", icon: Video },
      { to: "/ai", label: "AI Assistant", icon: Sparkles },
      { to: "/teacher", label: "Personal Teacher", icon: GraduationCap },
      { to: "/mentor", label: "AI Mentor", icon: HeartHandshake },
      { to: "/voice", label: "Voice AI Teacher", icon: Mic },
      { to: "/study-reader", label: "Accessible Study Reader", icon: BookOpen },
      { to: "/camera", label: "Camera AI Solver", icon: Camera },
    ],
  },
  {
    title: "Academics & Tests",
    items: [
      { to: "/subjects", label: "Subjects", icon: BookOpen },
      { to: "/notes", label: "Notes Library", icon: FileText },
      { to: "/pyqs", label: "Previous Years (PYQs)", icon: FileQuestion },
      { to: "/quiz", label: "Practice Quizzes", icon: Brain },
      { to: "/exam", label: "Exam Simulation", icon: ClipboardList },
      { to: "/mock-tests", label: "Timed Mocks", icon: Trophy },
      { to: "/viva", label: "Oral Viva Interview", icon: MessagesSquare },
      { to: "/mistakes", label: "Mistake Notebook", icon: BookX },
    ],
  },
  {
    title: "Planning & Growth",
    items: [
      { to: "/planner", label: "Study Planner", icon: CalendarDays },
      { to: "/career", label: "AI Career Roadmap", icon: Compass },
      { to: "/progress", label: "Progress & Readiness", icon: LineChart },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/bookmarks", label: "Saved Bookmarks", icon: Bookmark },
      { to: "/vault", label: "Encrypted Vault", icon: FolderLock },
      { to: "/certificates", label: "Certificates", icon: Award },
      { to: "/low-resource", label: "Low-Resource Mode", icon: Zap },
    ],
  },
  {
    title: "Community & Impact",
    items: [
      { to: "/udaan", label: "Udaan Mission (Free)", icon: HeartHandshake },
      { to: "/network", label: "Student Network", icon: Users },
      { to: "/impact", label: "Impact Dashboard", icon: LineChart },
      { to: "/impact-access", label: "Impact Access (Free)", icon: HeartHandshake },
      { to: "/feedback", label: "Student Feedback", icon: MessageSquare },
      { to: "/profile", label: "My Profile", icon: UserIcon },
      { to: "/settings", label: "Account Settings", icon: SettingsIcon },
    ],
  },
];

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["credit-wallet", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("credit_wallets").select("balance").eq("user_id", user.id).maybeSingle();
      return data;
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.full_name || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card/80 backdrop-blur px-4 py-3 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg brand-bg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base">EduVault <span className="gradient-text">AI</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <AccessibilityToolbar />
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
            className="rounded-lg p-2 hover:bg-accent text-muted-foreground"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="rounded-lg p-2 hover:bg-accent"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } fixed inset-x-0 top-14 z-30 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:border-b-0 lg:border-r shrink-0`}
        >
          <div className="flex h-full flex-col">
            {/* Desktop Brand Header */}
            <div className="hidden items-center justify-between border-b p-4 lg:flex gap-2">
              <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl brand-bg glow">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight truncate">EduVault <span className="gradient-text">AI</span></span>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <AccessibilityToolbar />
                <button
                  onClick={() => setIsDark(!isDark)}
                  aria-label="Toggle theme"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Navigation links grouped by theme */}
            <nav className="flex-1 space-y-5 p-3 overflow-y-auto">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const active = pathname === item.to || pathname.startsWith(item.to + "/");
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
                          active
                            ? "brand-bg text-white shadow-glow font-semibold"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Credits Counter & Profile Footer */}
            <div className="border-t p-3 space-y-2 bg-sidebar/50">
              <div className="flex items-center justify-between rounded-xl bg-card px-3 py-2 border shadow-sm">
                <div className="flex items-center gap-2 text-xs">
                  <Coins className="h-3.5 w-3.5 text-brand-amber" />
                  <span className="text-muted-foreground">Credits:</span>
                  <strong className="text-foreground">{wallet?.balance ?? 0}</strong>
                </div>
                <Link to="/progress" className="text-[11px] text-primary hover:underline">
                  Earn more
                </Link>
              </div>

              <div className="flex items-center gap-3 rounded-xl p-2 bg-card border">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full brand-bg text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">{profile?.full_name || "Student"}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>
                </div>
                <button
                  onClick={signOut}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Viewport */}
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 bg-background focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
