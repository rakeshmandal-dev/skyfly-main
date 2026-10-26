import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  Upload,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Languages,
  ShieldAlert,
  ArrowRight,
  Mic,
  MicOff,
} from "lucide-react";
import { toast } from "sonner";
import { useSpeech } from "@/lib/speech";
import { extractPdfText } from "@/lib/pdf";
import { extractTextFromImage, explainStudyDocument } from "@/lib/ai-learning.functions";
import { useAccessibility } from "@/lib/accessibility";

export const Route = createFileRoute("/_authenticated/study-reader")({
  component: AccessibleStudyReader,
  head: () => ({
    meta: [
      { title: "Accessible Study Reader & OCR — EduVault AI" },
      {
        name: "description",
        content: "Listen to textbooks, notes, and uploaded PDFs or photos with voice-guided AI explanations.",
      },
    ],
  }),
});

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const SAMPLE_TEXT = `Newton's Laws of Motion:
1. First Law (Inertia): An object remains at rest or in uniform motion unless acted upon by an external net force.
2. Second Law (Force and Acceleration): The acceleration of an object is directly proportional to the net force acting upon it and inversely proportional to its mass. Mathematically expressed as Force equals mass times acceleration (F = m * a).
3. Third Law (Action and Reaction): For every action, there is an equal and opposite reaction.

Key Application:
When a rocket expels burning gases downwards, the reaction force propels the rocket upwards into space.`;

