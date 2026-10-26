import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, Upload } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { solveImageQuestion } from "@/lib/ai-learning.functions";

export const Route = createFileRoute("/_authenticated/camera")({
  component: CameraAI,
  head: () => ({
    meta: [
      { title: "Camera AI — EduVault AI" },
      {
        name: "description",
        content: "Snap a handwritten question or textbook page and get an instant AI solution.",
      },
      { property: "og:title", content: "Camera AI — EduVault AI" },
      {
        property: "og:description",
        content: "Snap a handwritten question or textbook page and get an instant AI solution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CameraAI() {
  const solve = useServerFn(solveImageQuestion);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(file?: File) {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Please use a photo under 6 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      setAnswer(null);
    };
    reader.readAsDataURL(file);
  }

  async function run() {
    if (!preview || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await solve({ data: { imageDataUrl: preview, note } });
      setAnswer(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read the photo. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <h1 className="flex items-center gap-3 text-3xl font-bold">
        <Camera className="h-7 w-7 text-primary" /> Camera AI
      </h1>
      <p className="mt-1 text-muted-foreground">
        Take a photo of a handwritten question or a textbook page — get the solution explained.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => cameraRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full brand-bg px-4 py-2 text-sm font-semibold text-white"
            >
              <Camera className="h-4 w-4" /> Take photo
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              <Upload className="h-4 w-4" /> Upload image
            </button>
          </div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />

          {preview && (
            <img
              src={preview}
              alt="Question to solve"
              className="mt-4 max-h-80 w-full rounded-xl border object-contain"
            />
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional: what exactly do you need? e.g. 'only solve Q3'"
            className="mt-4 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />

          <button
            onClick={run}
            disabled={!preview || loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full brand-bg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Reading your photo...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Solve with AI
              </>
            )}
          </button>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          {answer ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The solution will appear here once you send a photo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
