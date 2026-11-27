"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePostButton({ postId, type }: { postId: string; type: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  async function deletePost() {
    if (deleting || !window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not delete this post.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this post.");
      setDeleting(false);
    }
  }

  return (
    <div className="relative flex justify-end">
      <button type="button" onClick={() => setMenuOpen((open) => !open)} disabled={deleting} aria-label="Post options" aria-haspopup="menu" aria-expanded={menuOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-semibold leading-none text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
        <span aria-hidden="true">⋯</span>
      </button>
      {menuOpen && <div role="menu" className="absolute right-0 top-full z-20 mt-1 min-w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void deletePost(); }} disabled={deleting} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40">
          {deleting ? "Deleting…" : `Delete ${type}`}
        </button>
      </div>}
      {error && <p role="alert" className="absolute right-0 top-10 z-10 rounded-lg bg-white p-2 text-xs text-red-600 shadow dark:bg-zinc-900">{error}</p>}
    </div>
  );
}
