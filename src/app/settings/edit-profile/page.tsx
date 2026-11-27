import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import EditProfileForm from "@/components/EditProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const user = await db.orm.User.where({ id: session.userId }).first();
  if (!user) redirect("/login");

  return <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
    <div className="min-h-screen w-full max-w-md bg-white dark:bg-neutral-950">
      <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center bg-white/95 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur dark:bg-neutral-950/95">
        <Link href="/settings" className="inline-flex w-fit items-center gap-2 rounded-md py-2 text-base text-zinc-800 transition hover:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-100 dark:hover:text-zinc-300">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m15 18-6-6 6-6" /></svg>
          Back
        </Link>
        <h1 className="text-center text-xl font-medium text-zinc-900 dark:text-zinc-100">Edit Profile</h1>
        <span aria-hidden="true" />
      </header>
      <EditProfileForm profile={{ fullName: user.fullName, username: user.username, bio: user.bio, websiteUrl: user.websiteUrl, avatarUrl: user.avatarUrl }} />
    </div>
  </main>;
}
