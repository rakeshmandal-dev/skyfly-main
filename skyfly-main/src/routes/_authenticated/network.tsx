import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Send, Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/network")({
  component: Network,
  head: () => ({ meta: [{ title: "Network — EduVault AI" }] }),
});

function Network() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts-feed"],
    queryFn: async () => {
      const { data: p } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
      if (!p || p.length === 0) return [];
      const ids = Array.from(new Set(p.map((x) => x.user_id)));
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", ids);
      const byId = new Map(profiles?.map((p) => [p.id, p]));
      return p.map((post) => ({ ...post, author: byId.get(post.user_id) }));
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("posts").insert({ user_id: user.id, content: content.trim() });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setContent("");
    toast.success("Posted!");
    qc.invalidateQueries({ queryKey: ["posts-feed"] });
  }

  async function toggleLike(postId: string) {
    const { data: existing } = await supabase.from("post_likes").select("*").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.rpc; // no-op
      await supabase.from("posts").update({ likes_count: Math.max(0, (posts.find((p) => p.id === postId)?.likes_count ?? 1) - 1) }).eq("id", postId);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      await supabase.from("posts").update({ likes_count: (posts.find((p) => p.id === postId)?.likes_count ?? 0) + 1 }).eq("id", postId);
    }
    qc.invalidateQueries({ queryKey: ["posts-feed"] });
  }

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><Users className="h-7 w-7 text-primary" /> Student Network</h1>
      <p className="mt-1 text-muted-foreground">Share, learn, and grow with fellow students.</p>

      {/* Composer */}
      <form onSubmit={submit} className="mt-6 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="What are you learning today?"
          className="w-full resize-none rounded-lg bg-transparent text-sm outline-none"
        />
        <div className="mt-3 flex items-center justify-end">
          <button type="submit" disabled={posting || !content.trim()} className="inline-flex items-center gap-2 rounded-full brand-bg px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </button>
        </div>
      </form>

      {/* Feed */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            No posts yet. Be the first to share!
          </div>
        ) : (
          posts.map((p) => {
            const initials = (p.author?.full_name || "?").slice(0, 2).toUpperCase();
            return (
              <article key={p.id} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
                <header className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full brand-bg text-sm font-semibold text-white">{initials}</div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.author?.full_name || "Student"}</div>
                    <div className="text-xs text-muted-foreground">@{p.author?.username || "student"} · {new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                </header>
                <p className="mt-3 whitespace-pre-wrap text-sm">{p.content}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <button onClick={() => toggleLike(p.id)} className="inline-flex items-center gap-1.5 hover:text-brand-pink transition">
                    <Heart className="h-4 w-4" /> {p.likes_count}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
