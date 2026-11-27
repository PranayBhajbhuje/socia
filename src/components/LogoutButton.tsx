"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ appearance = "button" }: { appearance?: "button" | "row" }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const className = appearance === "row"
    ? "flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-100 dark:hover:bg-zinc-900"
    : "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-zinc-400 bg-white px-3 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-400 dark:hover:bg-zinc-800";

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
    >
      {appearance === "row" ? <><span className="flex-1">Sign Out</span><span aria-hidden="true" className="text-lg text-zinc-400">›</span></> : "Sign Out"}
    </button>
  );
}
