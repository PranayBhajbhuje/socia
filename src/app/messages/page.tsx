import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import SettingsLink from "@/components/SettingsLink";
import UserAvatar from "@/components/UserAvatar";
import { getMessagePreview } from "@/lib/shared-post-message";

export const dynamic = "force-dynamic";

function formatMessageTime(value: Date) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - value.getTime()) / 60_000));
  if (elapsedMinutes < 1) return "now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const hours = Math.floor(elapsedMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return value.toLocaleDateString();
}

export default async function MessagesPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const [conversations, users] = await Promise.all([db.orm.Conversation.all(), db.orm.User.all()]);
  const userById = new Map(users.map((user) => [user.id, user]));
  const mine = conversations.filter((conversation) => conversation.userOneId === session.userId || conversation.userTwoId === session.userId);
  const rows = await Promise.all(mine.map(async (conversation) => {
    const otherId = conversation.userOneId === session.userId ? conversation.userTwoId : conversation.userOneId;
    const other = userById.get(otherId);
    if (!other) return null;
    const messages = await db.orm.Message.where({ conversationId: conversation.id }).orderBy((message) => message.createdAt.desc()).all();
    const last = messages[0];
    const unread = messages.some((message) => message.senderId !== session.userId && !message.readAt);
    return { conversation, other, last, unread };
  }));
  const sorted = rows.filter((row) => row !== null).sort((a, b) => (b.last?.createdAt.getTime() ?? b.conversation.updatedAt.getTime()) - (a.last?.createdAt.getTime() ?? a.conversation.updatedAt.getTime()));

  return (
    <main className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
      <div className="flex min-h-screen w-full max-w-md flex-col justify-between bg-white dark:bg-neutral-950">
        <section className="flex-1">
          <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <div><h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Messages</h1><p className="text-xs text-zinc-500 dark:text-zinc-400">Your conversations</p></div>
            <SettingsLink />
          </header>
          {sorted.length === 0 ? (
            <div className="px-6 py-20 text-center"><div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">✉</div><h2 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">No messages yet</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Visit People or a profile and tap Message to start chatting.</p><Link href="/people" className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-zinc-100 dark:text-zinc-900">Find people</Link></div>
          ) : <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{sorted.map((row) => row && (
            <Link key={row.conversation.id} href={`/messages/${encodeURIComponent(row.conversation.id)}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-zinc-900">
              <UserAvatar src={row.other.avatarUrl} name={row.other.fullName} sizeClass="h-12 w-12" />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{row.other.fullName}</p><p className={`truncate text-sm ${row.unread ? "font-medium text-zinc-800 dark:text-zinc-200" : "text-zinc-500 dark:text-zinc-400"}`}>{row.last ? `${row.last.senderId === session.userId ? "You: " : ""}${getMessagePreview(row.last.body)}` : "Start a conversation"}</p></div>
              <div className="flex shrink-0 flex-col items-end gap-2">{row.last && <time dateTime={row.last.createdAt.toISOString()} className="text-[10px] text-zinc-500 dark:text-zinc-400">{formatMessageTime(row.last.createdAt)}</time>}{row.unread && <span aria-label="Unread messages" className="h-2.5 w-2.5 rounded-full bg-blue-600" />}</div>
            </Link>
          ))}</div>}
        </section>
        <BottomNav />
      </div>
    </main>
  );
}
