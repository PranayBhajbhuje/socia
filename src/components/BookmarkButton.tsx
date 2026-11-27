"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookmarkButton({ postId, initialBookmarked }: { postId: string; initialBookmarked: boolean }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/bookmark`, { method: "POST" });
      const result = (await response.json()) as { bookmarked?: boolean; error?: string };
      if (!response.ok || typeof result.bookmarked !== "boolean") throw new Error(result.error ?? "Unable to save post.");
      setBookmarked(result.bookmarked);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save post."); }
    finally { setBusy(false); }
  }
  return <span className="inline-flex flex-col items-end"><button type="button" onClick={toggle} disabled={busy} aria-pressed={bookmarked} aria-label={bookmarked ? "Remove saved post" : "Save post"} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-300">{busy ? "Saving…" : bookmarked ? "Saved" : "Save"}</button>{error && <span role="alert" className="mt-1 max-w-36 text-right text-[10px] text-red-700 dark:text-red-300">{error}</span>}</span>;
}
