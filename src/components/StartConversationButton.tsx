"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartConversationButton({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function start() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const result = (await response.json()) as { conversationId?: string; error?: string };
      if (!response.ok || !result.conversationId) throw new Error(result.error ?? "Could not open conversation.");
      router.push(`/messages/${encodeURIComponent(result.conversationId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open conversation.");
      setBusy(false);
    }
  }

  return <div className="text-right">
    <button type="button" onClick={start} disabled={busy} className="whitespace-nowrap rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 dark:border-blue-900 dark:bg-zinc-900 dark:text-blue-300 dark:hover:bg-zinc-800 sm:text-sm">{busy ? "Opening…" : "Message"}</button>
    {error && <p role="alert" className="mt-1 max-w-28 text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>;
}
