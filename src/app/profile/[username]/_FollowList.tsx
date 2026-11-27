import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import FollowListClient from "@/components/FollowListClient";

export default async function FollowList({ username, type }: { username: string; type: "following" | "followers" }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const profile = await db.orm.User.where({ username }).first();
  if (!profile) redirect("/people");
  const relationships = await db.orm.Follow.where(type === "following" ? { followerId: profile.id } : { followingId: profile.id }).all();
  const otherIds = relationships.map((relationship) => type === "following" ? relationship.followingId : relationship.followerId);
  const [allUsers, myFollowing] = await Promise.all([
    db.orm.User.all(),
    db.orm.Follow.where({ followerId: session.userId }).all(),
  ]);
  const otherUsers = new Map(allUsers.filter((user) => otherIds.includes(user.id)).map((user) => [user.id, user]));
  const followedIds = new Set(myFollowing.map((relationship) => relationship.followingId));
  const people = otherIds.map((id) => otherUsers.get(id)).filter((person) => person && person.id !== session.userId);

  return (
    <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
      <div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white dark:bg-neutral-950">
        <section className="flex-1">
          <header className="relative flex items-center justify-center border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <Link href={`/profile/${encodeURIComponent(profile.username)}`} aria-label="Back to profile" className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800">←</Link>
            <div className="text-center">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{type === "following" ? "Following" : "Followers"}</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">@{profile.username} · {relationships.length}</p>
            </div>
          </header>
          <FollowListClient people={people.filter((person): person is NonNullable<typeof person> => Boolean(person))} profileId={profile.id} currentUserId={session.userId} initiallyFollowed={[...followedIds]} type={type} canRemove={type === "followers" && profile.id === session.userId} />
        </section>
        <BottomNav />
      </div>
    </main>
  );
}
