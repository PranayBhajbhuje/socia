"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ThemePreference({ initialTheme }: { initialTheme: string }) {
  const [theme, setTheme] = useState(initialTheme === "dark" ? "dark" : "light");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function change(value: string) {
    if (busy || value === theme) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: value }) });
      const result = await response.json() as { theme?: string; error?: string };
      if (!response.ok || !result.theme) throw new Error(result.error ?? "Could not update theme.");
      setTheme(result.theme);
      localStorage.setItem("socia-theme", result.theme);
      document.documentElement.classList.toggle("dark", result.theme === "dark");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update theme.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="py-1">
    <label className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5z" /></svg></span>
      <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">Dark Mode</span>
      <select aria-label="Color theme" value={theme} disabled={busy} onChange={(event) => void change(event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"><option value="light">Light</option><option value="dark">Dark</option></select>
    </label>
    {busy && <p role="status" className="px-3 pt-1 text-xs text-zinc-500 dark:text-zinc-400">Saving theme…</p>}
    {error && <p role="alert" className="px-3 pt-1 text-xs text-red-700 dark:text-red-300">{error}</p>}
  </div>;
}
