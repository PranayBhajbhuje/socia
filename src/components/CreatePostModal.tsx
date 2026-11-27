"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import VideoMedia from "@/components/VideoMedia";

export function CreatePostModal({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"text" | "image" | "video">("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [musicTitle, setMusicTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const mediaPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (mediaPreviewRef.current) URL.revokeObjectURL(mediaPreviewRef.current);
    };
  }, []);

  function setMediaPreviewForFile(file: File | null) {
    if (mediaPreviewRef.current) URL.revokeObjectURL(mediaPreviewRef.current);
    mediaPreviewRef.current = file ? URL.createObjectURL(file) : null;
    setMediaPreview(mediaPreviewRef.current);
  }

  function chooseMediaFile(file: File | null) {
    if (!file) return;
    const maxBytes = type === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size === 0) {
      setError("Selected file is empty.");
      setMediaFile(null);
      setMediaPreviewForFile(null);
      return;
    }
    if (file.size > maxBytes) {
      setError(type === "image" ? "Images must be smaller than 10 MB." : "Videos must be smaller than 50 MB.");
      setMediaFile(null);
      setMediaPreviewForFile(null);
      return;
    }
    setError("");
    setMediaUrl("");
    setMediaFile(file);
    setMediaPreviewForFile(file);
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      let response: Response;
      if (mediaFile) {
        const form = new FormData();
        form.set("type", type);
        form.set("content", content);
        form.set("mediaUrl", "");
        form.set("musicTitle", musicTitle);
        form.set("mediaFile", mediaFile);
        response = await fetch("/api/posts", { method: "POST", body: form });
      } else {
        response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, content, mediaUrl, musicTitle }),
        });
      }
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not create post.");

      setOpen(false);
      setContent("");
      setMediaUrl("");
      setMediaFile(null);
      setMediaPreviewForFile(null);
      setMusicTitle("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Create post" className={compact ? "flex h-9 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-lg font-bold text-white hover:bg-zinc-800" : "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-zinc-900 px-3 text-xs font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"}>
        {compact ? "+" : "+ New Post"}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="create-post-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 text-zinc-900 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="create-post-title" className="text-lg font-bold">Create a post</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full px-2 py-1 text-zinc-500 hover:bg-zinc-100">✕</button>
            </div>
            <form onSubmit={submitPost} className="space-y-3">
              <label className="block text-sm font-medium">Post type
                <select value={type} onChange={(event) => { setType(event.target.value as typeof type); setMediaFile(null); setMediaPreviewForFile(null); setError(""); }} style={{ colorScheme: "light" }} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="text">Text</option><option value="image">Image</option><option value="video">Video</option>
                </select>
              </label>
              <label className="block text-sm font-medium">Caption
                <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="mt-1 w-full resize-y rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200" placeholder="What would you like to share?" />
              </label>
              {type !== "text" && <div className="space-y-3">
                <p className="text-sm font-medium">Add a {type}</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`cursor-pointer rounded-lg border border-zinc-300 px-3 py-2.5 text-center text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-blue-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 ${mediaUrl.trim() ? "pointer-events-none opacity-50" : ""}`}>
                    Choose from device
                    <input
                      key={`${type}-library`}
                      type="file"
                      accept={type === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm"}
                      disabled={Boolean(mediaUrl.trim())}
                      onChange={(event) => { chooseMediaFile(event.target.files?.[0] ?? null); event.target.value = ""; }}
                      className="sr-only"
                    />
                  </label>
                  <label className={`cursor-pointer rounded-lg border border-zinc-300 px-3 py-2.5 text-center text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-within:ring-2 focus-within:ring-blue-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 ${mediaUrl.trim() ? "pointer-events-none opacity-50" : ""}`}>
                    Use camera
                    <input
                      key={`${type}-camera`}
                      type="file"
                      accept={type === "image" ? "image/*" : "video/*"}
                      capture="environment"
                      disabled={Boolean(mediaUrl.trim())}
                      onChange={(event) => { chooseMediaFile(event.target.files?.[0] ?? null); event.target.value = ""; }}
                      className="sr-only"
                    />
                  </label>
                </div>
                {mediaFile && <div className="space-y-2 rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
                  {mediaPreview && (type === "image" ? <img src={mediaPreview} alt="Selected post media preview" className="max-h-56 w-full rounded-lg object-contain" /> : <VideoMedia src={mediaPreview} title="Selected video preview" className="max-h-56 w-full rounded-lg bg-black object-contain" />)}
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs text-zinc-500">{mediaFile.name} · {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    <button type="button" onClick={() => { setMediaFile(null); setMediaPreviewForFile(null); }} className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">Remove</button>
                  </div>
                </div>}
                <label className="block text-sm font-medium">Or use a media URL
                  <input
                    value={mediaUrl}
                    onChange={(event) => setMediaUrl(event.target.value)}
                    type="url"
                    disabled={Boolean(mediaFile)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
                    placeholder={type === "video" ? "MP4/WebM or YouTube link" : "https://..."}
                  />
                  {type === "video" && <span className="mt-1 block text-xs font-normal text-zinc-500">Uploaded videos are converted to browser-compatible MP4 with sound. Direct links and YouTube are unchanged. Uploads are local; Vercel needs cloud media storage.</span>}
                </label>
              </div>}
              <label className="block text-sm font-medium">Music (optional)
                <input value={musicTitle} onChange={(event) => setMusicTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200" placeholder="Track or audio credit" />
              </label>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button disabled={saving} className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? mediaFile ? "Uploading…" : "Posting…" : "Share post"}</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
