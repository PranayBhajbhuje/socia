"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowButton({ userId, initialFollowing }: { userId: string; initialFollowing: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleFollow() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/follow`, { method: "POST" });
      const result = (await response.json()) as { following?: boolean; error?: string };
      if (!response.ok || typeof result.following !== "boolean") throw new Error(result.error ?? "Could not update follow status.");
      setFollowing(result.following);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update follow status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={toggleFollow} disabled={busy} aria-pressed={following}
        className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 sm:px-4 sm:text-sm ${following ? "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
        {busy ? "Please wait…" : following ? "Following" : "Follow"}
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
