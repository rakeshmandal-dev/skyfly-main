import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { HeartHandshake, Send, Loader2, User as UserIcon, PhoneCall } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/mentor")({
  component: AIMentor,
  head: () => ({ meta: [{ title: "AI Mentor — EduVault AI" }] }),
});

const STARTERS = [
  "I'm feeling really stressed about my exams",
  "I don't feel motivated to study lately",
  "My parents' expectations are too much pressure",
  "I feel lonely / left out from friends",
  "I can't focus, I keep procrastinating",
];

function AIMentor() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/mentor-chat",
      fetch: async (input, init) => {
        const { data } = await supabase.auth.getSession();
        const headers = new Headers(init?.headers);
        if (data.session?.access_token) {
          headers.set("Authorization", `Bearer ${data.session.access_token}`);
        }
        return fetch(input, { ...init, headers });
      },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function submit(text: string) {
    if (!text.trim() || isLoading) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:h-screen">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-400 to-violet-500 shadow-lg">
            <HeartHandshake className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold">AI Mentor</h1>
            <p className="text-xs text-muted-foreground">
              A safe space to talk — not a replacement for a real counselor or doctor
            </p>
          </div>
        </div>
      </div>

      {/* Always-visible support banner */}
      <div className="border-b bg-rose-50 dark:bg-rose-950/20 px-6 py-2">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <PhoneCall className="h-3.5 w-3.5 shrink-0" />
          <span>
            In crisis or need to talk to a real person right now? Tele MANAS (24x7):{" "}
            <a href="tel:14416" className="font-semibold underline">
              14416
            </a>{" "}
            · iCall:{" "}
            <a href="tel:9152987821" className="font-semibold underline">
              9152987821
            </a>
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 shadow-lg">
                <HeartHandshake className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-6 text-2xl font-bold">What's on your mind?</h2>
              <p className="mt-2 text-muted-foreground">
                Talk about anything — exam stress, motivation, family, friends. I'm here to listen.
              </p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-xl border bg-card p-3 text-left text-sm transition hover:border-rose-400 hover:shadow-md"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role !== "user" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-rose-400 to-violet-500">
                    <HeartHandshake className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-gradient-to-br from-rose-400 to-violet-500 text-white shadow-md" : "bg-card border shadow-sm"}`}
                >
                  {m.parts.map((part, i) =>
                    part.type === "text" ? <ReactMarkdown key={i}>{part.text}</ReactMarkdown> : null,
                  )}
                </div>
                {m.role === "user" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Listening...
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/80 backdrop-blur p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder="Share what's on your mind..."
            rows={1}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-violet-500 text-white shadow-md disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
