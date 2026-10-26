import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { AccessibilityProvider, SkipToContent } from "../lib/accessibility";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center hero-bg px-4">
      <div className="max-w-md text-center glass-strong rounded-3xl p-10 border border-white/10 shadow-2xl">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  console.error("App Root Error caught:", error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const rawMessage =
    error?.message || (typeof error === "string" ? error : "An unexpected error occurred.");
  const isEnvIssue =
    rawMessage.toLowerCase().includes("supabase") ||
    rawMessage.toLowerCase().includes("environment variable") ||
    !isSupabaseConfigured;

  return (
    <div className="flex min-h-screen items-center justify-center hero-bg px-4 py-12">
      <div className="max-w-lg w-full text-center glass-strong rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="mx-auto w-14 h-14 rounded-2xl brand-bg flex items-center justify-center mb-5 shadow-glow">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Application Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground break-words">{rawMessage}</p>

        {isEnvIssue && (
          <div className="mt-6 text-left p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
            <p className="font-semibold text-amber-300">Vercel Environment Variables Needed:</p>
            <p className="text-[12px] text-amber-100/90">
              Go to <strong>Vercel Dashboard &rarr; Project &rarr; Settings &rarr; Environment Variables</strong> and add:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-amber-200">
              <li><strong className="text-white">VITE_SUPABASE_URL</strong> (Supabase Project URL)</li>
              <li><strong className="text-white">VITE_SUPABASE_PUBLISHABLE_KEY</strong> (Supabase anon key)</li>
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-5 py-2.5 text-sm font-semibold transition"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EduVault AI — AI Study Companion, Vault & Student Network" },
      {
        name: "description",
        content:
          "One platform for every student. Secure document vault, 24/7 AI tutor, LinkedIn-style student network, and learning modules for JEE, NEET, College and School.",
      },
      { property: "og:title", content: "EduVault AI — AI Study Companion, Vault & Student Network" },
      {
        property: "og:description",
        content:
          "One platform for every student. Secure document vault, 24/7 AI tutor, LinkedIn-style student network, and learning modules for JEE, NEET, College and School.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EduVault AI — AI Study Companion, Vault & Student Network" },
      {
        name: "twitter:description",
        content:
          "One platform for every student. Secure document vault, 24/7 AI tutor, LinkedIn-style student network, and learning modules for JEE, NEET, College and School.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6cdd4188-d8a1-4f2b-9bd5-2cc99f2d6bcf/id-preview-0e897d5c--570f3813-a765-4804-b1a3-a4c5c380e54a.lovable.app-1783700404755.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6cdd4188-d8a1-4f2b-9bd5-2cc99f2d6bcf/id-preview-0e897d5c--570f3813-a765-4804-b1a3-a4c5c380e54a.lovable.app-1783700404755.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [showConfigNotice, setShowConfigNotice] = useState(!isSupabaseConfigured);

  useEffect(() => {
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      return () => {
        sub?.subscription?.unsubscribe?.();
      };
    } catch (err) {
      console.warn("[Auth Listener] Failed to subscribe to auth state changes:", err);
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <SkipToContent targetId="main-content" />
        {showConfigNotice && (
          <div className="relative z-50 bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 text-center flex items-center justify-between shadow-lg">
            <div className="flex-1 text-center font-medium">
              <span>
                ℹ️ <strong>Demo Mode:</strong> Supabase environment variables are missing in Vercel. Set{" "}
                <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">VITE_SUPABASE_URL</code> and{" "}
                <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">VITE_SUPABASE_PUBLISHABLE_KEY</code> in Vercel Settings to enable live login.
              </span>
            </div>
            <button
              onClick={() => setShowConfigNotice(false)}
              aria-label="Dismiss notice"
              className="ml-3 text-amber-300/80 hover:text-white font-bold px-1.5 py-0.5 rounded text-sm transition"
            >
              ✕
            </button>
          </div>
        )}
        <Outlet />
        <Toaster position="top-right" richColors closeButton />
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}
