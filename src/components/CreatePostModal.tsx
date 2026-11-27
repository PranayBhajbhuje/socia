"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreatePostModal({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"text" | "image" | "video">("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, mediaUrl, musicTitle }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not create post.");

      setOpen(false);
      setContent("");
      setMediaUrl("");
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
                <select value={type} onChange={(event) => setType(event.target.value as typeof type)} style={{ colorScheme: "light" }} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="text">Text</option><option value="image">Image</option><option value="video">Video</option>
                </select>
              </label>
              <label className="block text-sm font-medium">Caption
                <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="mt-1 w-full resize-y rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200" placeholder="What would you like to share?" />
              </label>
              {type !== "text" && <label className="block text-sm font-medium">Media URL
                <input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} type="url" className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200" placeholder={type === "video" ? "MP4/WebM or YouTube link" : "https://..."} />
                {type === "video" && <span className="mt-1 block text-xs font-normal text-zinc-500">YouTube links and direct MP4/WebM links play in the feed.</span>}
              </label>}
              <label className="block text-sm font-medium">Music (optional)
                <input value={musicTitle} onChange={(event) => setMusicTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200" placeholder="Track or audio credit" />
              </label>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button disabled={saving} className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Posting…" : "Share post"}</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
