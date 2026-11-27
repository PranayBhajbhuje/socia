"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreatePostModal } from "@/components/CreatePostModal";
import LogoutButton from "@/components/LogoutButton";

function HeaderIcon({ name }: { name: "notifications" | "inbox" }) {
  return name === "notifications" ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 5h16v12h-5l-3 3-3-3H4z" /><path d="M8 10h8M8 13h5" /></svg>
  );
}

export default function AppHeader({ username, postCount }: { username: string; postCount?: number }) {
  const pathname = usePathname();
  const linkClass = (active: boolean) => `flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? "bg-zinc-100 text-zinc-950 dark:bg-blue-950/70 dark:text-blue-200" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"}`;

  return <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-neutral-950 sm:px-5">
    <Link href="/" className="min-w-0 shrink text-zinc-900 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-100">
      <span className="block text-xl font-bold leading-tight">Socia</span>
      <span className="block max-w-[120px] truncate text-xs leading-5 text-zinc-500 dark:text-zinc-400">{postCount === undefined ? `@${username}` : `${postCount} posts · @${username}`}</span>
    </Link>
    <nav aria-label="Main actions" className="flex shrink-0 items-center gap-1">
      <Link href="/notifications" aria-label="Notifications" title="Notifications" aria-current={pathname === "/notifications" ? "page" : undefined} className={linkClass(pathname === "/notifications")}><HeaderIcon name="notifications" /></Link>
      <Link href="/messages" aria-label="Inbox" title="Inbox" aria-current={pathname.startsWith("/messages") ? "page" : undefined} className={linkClass(pathname.startsWith("/messages"))}><HeaderIcon name="inbox" /></Link>
      <CreatePostModal />
      <LogoutButton />
    </nav>
  </header>;
}
