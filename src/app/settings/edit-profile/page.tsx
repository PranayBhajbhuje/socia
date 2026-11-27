import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import EditProfileForm from "@/components/EditProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const user = await db.orm.User.where({ id: session.userId }).first();
  if (!user) redirect("/login");

  return <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
    <div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white dark:bg-neutral-950">
      <section className="flex-1">
        <header className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <Link href="/settings" className="inline-flex rounded-md text-sm text-zinc-500 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-400 dark:hover:text-white">← Settings</Link>
          <h1 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">Edit Profile</h1>
        </header>
        <EditProfileForm profile={{ fullName: user.fullName, username: user.username, bio: user.bio, websiteUrl: user.websiteUrl, avatarUrl: user.avatarUrl }} />
      </section>
      <BottomNav />
    </div>
  </main>;
}
