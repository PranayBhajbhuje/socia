"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function respond(action: "accept" | "decline") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/follow-requests/${encodeURIComponent(requestId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not update follow request.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update follow request.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-3 flex flex-wrap items-center gap-2">
    <button type="button" onClick={() => void respond("accept")} disabled={busy} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60">
      {busy ? "Please wait…" : "Accept"}
    </button>
    <button type="button" onClick={() => void respond("decline")} disabled={busy} className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
      Decline
    </button>
    {error && <p role="alert" className="basis-full text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>;
}
