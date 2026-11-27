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
  const relationships = await db.orm.Follow.where(type === "following" ? { followerId: profile.id, status: "accepted" } : { followingId: profile.id, status: "accepted" }).all();
  const otherIds = relationships.map((relationship) => type === "following" ? relationship.followingId : relationship.followerId);
  const [allUsers, myFollowing] = await Promise.all([
    db.orm.User.all(),
    db.orm.Follow.where({ followerId: session.userId }).all(),
  ]);
  const otherUsers = new Map(allUsers.filter((user) => otherIds.includes(user.id)).map((user) => [user.id, user]));
  const followedIds = new Set(myFollowing.filter((relationship) => relationship.status === "accepted").map((relationship) => relationship.followingId));
  const requestedIds = new Set(myFollowing.filter((relationship) => relationship.status === "pending").map((relationship) => relationship.followingId));
  const people = otherIds.flatMap((id) => {
    const person = otherUsers.get(id);
    return person && person.id !== session.userId
      ? [{ id: person.id, fullName: person.fullName, username: person.username, avatarUrl: person.avatarUrl }]
      : [];
  });

  return (
    <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
      <div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white dark:bg-neutral-950">
        <section className="flex-1">
          <FollowListClient people={people} profileId={profile.id} profileUsername={profile.username} currentUserId={session.userId} initiallyFollowed={[...followedIds]} initiallyRequested={[...requestedIds]} type={type} count={relationships.length} canRemove={type === "followers" && profile.id === session.userId} />
        </section>
        <BottomNav />
      </div>
    </main>
  );
}
