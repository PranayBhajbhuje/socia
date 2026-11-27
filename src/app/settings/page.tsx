import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import ThemePreference from "@/components/ThemePreference";

export const dynamic = "force-dynamic";

function SettingsIcon({ name }: { name: "profile" | "notifications" | "saved" | "language" | "help" }) {
  const paths = {
    profile: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    saved: <path d="M6 4h12v17l-6-4-6 4z" />,
    language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 4.4 1.9c-1.2 1.1-1.9 1.5-1.9 3.1M12 17.5h.01" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{paths[name]}</svg>;
}

function SettingsRow({ href, icon, children }: { href: string; icon: "profile" | "notifications" | "saved"; children: ReactNode }) {
  return <Link href={href} className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-100 dark:hover:bg-zinc-900">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"><SettingsIcon name={icon} /></span>
    <span className="min-w-0 flex-1">{children}</span>
    <span aria-hidden="true" className="text-lg text-zinc-400">›</span>
  </Link>;
}

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const user = await db.orm.User.where({ id: session.userId }).first();

  return <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
    <div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white dark:bg-neutral-950">
      <section className="flex-1">
        <header className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <Link href="/profile" className="inline-flex rounded-md text-sm text-zinc-500 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-400 dark:hover:text-white">← Profile</Link>
          <h1 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        </header>
        <div className="space-y-1 px-4 py-3">
          <SettingsRow href="/settings/edit-profile" icon="profile">Edit Profile</SettingsRow>
          <SettingsRow href="/notifications" icon="notifications">Notifications</SettingsRow>
          <SettingsRow href="/saved" icon="saved">Saved posts</SettingsRow>
          <div className="border-y border-zinc-100 py-1 dark:border-zinc-800"><ThemePreference initialTheme={user?.theme ?? "light"} /></div>
          <div className="px-3 pb-1 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Resources</p></div>
          <div className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"><SettingsIcon name="language" /></span><div><p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Language</p><p className="text-xs text-zinc-500 dark:text-zinc-400">English · currently supported</p></div></div>
          <a href="mailto:support@socia.app" className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-100 dark:hover:bg-zinc-900"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"><SettingsIcon name="help" /></span><span className="flex-1">Help &amp; Support</span><span aria-hidden="true" className="text-lg text-zinc-400">›</span></a>
          <LogoutButton appearance="row" />
        </div>
      </section>
      <BottomNav />
    </div>
  </main>;
}
