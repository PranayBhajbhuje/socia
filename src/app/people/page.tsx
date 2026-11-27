import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import FollowButton from "@/components/FollowButton";
import StartConversationButton from "@/components/StartConversationButton";
import UserAvatar from "@/components/UserAvatar";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [users, follows] = await Promise.all([
    db.orm.User.all(),
    db.orm.Follow.where({ followerId: session.userId }).all(),
  ]);
  const followedIds = new Set(follows.map((follow) => follow.followingId));
  const people = users.filter((user) => user.id !== session.userId);

  return (
    <main className="flex min-h-screen justify-center bg-zinc-50">
      <div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white">
        <section className="flex-1">
          <header className="border-b border-zinc-100 px-5 py-4">
            <h1 className="text-lg font-bold text-zinc-900">Find people</h1>
            <p className="mt-1 text-sm text-zinc-500">Follow accounts to build your community.</p>
          </header>
          <div className="divide-y divide-zinc-100 px-5">
            {people.length === 0 ? <p className="py-8 text-center text-sm text-zinc-500">No other accounts yet.</p> : people.map((person) => (
              <article key={person.id} className="flex items-center justify-between gap-3 py-4">
                <Link href={`/profile/${encodeURIComponent(person.username)}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <UserAvatar src={person.avatarUrl} name={person.fullName} />
                  <span className="min-w-0"><span className="block truncate font-semibold text-zinc-900">{person.fullName}</span>
                  <span className="block truncate text-sm text-zinc-500">@{person.username}</span>
                  {person.bio && <span className="mt-1 block line-clamp-1 text-xs text-zinc-500">{person.bio}</span>}</span>
                </Link>
                <div className="flex shrink-0 gap-2"><StartConversationButton userId={person.id} /><FollowButton userId={person.id} initialFollowing={followedIds.has(person.id)} /></div>
              </article>
            ))}
          </div>
        </section>
        <BottomNav />
      </div>
    </main>
  );
}
