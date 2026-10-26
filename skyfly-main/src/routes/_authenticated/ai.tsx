import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send, Loader2, User as UserIcon, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useSpeech } from "@/lib/speech";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AIAssistant,
  head: () => ({ meta: [{ title: "AI Assistant — EduVault AI" }] }),
});

const SUGGESTIONS = [
  "Explain Newton's laws with real-life examples",
  "Give me 5 JEE Physics tips for rotational motion",
  "Review my resume — I'll paste it below",
  "Create a 7-day study plan for NEET Biology",
  "Write Python code for binary search with comments",
];

function AIAssistant() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
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
      <header className="border-b bg-card/80 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl brand-bg glow" aria-hidden="true">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">EduVault AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Your 24/7 accessible study companion</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Chat messages history"
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl brand-bg glow" aria-hidden="true">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-foreground">How can I help you learn today?</h2>
              <p className="mt-2 text-muted-foreground">Ask anything — from Class 6 math to JEE Advanced.</p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-2 sm:grid-cols-2" role="group" aria-label="Suggested starter questions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-xl border bg-card p-3 text-left text-sm transition hover:border-primary hover:shadow-[var(--shadow-card)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
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
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg brand-bg" aria-hidden="true">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-primary ${m.role === "user" ? "brand-bg text-white shadow-glow" : "bg-card border shadow-[var(--shadow-card)]"}`}>
                  <div className={m.role === "user" ? "" : "prose prose-sm dark:prose-invert max-w-none"}>
                    {m.parts.map((part, i) =>
                      part.type === "text" ? (
                        m.role === "user" ? (
                          <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                        ) : (
                          <div key={i}>
                            <ReactMarkdown>{part.text}</ReactMarkdown>
                            <div className="mt-2 flex items-center gap-2 pt-1 border-t border-border/40">
                              <button
                                onClick={() => speech.speak(part.text, "en-IN")}
                                aria-label="Read AI answer aloud"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                <Volume2 className="h-3 w-3" aria-hidden="true" />
                                <span>Read Aloud</span>
                              </button>
                            </div>
                          </div>
                        )
                      ) : null,
                    )}
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted" aria-hidden="true">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Thinking...
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
          aria-label="Send message to AI assistant"
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <label htmlFor="ai-chat-input" className="sr-only">Ask AI Assistant a question</label>
          <textarea
            id="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder="Ask anything (Press Enter to send)..."
            rows={1}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none ring-ring focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send question to AI"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full brand-bg text-white shadow-glow disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIAssistant;