export function AccessibleStudyReader() {
  const { announce } = useAccessibility();
  const speech = useSpeech();
  const runOcr = useServerFn(extractTextFromImage);
  const askCoach = useServerFn(explainStudyDocument);

  const [documentTitle, setDocumentTitle] = useState("Physics — Newton's Laws Summary");
  const [documentText, setDocumentText] = useState(SAMPLE_TEXT);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coachResponse, setCoachResponse] = useState<string | null>(null);
  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [doubtQuestion, setDoubtQuestion] = useState("");
  const [language, setLanguage] = useState<"en-IN" | "hi-IN">("en-IN");
  const [voiceRate, setVoiceRate] = useState<number>(0.95);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setCoachResponse(null);
      speech.stop();

      // 1. File Size Validation (10MB limit)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const err = `File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB. The maximum permitted file size is 10MB.`;
        setErrorMessage(err);
        announce(err, "assertive");
        return;
      }

      // 2. File Type Validation
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isText =
        file.type === "text/plain" ||
        file.type === "text/markdown" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md");
      const isImage = file.type.startsWith("image/");

      if (!isPdf && !isText && !isImage) {
        const err = "Unsupported file format. Please upload a PDF, text file (.txt, .md), or photo (.png, .jpg, .webp).";
        setErrorMessage(err);
        announce(err, "assertive");
        return;
      }

      setIsProcessingFile(true);
      setDocumentTitle(file.name);
      announce(`Processing ${file.name}. Please wait...`, "polite");

      try {
        if (isText) {
          const text = await file.text();
          if (!text.trim()) {
            throw new Error("The uploaded text file is completely empty.");
          }
          setDocumentText(text.trim());
          announce(`Text extracted successfully from ${file.name}. Ready to read.`);
          toast.success("Document loaded successfully.");
        } else if (isPdf) {
          setFileProgress("Reading PDF pages...");
          const extracted = await extractPdfText(file, (page, total) => {
            setFileProgress(`Processing page ${page} of ${total}...`);
          });
          if (!extracted.trim()) {
            throw new Error(
              "No readable text could be found in this PDF. It may contain scanned image pages without OCR or be password-protected."
            );
          }
          setDocumentText(extracted.trim());
          announce(`PDF parsed successfully. Extracted ${extracted.split(/\s+/).length} words.`);
          toast.success("PDF extracted successfully.");
        } else if (isImage) {
          setFileProgress("Running accessible OCR on image...");
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read image file."));
          });
          reader.readAsDataURL(file);
          const dataUrl = await base64Promise;

          const res = await runOcr({ data: { imageDataUrl: dataUrl } });
          if (!res?.extractedText) {
            throw new Error("Unable to extract legible text from this image.");
          }
          setDocumentText(res.extractedText);
          announce("OCR completed. Notes transcribed from photo.");
          toast.success("Photo notes extracted successfully.");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to process file.";
        setErrorMessage(msg);
        announce(`File error: ${msg}`, "assertive");
        toast.error(msg);
      } finally {
        setIsProcessingFile(false);
        setFileProgress("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [announce, runOcr, speech]
  );

  const handleListenDocument = () => {
    if (!documentText.trim()) return;
    announce("Reading document aloud.");
    speech.speak(documentText, language);
  };

  const handleAskCoach = async (mode: "simple" | "summary" | "quiz" | "qa") => {
    if (!documentText.trim() || isCoachThinking) return;
    setIsCoachThinking(true);
    setErrorMessage(null);
    speech.stop();

    const modeLabels: Record<string, string> = {
      simple: "simplifying into beginner-friendly explanations",
      summary: "summarizing key concepts",
      quiz: "generating practice revision questions",
      qa: "answering your doubt",
    };
    announce(`AI Study Coach is ${modeLabels[mode]}...`, "polite");

    try {
      const res = await askCoach({
        data: {
          documentText: documentText.slice(0, 10000),
          mode,
          question: mode === "qa" ? doubtQuestion.trim() : undefined,
          language: language === "hi-IN" ? "Hindi (Devanagari)" : "English",
        },
      });
      setCoachResponse(res.text);
      announce(`Study Coach response ready.`);
      // Read aloud the coach's explanation automatically for audio learners
      speech.speak(res.text, language);
      if (mode === "qa") setDoubtQuestion("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not generate explanation.";
      setErrorMessage(msg);
      announce(`Coach error: ${msg}`, "assertive");
      toast.error(msg);
    } finally {
      setIsCoachThinking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Header */}
      <header className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            <BookOpen className="h-7 w-7 text-primary" aria-hidden="true" />
            <span>Accessible Study Reader & OCR</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextLang = language === "en-IN" ? "hi-IN" : "en-IN";
                setLanguage(nextLang);
                speech.stop();
                announce(`Speech voice switched to ${nextLang === "hi-IN" ? "Hindi" : "English"}`);
              }}
              aria-label={`Toggle language: currently ${language === "en-IN" ? "English" : "Hindi"}`}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Languages className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{language === "en-IN" ? "English Voice" : "हिन्दी आवाज़"}</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload PDF chapters, notes, or photos of whiteboards. Read, listen aloud, and receive spoken explanations from your AI Study Coach.
        </p>
      </header>

      {/* Security & Validation Policy Alert */}
      <div
        role="region"
        aria-label="Upload rules and security safeguards"
        className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground"
      >
        <ShieldAlert className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <p>
            <strong className="text-foreground">Secure Document Handling:</strong> Allowed formats: PDF, Text (.txt, .md), and Images (.png, .jpg, .webp) up to 10MB. Files are parsed securely in-memory and are never stored publicly.
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            <em>Educational Disclaimer:</em> AI explanations provide study guidance. Always confirm official exam syllabus definitions with course authorities.
          </p>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold underline hover:no-underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Zone & Controls */}
      <section
        aria-label="Document upload and loading controls"
        className="rounded-2xl border border-border bg-card p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Upload or Select Study Material</h2>
            <p className="text-xs text-muted-foreground">Supported: PDFs, Text Notes, Photos of textbooks (Max 10MB)</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.txt,.md,image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="sr-only"
              id="study-file-input"
            />
            <label
              htmlFor="study-file-input"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className="inline-flex items-center gap-2 cursor-pointer rounded-xl brand-bg px-4 py-2 text-xs font-semibold text-white shadow-glow hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition"
            >
              {isProcessingFile ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isProcessingFile ? "Extracting..." : "Upload Document"}</span>
            </label>

            <button
              onClick={() => {
                setDocumentTitle("Physics — Newton's Laws Summary");
                setDocumentText(SAMPLE_TEXT);
                setErrorMessage(null);
                setCoachResponse(null);
                announce("Loaded sample physics document.");
              }}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
            >
              Load Sample Text
            </button>
          </div>
        </div>

        {fileProgress && (
          <div className="flex items-center gap-2 text-xs text-primary font-medium" aria-live="polite">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>{fileProgress}</span>
          </div>
        )}
      </section>

      {/* Main Reader Viewport */}
      <section
        aria-label="Active document reading view"
        className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Active Document</span>
            <h2 className="text-base font-bold text-foreground truncate max-w-md">{documentTitle}</h2>
          </div>

          {/* Audio Read-Aloud Toolbar */}
          <div
            role="toolbar"
            aria-label="Audio read-aloud controls"
            className="flex flex-wrap items-center gap-2"
          >
            {!speech.speaking && (
              <button
                onClick={handleListenDocument}
                disabled={!documentText.trim()}
                aria-label="Read document aloud"
                className="flex items-center gap-1.5 rounded-xl brand-bg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Listen Aloud</span>
              </button>
            )}

            {speech.speaking && !speech.paused && (
              <button
                onClick={() => {
                  speech.pause();
                  announce("Audio reading paused.");
                }}
                aria-label="Pause audio reading"
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Pause className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Pause</span>
              </button>
            )}

            {speech.speaking && speech.paused && (
              <button
                onClick={() => {
                  speech.resume();
                  announce("Audio reading resumed.");
                }}
                aria-label="Resume audio reading"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Resume</span>
              </button>
            )}

            {speech.speaking && (
              <button
                onClick={() => {
                  speech.stop();
                  announce("Audio reading stopped.");
                }}
                aria-label="Stop audio reading"
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Square className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* Editable / Accessible Text Container */}
        <div>
          <label htmlFor="document-content-area" className="sr-only">
            Extracted document text content
          </label>
          <textarea
            id="document-content-area"
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            rows={10}
            className="w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm text-foreground leading-relaxed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            placeholder="Document content will appear here after uploading or typing..."
          />
        </div>
      </section>

      {/* AI Personal Study Coach Integration */}
      <section
        aria-label="AI Study Coach actions and revision tools"
        className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-bold text-foreground">AI Study Coach</h2>
        </div>

        {/* Quick Action Prompt Buttons */}
        <div
          role="group"
          aria-label="Study assistance options"
          className="grid gap-2.5 sm:grid-cols-3"
        >
          <button
            onClick={() => handleAskCoach("simple")}
            disabled={isCoachThinking || !documentText.trim()}
            className="flex flex-col items-start rounded-2xl border border-border bg-background/60 p-3.5 text-left transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            <span className="text-xs font-bold text-foreground">🌱 Explain in Simple Terms</span>
            <span className="mt-1 text-[11px] text-muted-foreground">Break down into plain, intuitive concepts for easy listening</span>
          </button>

          <button
            onClick={() => handleAskCoach("summary")}
            disabled={isCoachThinking || !documentText.trim()}
            className="flex flex-col items-start rounded-2xl border border-border bg-background/60 p-3.5 text-left transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            <span className="text-xs font-bold text-foreground">📝 Key Summary & Formulas</span>
            <span className="mt-1 text-[11px] text-muted-foreground">Generate quick audio revision notes and bullet points</span>
          </button>

          <button
            onClick={() => handleAskCoach("quiz")}
            disabled={isCoachThinking || !documentText.trim()}
            className="flex flex-col items-start rounded-2xl border border-border bg-background/60 p-3.5 text-left transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            <span className="text-xs font-bold text-foreground">🎯 Quiz & Revision Questions</span>
            <span className="mt-1 text-[11px] text-muted-foreground">Test your understanding with spoken practice questions</span>
          </button>
        </div>

        {/* Ask a Specific Question Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (doubtQuestion.trim()) handleAskCoach("qa");
          }}
          aria-label="Ask a doubt about this document"
          className="flex flex-col sm:flex-row items-end gap-2.5 pt-2"
        >
          <div className="flex-1 w-full space-y-1">
            <label htmlFor="study-doubt-input" className="text-xs font-semibold text-muted-foreground">
              Ask your personal coach about this document:
            </label>
            <input
              id="study-doubt-input"
              value={doubtQuestion}
              onChange={(e) => setDoubtQuestion(e.target.value)}
              placeholder="e.g. Why does mass affect acceleration according to the second law?"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!doubtQuestion.trim() || isCoachThinking || !documentText.trim()}
            className="h-10 rounded-xl brand-bg px-5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary transition"
          >
            {isCoachThinking ? "Thinking..." : "Ask Coach"}
          </button>
        </form>

        {/* Coach Explanation View */}
        {coachResponse && (
          <article
            aria-label="AI Study Coach explanation"
            role="region"
            aria-live="polite"
            className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Coach Explanation</span>
              </div>
              <button
                onClick={() => speech.speak(coachResponse, language)}
                aria-label="Listen to explanation aloud"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Listen to answer</span>
              </button>
            </div>
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {coachResponse}
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

export default AccessibleStudyReader;
