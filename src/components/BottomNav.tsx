"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CreatePostModal } from "@/components/CreatePostModal";

function NavIcon({ name }: { name: "home" | "video" | "inbox" | "people" | "profile" }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>,
    video: <><path d="M12 3 21 8v8l-9 5-9-5V8z" /><path d="m10 9 5 3-5 3z" /></>,
    inbox: <><path d="M4 5h16v12h-5l-3 3-3-3H4z" /><path d="M8 10h8M8 13h5" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1zM16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1h-4" /></>,
    profile: <><circle cx="12" cy="8" r="3" /><circle cx="12" cy="12" r="9" /><path d="M5.5 19a7 7 0 0 1 13 0" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{paths[name]}</svg>;
}

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const videoActive = pathname === "/" && searchParams.get("tab") === "video";
  const homeActive = pathname === "/" && !videoActive;
  const profileActive = pathname === "/profile" || pathname.startsWith("/profile/") || pathname === "/settings" || pathname.startsWith("/settings/") || pathname === "/saved";

  const itemClass = (active: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-xs ${
      active ? "font-semibold text-zinc-950 dark:text-white" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
    }`;

  return (
    <nav aria-label="Primary" className="sticky bottom-0 z-20 flex w-full max-w-md items-center justify-around border-t border-zinc-200 bg-white px-2 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-neutral-950">
      <Link href="/" aria-current={homeActive ? "page" : undefined} className={itemClass(homeActive)}>
        <NavIcon name="home" />
        <span>Home</span>
      </Link>

      <Link href="/?tab=video" aria-current={videoActive ? "page" : undefined} className={itemClass(videoActive)}>
        <NavIcon name="video" />
        <span>Video</span>
      </Link>

      <CreatePostModal compact />

      <Link href="/messages" aria-current={pathname.startsWith("/messages") ? "page" : undefined} className={itemClass(pathname.startsWith("/messages"))}>
        <NavIcon name="inbox" />
        <span>Inbox</span>
      </Link>

      <Link href="/people" aria-current={pathname === "/people" ? "page" : undefined} className={itemClass(pathname === "/people")}>
        <NavIcon name="people" />
        <span>People</span>
      </Link>

      <Link href="/profile" aria-current={profileActive ? "page" : undefined} className={itemClass(profileActive)}>
        <NavIcon name="profile" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
