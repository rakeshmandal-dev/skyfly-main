import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LiveTeacher } from "@/components/LiveTeacher";
import { recordLearningSession } from "@/lib/learning-sessions";
import { AvatarStage } from "@/components/AvatarStage";
import { ClassroomStage } from "@/components/Classroom3D/ClassroomStage";
import { askTeacher, buildLesson } from "@/lib/lesson.functions";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/lib/languages";
import { extractPdfText } from "@/lib/pdf";
import { useSpeech } from "@/lib/speech";

export const Route = createFileRoute("/_authenticated/classroom")({
  head: () => ({
    meta: [
      { title: "AI Virtual Teacher — Learn any PDF from a 3D teacher" },
      {
        name: "description",
        content:
          "Upload a subject PDF and a lifelike 3D teacher explains it out loud in 18 Indian languages: voice teaching, topic selection, pause, repeat, simpler explanations and live Q&A.",
      },
      { property: "og:title", content: "AI Virtual Teacher — Learn any PDF from a 3D teacher" },
      {
        property: "og:description",
        content:
          "Upload a subject PDF and a lifelike 3D teacher explains it out loud, in your Indian language, with voice, gestures and Q&A.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Classroom,
});

type Topic = {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  simple: string;
  keyPoints: string[];
};
type Lesson = { title: string; subject: string; topics: Topic[] };

function Classroom() {
  const build = useServerFn(buildLesson);
  const ask = useServerFn(askTeacher);
  const speech = useSpeech();
  const [tab, setTab] = useState<"pdf" | "voice" | "3d">("pdf");

  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<"full" | "simple">("full");
  const [board, setBoard] = useState<{ heading: string; body: string } | null>(null);
  const [question, setQuestion] = useState("");
  const [nodAt, setNodAt] = useState(0);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const topic = lesson?.topics[current] ?? null;
  const context = useMemo(
    () =>
      lesson?.topics.map((t) => `${t.title}: ${t.explanation}`).join("\n\n") ?? "",
    [lesson],
  );

  // Tell the student when their language has no installed voice and we had to
  // fall back to the closest one the browser does have.
  const match = speech.voiceMatch;
  useEffect(() => {
    if (!match) return;
    const wanted = LANGUAGES.find((l) => l.code === match.code)?.name ?? match.code;
    if (match.quality === "exact" || match.quality === "language") {
      setVoiceNote(null);
      return;
    }
    const note =
      match.quality === "none" || !match.voice
        ? `Your device has no ${wanted} voice installed, so the lesson text stays in ${wanted} but is read by the default voice.`
        : `No ${wanted} voice on this device — reading with the closest available voice (${match.voice.name}). The lesson text is still in ${wanted}.`;
    setVoiceNote(note);
    toast.info(note);
  }, [match]);

  function teach(t: Topic, which: "full" | "simple") {
    setMode(which);
    const body = which === "simple" ? t.simple : t.explanation;
    setBoard({ heading: t.title, body });
    // Nod and smile once the explanation is finished.
    speech.speak(body, language.code, () => {setNodAt(Date.now());void recordLearningSession("classroom").catch(() => toast.error("Could not save session."));});
  }

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    speech.stop();
    try {
      setStatus("Reading your PDF…");
      const text = await extractPdfText(file, (p, total) =>
        setStatus(`Reading your PDF… page ${p} of ${total}`),
      );
      if (text.trim().length < 60) {
        throw new Error(
          "I couldn't find readable text in that PDF. Scanned image-only files won't work — try a text PDF.",
        );
      }
      setStatus("Preparing the lesson…");
      const result = (await build({
        data: { text, language: language.name, fileName: file.name },
      })) as Lesson;
      setLesson(result);
      setCurrent(0);
      const first = result.topics[0];
      if (first) teach(first, "full");
      setStatus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || busy) return;
    const q = question.trim();
    setQuestion("");
    setBusy(true);
    speech.stop();
    setStatus("Thinking about your question…");
    try {
      const res = (await ask({
        data: { question: q, context, language: language.name },
      })) as { answer: string };
      setBoard({ heading: q, body: res.answer });
      speech.speak(res.answer, language.code, () => setNodAt(Date.now()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't answer that right now.");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  function goto(index: number) {
    const t = lesson?.topics[index];
    if (!t) return;
    setCurrent(index);
    teach(t, mode);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              AI
            </div>
            <div>
              <h1 className="font-display text-lg leading-tight font-semibold tracking-tight">
                AI Virtual Teacher
              </h1>
              <p className="text-xs text-muted-foreground">
                Upload a PDF. Get taught, out loud, like in class.
              </p>
            </div>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="teach-language">
              Language
            </label>
            <select
              id="teach-language"
              value={language.code}
              onChange={(e) => {
                const next = LANGUAGES.find((l) => l.code === e.target.value) ?? DEFAULT_LANGUAGE;
                setLanguage(next);
                setVoiceNote(null);
                speech.stop();
              }}
              className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} — {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pt-5">
        <button
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            tab === "3d" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-secondary"
          }`}
          onClick={() => {
            speech.stop();
            setTab("3d");
          }}
        >
          ✨ 3D Virtual Classroom
        </button>
        <button
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            tab === "pdf" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-secondary"
          }`}
          onClick={() => setTab("pdf")}
        >
          📄 PDF Classroom
        </button>
        <button
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            tab === "voice" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-secondary"
          }`}
          onClick={() => {
            speech.stop();
            setTab("voice");
          }}
        >
          🎙️ Live Hindi / English Teacher
        </button>
      </div>

      {tab === "3d" ? (
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
          <ClassroomStage />
        </div>
      ) : tab === "voice" ? (
        <div className="mx-auto max-w-4xl p-4">
          <LiveTeacher />
        </div>
      ) : (
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[280px_1fr]">
          {/* Syllabus */}
          <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-sm font-semibold">Subject material</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF with selectable text, up to a few hundred pages.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {lesson ? "Upload another PDF" : "Upload subject PDF"}
            </button>
            {status && <p className="mt-3 text-xs text-accent">{status}</p>}
            {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-sm font-semibold">
              Topics {lesson ? `(${lesson.topics.length})` : ""}
            </h2>
            {!lesson && (
              <p className="mt-2 text-xs text-muted-foreground">
                Your chapter list appears here once a PDF is uploaded.
              </p>
            )}
            <ol className="mt-3 space-y-1.5">
              {lesson?.topics.map((t, i) => (
                <li key={t.id ?? i}>
                  <button
                    onClick={() => goto(i)}
                    className={`w-full rounded-xl px-3 py-2 text-start text-sm transition ${
                      i === current
                        ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="me-2 text-xs opacity-60">{i + 1}.</span>
                    {t.title}
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </aside>

        {/* Classroom */}
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border bg-[#101826] sm:h-[460px]">
              <AvatarStage
                speaking={speech.speaking && !speech.paused}
                thinking={busy}
                nodAt={nodAt}
              />
              <div className="pointer-events-none absolute start-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">
                {speech.speaking
                  ? speech.paused
                    ? "Paused"
                    : "Teaching…"
                  : busy
                    ? "Thinking…"
                    : "Ready"}
              </div>
              <div className="pointer-events-none absolute end-4 bottom-4 text-[10px] text-white/40">
                AI virtual teacher · CC0 model
              </div>
            </div>

            {/* Whiteboard */}
            <div className="flex h-[420px] flex-col rounded-2xl border border-border bg-board p-5 text-board-foreground sm:h-[460px]">
              <h2 className="font-display text-base font-semibold">
                {board?.heading ?? lesson?.title ?? "Whiteboard"}
              </h2>
              <div className="mt-3 flex-1 overflow-y-auto pe-1 text-sm leading-relaxed whitespace-pre-wrap">
                {board?.body ??
                  "Upload a subject PDF and I'll break it into topics, then teach each one out loud with examples. You can pause me any time, ask me to repeat, ask for a simpler explanation, or ask your own question."}
              </div>
              {topic?.keyPoints?.length ? (
                <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs text-board-foreground/70">
                  {topic.keyPoints.slice(0, 4).map((k, i) => (
                    <li key={i}>• {k}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
            <button
              onClick={() => (speech.paused ? speech.resume() : speech.pause())}
              disabled={!speech.speaking}
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/70 disabled:opacity-40"
            >
              {speech.paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={() => topic && teach(topic, mode)}
              disabled={!topic}
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/70 disabled:opacity-40"
            >
              Repeat
            </button>
            <button
              onClick={() => topic && teach(topic, "simple")}
              disabled={!topic}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:brightness-110 disabled:opacity-40"
            >
              Explain simply
            </button>
            <button
              onClick={speech.stop}
              disabled={!speech.speaking}
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/70 disabled:opacity-40"
            >
              Stop
            </button>
            <div className="ms-auto flex gap-2">
              <button
                onClick={() => goto(current - 1)}
                disabled={!lesson || current === 0}
                className="rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => goto(current + 1)}
                disabled={!lesson || current >= (lesson?.topics.length ?? 1) - 1}
                className="rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary disabled:opacity-40"
              >
                Next topic
              </button>
            </div>
          </div>

          {/* Q&A */}
          <form
            onSubmit={handleAsk}
            className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-3"
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                lesson ? "Raise your hand — ask anything about this lesson" : "Upload a PDF first"
              }
              disabled={!lesson || busy}
              className="min-w-[200px] flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!lesson || busy || !question.trim()}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
            >
              Ask teacher
            </button>
          </form>

          {voiceNote && (
            <p className="rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              {voiceNote}
            </p>
          )}

          {!speech.supported && (
            <p className="text-xs text-destructive">
              Your browser can't speak out loud. Try Chrome, Edge or Safari for voice teaching.
            </p>
          )}
        </section>
      </div>)}
    </main>
  );
}
