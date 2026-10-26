import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Sparkles, GraduationCap, School, Loader2, Eye, EyeOff, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — EduVault AI" },
      { name: "description", content: "Sign in or create your student account on EduVault AI." },
    ],
  }),
});

function AuthPage() {
  const { mode, redirect: redirectParam } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentType, setStudentType] = useState<"school" | "college">("college");
  const [emailPendingVerification, setEmailPendingVerification] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const destination = redirectParam || "/dashboard";

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: destination });
      }
    });
  }, [navigate, destination]);

  useEffect(() => {
    setIsSignup(mode === "signup");
  }, [mode]);

  async function handleEmailAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      const msg = "Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel Settings.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const fullName = String(fd.get("full_name") || "").trim();

    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        if (!fullName) {
          setErrorMsg("Please enter your full name.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${destination}`,
            data: { full_name: fullName, student_type: studentType },
          },
        });

        if (error) throw error;

        // If email verification is required by the project
        if (!data.session) {
          setEmailPendingVerification(email);
          toast.success("Account created! Please check your email to verify your account.");
          return;
        }

        toast.success("Welcome to EduVault AI!");
        navigate({ to: destination });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setEmailPendingVerification(email);
            throw new Error("Your email is not verified yet. Please check your inbox or resend verification.");
          }
          throw error;
        }

        if (data.session) {
          toast.success("Welcome back!");
          navigate({ to: destination });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      const msg = "Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel Settings.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("reset_email") || "").trim();

    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      toast.success("Password reset instructions sent to your email!");
      setIsForgotPassword(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password reset failed";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!emailPendingVerification) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailPendingVerification,
        options: {
          emailRedirectTo: `${window.location.origin}${destination}`,
        },
      });
      if (error) throw error;
      toast.success("Verification email resent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend email");
    } finally {
      setResending(false);
    }
  }

  async function handleGoogleOAuth() {
    if (!isSupabaseConfigured) {
      const msg = "Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel Settings.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${destination}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
      setErrorMsg(msg);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Left: Brand Showcase Panel */}
      <div className="relative hidden overflow-hidden hero-bg lg:flex flex-col justify-between p-12 text-white border-r border-white/10">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur border border-white/20">
              <Sparkles className="h-5 w-5 text-brand-cyan" />
            </div>
            <span className="text-xl font-bold tracking-tight">EduVault <span className="gradient-text">AI</span></span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs backdrop-blur">
            <GraduationCap className="h-4 w-4 text-brand-amber" /> Real-time 3D Virtual Teacher & Study Companion
          </div>
          <h2 className="text-4xl font-extrabold leading-tight">
            Learn faster with an interactive 3D teacher by your side.
          </h2>
          <p className="text-white/80 leading-relaxed">
            One platform for every student: personalized 3D lessons, AI-curated mistake notebooks, oral viva simulations, and an encrypted academic vault.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-sm">
            <div>
              <div className="text-2xl font-bold text-brand-cyan">18</div>
              <div className="text-white/60 text-xs mt-0.5">Indian Languages</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-pink">24/7</div>
              <div className="text-white/60 text-xs mt-0.5">3D AI Tutor</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-amber">100%</div>
              <div className="text-white/60 text-xs mt-0.5">Private Vault</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} EduVault AI · Built for serious learners
        </div>
      </div>

      {/* Right: Auth Forms */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between lg:hidden mb-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg brand-bg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">EduVault <span className="gradient-text">AI</span></span>
            </Link>
          </div>

          {/* Pending Verification Banner State */}
          {emailPendingVerification ? (
            <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-[var(--shadow-card)] space-y-5 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl brand-bg text-white">
                <Mail className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Check your inbox</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a verification link to <strong className="text-foreground">{emailPendingVerification}</strong>. Please click the link to confirm your account.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="w-full rounded-xl brand-bg py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                  Resend confirmation email
                </button>
                <button
                  onClick={() => {
                    setEmailPendingVerification(null);
                    setIsSignup(false);
                  }}
                  className="w-full rounded-xl border py-2.5 text-sm font-medium hover:bg-accent transition"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          ) : isForgotPassword ? (
            /* Forgot Password Flow */
            <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] space-y-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl brand-bg text-white">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Reset your password</h3>
                  <p className="text-xs text-muted-foreground">Enter your account email to receive reset instructions</p>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="reset_email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email address
                  </label>
                  <input
                    id="reset_email"
                    name="reset_email"
                    type="email"
                    required
                    placeholder="you@school.edu"
                    className="mt-1.5 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl brand-bg py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send reset link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setErrorMsg(null);
                    }}
                    className="rounded-xl border px-4 py-2.5 text-sm hover:bg-accent transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Signin / Signup Card */
            <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
              {!isSupabaseConfigured && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 space-y-1.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span>⚠️</span> Vercel Configuration Notice
                  </div>
                  <p className="text-[12px] text-amber-100/90 leading-relaxed">
                    Authentication requires Supabase environment variables in Vercel:
                  </p>
                  <div className="font-mono text-[11px] bg-black/40 p-2 rounded text-amber-200 space-y-0.5">
                    <div>VITE_SUPABASE_URL</div>
                    <div>VITE_SUPABASE_PUBLISHABLE_KEY</div>
                  </div>
                </div>
              )}

              {/* Tab Selector */}
              <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    setErrorMsg(null);
                  }}
                  className={`rounded-lg py-2 transition ${!isSignup ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    setErrorMsg(null);
                  }}
                  className={`rounded-lg py-2 transition ${isSignup ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Create account
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleOAuth}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border bg-background py-2.5 text-sm font-semibold hover:bg-accent transition disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-border" />
                <span className="absolute bg-card px-3 text-xs uppercase text-muted-foreground">or email</span>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignup && (
                  <>
                    <div>
                      <label htmlFor="full_name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Full Name
                      </label>
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        required
                        placeholder="e.g. Aditi Sharma"
                        className="mt-1.5 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        I am currently studying in
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setStudentType("college")}
                          className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-medium transition ${studentType === "college" ? "border-primary brand-bg text-white" : "hover:bg-accent"}`}
                        >
                          <GraduationCap className="h-4 w-4" /> College / Univ
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentType("school")}
                          className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-medium transition ${studentType === "school" ? "border-primary brand-bg text-white" : "hover:bg-accent"}`}
                        >
                          <School className="h-4 w-4" /> School (6–12)
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="student@example.com"
                    className="mt-1.5 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Password
                    </label>
                    {!isSignup && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorMsg(null);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full rounded-xl border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl brand-bg py-3 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isSignup ? "Create free student account" : "Sign in to EduVault AI"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
