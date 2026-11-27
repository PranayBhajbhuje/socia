import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import UserAvatar from "@/components/UserAvatar";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { follow: "started following you", like: "liked your post", comment: "commented on your post", reply: "replied to your comment" };

export default async function NotificationsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const [items, users] = await Promise.all([
    db.orm.Notification.where({ userId: session.userId }).orderBy((item) => item.createdAt.desc()).all(),
    db.orm.User.all(),
  ]);
  const userById = new Map(users.map((user) => [user.id, user]));
  for (const item of items) if (!item.readAt) await db.orm.Notification.where({ id: item.id }).update({ readAt: new Date() });

  return <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black"><div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white dark:bg-neutral-950"><section className="flex-1">
    <AppHeader username={session.username} />
    <header className="border-b border-zinc-100 px-5 py-4"><h1 className="text-xl font-bold text-zinc-900">Notifications</h1><p className="mt-1 text-sm text-zinc-500">Recent activity on your account</p></header>
    {items.length === 0 ? <p className="py-16 text-center text-sm text-zinc-500">You’re all caught up.</p> : <div className="divide-y divide-zinc-100">{items.map((item) => {
      const actor = userById.get(item.actorId);
      if (!actor) return null;
      const href = item.type === "follow" ? `/profile/${encodeURIComponent(actor.username)}` : item.entityId ? `/video/${encodeURIComponent(item.entityId)}` : `/profile/${encodeURIComponent(actor.username)}`;
      return <Link key={item.id} href={href} className={`flex gap-3 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${item.readAt ? "" : "bg-blue-50/60"}`}><UserAvatar src={actor.avatarUrl} name={actor.fullName} /><span className="min-w-0 flex-1"><span className="font-semibold text-zinc-900">{actor.fullName}</span><span className="text-sm text-zinc-700"> {labels[item.type] ?? "interacted with you"}.</span><time className="mt-1 block text-xs text-zinc-500">{item.createdAt.toLocaleString()}</time></span></Link>;
    })}</div>}
  </section><BottomNav /></div></main>;
}
