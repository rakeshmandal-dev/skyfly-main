import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { GraduationCap, Send, Loader2, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/teacher")({
  component: PersonalTeacher,
  head: () => ({
    meta: [
      { title: "AI Personal Teacher — EduVault AI" },
      {
        name: "description",
        content: "Subject-wise one-on-one doubt solving with your AI personal teacher.",
      },
      { property: "og:title", content: "AI Personal Teacher — EduVault AI" },
      {
        property: "og:description",
        content: "Subject-wise one-on-one doubt solving with your AI personal teacher.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Aptitude",
];

export function chatTransport() {
  return new DefaultChatTransport({
    api: "/api/chat",
    fetch: async (input, init) => {
      const { data } = await supabase.auth.getSession();
      const headers = new Headers(init?.headers);
      if (data.session?.access_token) {
        headers.set("Authorization", `Bearer ${data.session.access_token}`);
      }
      return fetch(input, { ...init, headers });
    },
  });
}

function PersonalTeacher() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status } = useChat({ transport: chatTransport() });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading, subject]);

  async function submit(text: string) {
    if (!text.trim() || isLoading) return;
    setInput("");
    await sendMessage({
      text: `You are my personal ${subject} teacher. Teach step by step, check my understanding with a follow-up question at the end.\n\nMy doubt: ${text.trim()}`,
    });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:h-screen">
      <div className="border-b bg-card/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl brand-bg glow">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">AI Personal Teacher</h1>
              <p className="text-xs text-muted-foreground">One-on-one, subject-wise teaching</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${subject === s ? "brand-bg border-transparent text-white" : "hover:bg-accent"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="py-10 text-center">
              <h2 className="text-2xl font-bold">Ask your {subject} teacher anything</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick a subject above, then describe your doubt in your own words.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role !== "user" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg brand-bg">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "brand-bg text-white shadow-glow" : "border bg-card shadow-[var(--shadow-card)]"}`}
              >
                <div className={m.role === "user" ? "" : "prose prose-sm dark:prose-invert max-w-none"}>
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      m.role === "user" ? (
                        <span key={i} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      ) : (
                        <ReactMarkdown key={i}>{part.text}</ReactMarkdown>
                      )
                    ) : null,
                  )}
                </div>
              </div>
              {m.role === "user" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Teacher is writing...
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-card/80 p-4 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={`Ask a ${subject} doubt...`}
            rows={1}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full brand-bg text-white shadow-glow disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
