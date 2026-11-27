import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/prisma/db";
import BottomNav from "@/components/BottomNav";
import ChatThread from "@/components/ChatThread";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { conversationId } = await params;
  const conversation = await db.orm.Conversation.where({ id: conversationId }).first();
  if (!conversation || (conversation.userOneId !== session.userId && conversation.userTwoId !== session.userId)) redirect("/messages");
  const otherId = conversation.userOneId === session.userId ? conversation.userTwoId : conversation.userOneId;
  const otherUser = await db.orm.User.where({ id: otherId }).first();
  if (!otherUser) redirect("/messages");

  return <main className="flex min-h-screen justify-center bg-zinc-50"><div className="flex min-h-screen w-full max-w-md flex-col bg-white"><ChatThread conversationId={conversation.id} userId={session.userId} otherUser={{ fullName: otherUser.fullName, username: otherUser.username, avatarUrl: otherUser.avatarUrl }} /><BottomNav /></div></main>;
}
