import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FolderLock, Upload, File as FileIcon, Trash2, Download, Search, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vault")({
  component: Vault,
  head: () => ({ meta: [{ title: "Vault — EduVault AI" }] }),
});

function formatSize(n?: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Vault() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents")
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("documents").insert({
          user_id: user.id,
          name: file.name,
          folder: "General",
          storage_path: path,
          mime_type: file.type,
          size_bytes: file.size,
        });
        if (dbErr) throw dbErr;
      }
      toast.success(`Uploaded ${files.length} file(s)`);
      qc.invalidateQueries({ queryKey: ["documents", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDownload(path: string, name: string) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Could not fetch file"); return; }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  }

  async function handleDelete(id: string, path: string) {
    if (!confirm("Delete this file?")) return;
    await supabase.storage.from("documents").remove([path]);
    await supabase.from("documents").delete().eq("id", id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["documents", user.id] });
  }

  const filtered = docs.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold"><FolderLock className="h-7 w-7 text-primary" /> Document Vault</h1>
          <p className="mt-1 text-muted-foreground">Your private, encrypted study library.</p>
        </div>
        <button onClick={() => fileInput.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full brand-bg px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:opacity-90 disabled:opacity-60">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload files
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-[var(--shadow-card)]">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files..." className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FolderLock className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No documents yet. Upload your first note!</p>
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((d) => (
              <li key={d.id} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg aurora-bg text-white">
                  <FileIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.folder} · {formatSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => handleDownload(d.storage_path, d.name)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Download className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(d.id, d.storage_path)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
