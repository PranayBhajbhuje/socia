"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function PostOptionsMenu({
  postId,
  type,
  content,
  onCaptionUpdated,
}: {
  postId: string;
  type: string;
  content: string | null;
  onCaptionUpdated?: (content: string | null) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function openEditor() {
    setDraft(content ?? "");
    setError("");
    setMenuOpen(false);
    setEditing(true);
  }

  async function saveCaption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nextContent = draft.trim();
    if (type === "text" && !nextContent) {
      setError("Text posts must include some text.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent }),
      });
      const data = await response.json() as { post?: { content: string | null }; error?: string };
      if (!response.ok || !data.post) throw new Error(data.error ?? "Could not update the caption.");
      onCaptionUpdated?.(data.post.content);
      setEditing(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the caption.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (deleting || !window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not delete this post.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this post.");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="relative flex shrink-0 justify-end">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Post options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={deleting}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-semibold leading-none text-neutral-600 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <span aria-hidden="true">⋯</span>
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 top-full z-20 mt-1 min-w-36 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <button type="button" role="menuitem" onClick={openEditor} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-100 dark:hover:bg-neutral-800">
              Edit caption
            </button>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void deletePost(); }} disabled={deleting} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40">
              {deleting ? "Deleting…" : "Delete post"}
            </button>
          </div>
        )}
        {error && !editing && <p role="alert" className="absolute right-0 top-10 z-10 w-56 rounded-lg bg-white p-2 text-xs text-red-600 shadow dark:bg-neutral-900">{error}</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditing(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby={`edit-caption-title-${postId}`} className="w-full max-w-md rounded-2xl bg-white p-5 text-neutral-900 shadow-2xl dark:bg-neutral-950 dark:text-neutral-100">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 id={`edit-caption-title-${postId}`} className="text-lg font-bold">Edit caption</h2>
              <button type="button" onClick={() => setEditing(false)} disabled={saving} aria-label="Close edit caption" className="rounded-full px-3 py-1 text-xl text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800">×</button>
            </header>
            <form onSubmit={saveCaption}>
              <label htmlFor={`edit-caption-${postId}`} className="mb-1 block text-sm font-medium">Caption</label>
              <textarea id={`edit-caption-${postId}`} autoFocus rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} className="w-full resize-y rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-blue-950" placeholder="Write a caption…" />
              {error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
              <footer className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-neutral-800">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
